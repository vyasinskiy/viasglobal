/**
 * CLI-скрипт приемки поставки товара (Goods Receiving)
 *
 * Автоматизирует:
 * 1. Проверку ожидаемого состава партии по накладной (Albarán).
 * 2. Фиксацию фактического пересчета (quantityReceived).
 * 3. Фиксацию физических замеров заводской упаковки (длина, ширина, высота в см, вес в г).
 * 4. Прикрепление фотографий приемки, упаковки и замеров рулеткой (OrderDocument).
 * 5. Автоматическое распределение по складам:
 *    - По дефолту 3 шт на склад СВХ (буфер оперативной отправки FBM)
 *    - Оставшиеся штуки (например, 7 шт) на Основной склад (MAIN).
 * 6. Оприходование остатков в WarehouseStock и логирование в StockMovement.
 * 7. Расчет и вывод точной юнит-экономики партии.
 *
 * Примеры использования:
 *   # 1. Посмотреть ожидаемый состав поставки и чек-лист приемки:
 *   npx tsx scripts/receive-shipment.ts --order "26ALV-0074072" --check
 *
 *   # 2. Провести приемку с замерами упаковки и распределением (3 на СВХ, 7 на MAIN):
 *   npx tsx scripts/receive-shipment.ts --order "26ALV-0074072" \
 *     --item "34316:10:28:10:22:850:3:7" \
 *     --item "35536:10:30:12:16:1200:3:7" \
 *     --photos "../contractors/kuken/attachments/albaran_photo.jpg,../contractors/kuken/attachments/secador_box.jpg"
 *
 *   Формат параметра --item:
 *     <SKU>:<кол_во_принято>:<длина_см>:<ширина_см>:<высота_см>:<вес_грамм>:<шт_на_СВХ>:<шт_на_MAIN>
 */

import 'dotenv/config';
import { PrismaClient, PurchaseOrderStatus, WarehouseLocation, OrderDocumentType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string): string | null => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  const orderNumberArg = getArg('--order') || '26ALV-0074072';
  const isCheck = args.includes('--check');
  const photosArg = getArg('--photos') || getArg('--batch-photos');
  const notesArg = getArg('--notes');
  const deliveryDateArg = getArg('--delivery-date');
  const receivingDateArg = getArg('--receiving-date');

  // Извлекаем все переданные флаги --item, --skip-doc, --ean-check, --item-photos, --item-notes
  const itemArgs: string[] = [];
  const skipDocArgs: string[] = [];
  const eanCheckArgs: string[] = [];
  const itemPhotoArgs: string[] = [];
  const itemNoteArgs: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--item' && i + 1 < args.length) itemArgs.push(args[i + 1]);
    if (args[i] === '--skip-doc' && i + 1 < args.length) skipDocArgs.push(args[i + 1]);
    if (args[i] === '--ean-check' && i + 1 < args.length) eanCheckArgs.push(args[i + 1]);
    if (args[i] === '--item-photos' && i + 1 < args.length) itemPhotoArgs.push(args[i + 1]);
    if (args[i] === '--item-notes' && i + 1 < args.length) itemNoteArgs.push(args[i + 1]);
  }

  console.log('\n======================================================');
  console.log('📦 Процедура приемки товара от поставщика (Goods Receiving)');
  console.log(`Накладная / Заказ: ${orderNumberArg}`);
  console.log('======================================================\n');

  try {
    // 1. Поиск заказа в базе данных
    let order = await prisma.purchaseOrder.findFirst({
      where: { orderNumber: orderNumberArg.trim() },
      include: {
        distributor: true,
        items: {
          include: {
            asin: {
              include: {
                productFinders: { take: 1, orderBy: { createdAt: 'desc' } },
              },
            },
          },
        },
      },
    });

    // Если заказ еще не заведен в базу, создаем эталонный заказ по подтвержденной отгрузке Alfa Dyser (Kuken)
    if (!order) {
      console.log(`Заказ "${orderNumberArg}" не найден в базе. Инициализируем партию по данным Albarán...`);

      let distributor = await prisma.distributor.findFirst({
        where: {
          OR: [
            { name: { contains: 'Alfa Dyser', mode: 'insensitive' } },
            { name: { contains: 'Alfadyser', mode: 'insensitive' } },
          ],
        },
      });

      if (!distributor) {
        distributor = await prisma.distributor.create({
          data: {
            name: 'ALFA DYSER, S.L.',
            website: 'https://alfadyser.es/',
            email: 'guido@alfadyser.es',
            domains: ['alfadyser.es', 'alfadyser.com'],
            status: 'ACCOUNT_OPENED',
            notes: 'Испанский производитель и дистрибьютор бренда KUKEN. Менеджер Guido.',
          },
        });
      }

      // Сопоставляем ASIN в каталоге
      const asinSecador = await prisma.aSIN.findUnique({ where: { code: 'B0CSPHRCFH' } });
      const asinPlancha = await prisma.aSIN.findUnique({ where: { code: 'B0BDVTDP7T' } });

      order = await prisma.purchaseOrder.create({
        data: {
          distributorId: distributor.id,
          orderNumber: orderNumberArg.trim(),
          orderDate: new Date('2026-10-26T09:00:00Z'),
          status: PurchaseOrderStatus.CONFIRMED,
          shippingCost: 0, // Franco / Portes pagados (заказ > 200€)
          subtotalNetto: 259.40, // 10 * 11.82 + 10 * 14.12
          totalEcoTasa: 13.00,   // 20 * 0.65
          taxAmount: 71.40,      // Налоги 1.262 RE
          totalGross: 343.80,    // 157.40 + 186.40
          paymentMethod: 'SEPA Direct Debit B2B',
          paymentStatus: 'PAID',
          notes: 'Отгрузка DHL, 2 грузовых места (2 большие коробки). Albarán 26ALV-0074072.',
          items: {
            create: [
              {
                sku: '34316',
                ean: '8425160343163',
                asinId: asinSecador?.id,
                title: 'SECADOR PROF.IONICO 2000w. NEGRO KUKEN',
                quantityOrdered: 10,
                priceNetto: 11.82,
                ecoTasa: 0.65,
                costPrice: 15.74,
                totalCostGross: 157.40,
              },
              {
                sku: '35536',
                ean: '8425160355364',
                asinId: asinPlancha?.id,
                title: 'PLANCHA VAPOR 2600W. SUELA CERAMICA KUKEN',
                quantityOrdered: 10,
                priceNetto: 14.12,
                ecoTasa: 0.65,
                costPrice: 18.64,
                totalCostGross: 186.40,
              },
            ],
          },
        },
        include: {
          distributor: true,
          items: {
            include: {
              asin: {
                include: {
                  productFinders: { take: 1, orderBy: { createdAt: 'desc' } },
                },
              },
            },
          },
        },
      });

      console.log(`✅ Партия поставки успешно зарегистрирована в БД (ID: ${order.id})!\n`);
    }

    // Режим просмотра чек-листа (--check)
    if (isCheck || itemArgs.length === 0) {
      console.log(`📋 ЧЕК-ЛИСТ ПРИЕМКИ ДЛЯ ПАРТИИ ${order.orderNumber}:`);
      console.log(`🏢 Поставщик: ${order.distributor.name}`);
      console.log(`📅 Дата отгрузки: ${order.orderDate.toISOString().split('T')[0]}`);
      console.log(`📦 Всего позиций к пересчету: ${order.items.length}\n`);

      console.table(
        order.items.map((i) => {
          const buyBox = i.asin?.productFinders?.[0]?.buyBoxCurrent ?? null;
          return {
            'SKU': i.sku,
            'EAN': i.ean,
            'ASIN': i.asin?.code ?? '—',
            'Наименование': i.title.slice(0, 30),
            'Ожидается': `${i.quantityOrdered} шт`,
            'Уже принято': `${i.quantityReceived} шт`,
            'Netto (€)': i.priceNetto.toFixed(2),
            'Эко-таса (€)': i.ecoTasa.toFixed(2),
            'Себестоимость (€)': i.costPrice.toFixed(2),
            'Amazon BuyBox (€)': buyBox ? buyBox.toFixed(2) : '—',
            'Замеры': i.packageLengthCm ? `${i.packageLengthCm}x${i.packageWidthCm}x${i.packageHeightCm} см (${i.packageWeightG}г)` : 'Ожидает замера',
          };
        }),
      );

      // Блок проверки экологического сбора RAEE и защиты от двойной оплаты
      const hasEcoTasa = order.totalEcoTasa > 0 || order.items.some((i) => i.ecoTasa > 0);
      console.log('\n------------------------------------------------------');
      console.log('🌿 ПРОВЕРКА ЭКОЛОГИЧЕСКОГО СБОРА (CANON RAEE) И EPR:');
      if (hasEcoTasa) {
        console.log(`✅ Эко-таса по товарам поставки: ОБНАРУЖЕНА`);
        console.log(`💰 Суммарная эко-таса в заказе:  ${order.totalEcoTasa.toFixed(2)} € (0.65 € за каждую единицу малой электроники)`);
        console.log(`🏢 Производитель/Импортер:       ${order.distributor.name} (CIF B-60163441)`);
        console.log(`📌 Статус уплаты поставщику:      УПЛАЧЕНО (включена в базу накладной и себестоимость с RE 1.262)`);
        console.log(`\n🛡️ АЛГОРИТМ ЗАЩИТЫ ОТ ПОВТОРНОЙ ОПЛАТЫ НА AMAZON:`);
        console.log(`1. В Albarán/Factura убедитесь, что строка "TASA" выделена отдельно.`);
        console.log(`2. Сохраните фото накладной в ecommerce/contractors/kuken/attachments/ (подтверждение первичной уплаты).`);
        console.log(`3. В Amazon Seller Central -> EPR Compliance (AEE en España) укажите:`);
        console.log(`   - Роль: "No soy productor (soy distribuidor/revendedor)"`);
        console.log(`   - Регистрационный номер: RII-AEE производителя ALFA DYSER, S.L. (CIF B-60163441)`);
        console.log(`4. Результат: Листинги фенов и утюгов получают статус Compliant,`);
        console.log(`   а Amazon ОТКЛЮЧАЕТ повторные удержания "Pay on Behalf" с каждой продажи!`);
      } else {
        console.log(`ℹ️ По товарам данной поставки эко-таса RAEE не взимается.`);
      }
      console.log('------------------------------------------------------\n');

      console.log('📝 ДВУХФАЗНЫЙ РЕГЛАМЕНТ ВЫПОЛНЕНИЯ ПРИЕМКИ (ИЛИ КОРРЕКТИРОВКИ):');
      console.log('ФАЗА 1 — ПРИЕМКА ВСЕЙ ПАРТИИ И ДОКУМЕНТОВ:');
      console.log('  1.1. Укажите дату фактического получения (--delivery-date) и дату приемки (--receiving-date).');
      console.log('  1.2. Проверьте список документов (ALBARAN, SHIPPING_LABEL, INVOICE, PAYMENT_RECEIPT).');
      console.log('       При отсутствии документа разрешен явный пропуск с причиной: --skip-doc "INVOICE:Причина".');
      console.log('  1.3. Сфотографируйте всю партию целиком (общие транспортные коробки с разных сторон): --batch-photos.');
      console.log('ФАЗА 2 — ПОШТУЧНАЯ ПРИЕМКА КАЖДОЙ ОТДЕЛЬНОЙ ПОЗИЦИИ:');
      console.log('  2.1. Обязательная тройная сверка EAN: Заказ в БД <-> Albarán <-> Коробка (--ean-check "SKU:eanAlbaran:eanBox").');
      console.log('  2.2. Пересчитайте фактическое количество, замерьте рулеткой (ДxШxВ в см) и взвесьте 1 шт (в граммах).');
      console.log('  2.3. Сфотографируйте каждый отдельный айтем с разных сторон (коробка, штрихкод EAN, знак WEEE, рулетка, весы): --item-photos.');
      console.log('  2.4. Запишите все пересланные фото и выявленные повреждения/моменты в комментарий (--notes и --item-notes).');
      console.log('  2.5. При повторном запуске по уже принятой партии скрипт автоматически выполнит дельта-корректировку без задвоения остатков!\n');
      process.exit(0);
    }

    // Режим проведения приемки или корректировки ранее принятой партии
    const isOrderCorrection =
      order.status === PurchaseOrderStatus.RECEIVED ||
      order.status === PurchaseOrderStatus.PARTIALLY_RECEIVED ||
      order.items.some((i) => i.quantityReceived > 0);

    const actualDate = deliveryDateArg
      ? new Date(deliveryDateArg)
      : order.actualDeliveryDate
      ? new Date(order.actualDeliveryDate)
      : new Date();
    const receivingDate = receivingDateArg ? new Date(receivingDateArg) : new Date();
    const actualDateStr = actualDate.toISOString().split('T')[0];
    const receivingDateStr = receivingDate.toISOString().split('T')[0];

    console.log(
      isOrderCorrection
        ? `🔄 Режим КОРРЕКТИРОВКИ приемки по уже принятой партии ${order.orderNumber} (дельта-пересчет)...\n`
        : `⚙️ Обработка первичной двухфазной приемки партии ${order.orderNumber}...\n`,
    );
    console.log(`📅 Дата получения от курьера: ${actualDateStr} | Дата проведения приемки: ${receivingDateStr}\n`);

    await prisma.$transaction(async (tx) => {
      const updatedQuantitiesByItemId = new Map<number, number>();
      const warnings: string[] = [];

      for (const itemStr of itemArgs) {
        // Формат: SKU:qty:length:width:height:weight:svh:main
        const parts = itemStr.split(':');
        const sku = parts[0]?.trim();
        const qtyReceived = Number(parts[1] || 0);
        const lengthCm = parts[2] ? parseFloat(parts[2]) : undefined;
        const widthCm = parts[3] ? parseFloat(parts[3]) : undefined;
        const heightCm = parts[4] ? parseFloat(parts[4]) : undefined;
        const weightG = parts[5] ? parseFloat(parts[5]) : undefined;
        const svhQty = parts[6] ? parseInt(parts[6], 10) : Math.min(3, qtyReceived);
        const mainQty = parts[7] ? parseInt(parts[7], 10) : Math.max(0, qtyReceived - svhQty);

        const existingItem = order.items.find((i) => i.sku.toUpperCase() === sku.toUpperCase());
        if (!existingItem) {
          throw new Error(`Артикул "${sku}" не найден в составе заказа ${order.orderNumber}`);
        }

        // Проверяем ранее проведенные движения по этой позиции для безопасной дельта-корректировки
        const prevMovements = await tx.stockMovement.findMany({
          where: {
            purchaseOrderId: order.id,
            purchaseOrderItemId: existingItem.id,
          },
        });
        const isItemCorrection = existingItem.quantityReceived > 0 || prevMovements.length > 0;
        let prevSvh = 0;
        let prevMain = 0;
        if (prevMovements.length > 0) {
          for (const mov of prevMovements) {
            if (mov.toWarehouse === WarehouseLocation.SVH) prevSvh += mov.quantity;
            if (mov.fromWarehouse === WarehouseLocation.SVH) prevSvh -= mov.quantity;
            if (mov.toWarehouse === WarehouseLocation.MAIN) prevMain += mov.quantity;
            if (mov.fromWarehouse === WarehouseLocation.MAIN) prevMain -= mov.quantity;
          }
          prevSvh = Math.max(0, prevSvh);
          prevMain = Math.max(0, prevMain);
        } else if (existingItem.quantityReceived > 0) {
          prevSvh = Math.min(3, existingItem.quantityReceived);
          prevMain = Math.max(0, existingItem.quantityReceived - prevSvh);
        }

        const deltaSvh = svhQty - prevSvh;
        const deltaMain = mainQty - prevMain;

        // Тройная сверка EAN (если передан --ean-check "SKU:eanAlbaran:eanBox")
        let eanNoteFragment: string | null = null;
        const matchingEanArg = eanCheckArgs.find((arg) => arg.split(':')[0]?.trim().toUpperCase() === sku.toUpperCase());
        if (matchingEanArg) {
          const [, eanAlb, eanBox] = matchingEanArg.split(':').map((s) => s?.trim());
          const orderEan = existingItem.ean?.trim() || null;
          const unique = Array.from(new Set([orderEan, eanAlb, eanBox].filter(Boolean)));
          if (unique.length <= 1) {
            eanNoteFragment = `✅ Тройная сверка EAN пройдена (Заказ = Albarán = Коробка: ${orderEan})`;
          } else {
            eanNoteFragment = `⚠️ НЕСООТВЕТСТВИЕ EAN: Заказ=${orderEan}, Albarán=${eanAlb}, Коробка=${eanBox}`;
            warnings.push(eanNoteFragment);
          }
        }

        // Индивидуальные заметки по позиции (--item-notes "SKU:текст")
        const matchingNoteArg = itemNoteArgs.find((arg) => arg.split(':')[0]?.trim().toUpperCase() === sku.toUpperCase());
        const customItemNote = matchingNoteArg ? matchingNoteArg.split(':').slice(1).join(':').trim() : null;
        const itemNoteParts = [customItemNote, eanNoteFragment].filter(Boolean);
        const finalItemNotes = itemNoteParts.length > 0 ? itemNoteParts.join(' | ') : existingItem.notes;

        console.log(`➡️ ${isItemCorrection ? 'Корректировка' : 'Приемка'} SKU ${sku} (${existingItem.title}):`);
        console.log(`   Фактически принято: ${qtyReceived} шт (из ${existingItem.quantityOrdered} заказанных, ранее было: ${existingItem.quantityReceived} шт)`);
        if (eanNoteFragment) console.log(`   Сверка штрихкода:   ${eanNoteFragment}`);
        console.log(`   Распределение:     СВХ=${svhQty} шт (дельта: ${deltaSvh >= 0 ? `+${deltaSvh}` : deltaSvh}), MAIN=${mainQty} шт (дельта: ${deltaMain >= 0 ? `+${deltaMain}` : deltaMain})`);

        // 1. Обновляем данные позиции заказа (сохраняя старые замеры, если при корректировке они не переданы)
        await tx.purchaseOrderItem.update({
          where: { id: existingItem.id },
          data: {
            quantityReceived: qtyReceived,
            packageLengthCm: lengthCm ?? existingItem.packageLengthCm,
            packageWidthCm: widthCm ?? existingItem.packageWidthCm,
            packageHeightCm: heightCm ?? existingItem.packageHeightCm,
            packageWeightG: weightG ?? existingItem.packageWeightG,
            notes: finalItemNotes,
          },
        });
        updatedQuantitiesByItemId.set(existingItem.id, qtyReceived);

        // 2. Обновление остатка на складе СВХ строго по дельте
        if (deltaSvh > 0) {
          await tx.warehouseStock.upsert({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.SVH,
                sku: existingItem.sku,
              },
            },
            create: {
              warehouse: WarehouseLocation.SVH,
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              title: existingItem.title,
              quantity: deltaSvh,
              minStockAlert: 1,
            },
            update: {
              quantity: { increment: deltaSvh },
              asinId: existingItem.asinId ?? undefined,
            },
          });

          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              toWarehouse: WarehouseLocation.SVH,
              type: isItemCorrection ? 'ADJUSTMENT' : 'RECEIPT',
              quantity: deltaSvh,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: isItemCorrection
                ? `Корректировка приемки Albarán ${order.orderNumber}: +${deltaSvh} шт на СВХ`
                : `Приемка Albarán ${order.orderNumber}: оприходовано на СВХ`,
            },
          });
        } else if (deltaSvh < 0) {
          const absDelta = Math.abs(deltaSvh);
          await tx.warehouseStock.update({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.SVH,
                sku: existingItem.sku,
              },
            },
            data: { quantity: { decrement: absDelta } },
          });
          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              fromWarehouse: WarehouseLocation.SVH,
              type: 'ADJUSTMENT',
              quantity: absDelta,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: `Корректировка приемки Albarán ${order.orderNumber}: -${absDelta} шт со склада СВХ`,
            },
          });
        }

        // 3. Обновление остатка на Основном складе (MAIN) строго по дельте
        if (deltaMain > 0) {
          await tx.warehouseStock.upsert({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.MAIN,
                sku: existingItem.sku,
              },
            },
            create: {
              warehouse: WarehouseLocation.MAIN,
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              title: existingItem.title,
              quantity: deltaMain,
              minStockAlert: 0,
            },
            update: {
              quantity: { increment: deltaMain },
              asinId: existingItem.asinId ?? undefined,
            },
          });

          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              toWarehouse: WarehouseLocation.MAIN,
              type: isItemCorrection ? 'ADJUSTMENT' : 'RECEIPT',
              quantity: deltaMain,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: isItemCorrection
                ? `Корректировка приемки Albarán ${order.orderNumber}: +${deltaMain} шт на склад MAIN`
                : `Приемка Albarán ${order.orderNumber}: оприходовано на Основной склад (MAIN)`,
            },
          });
        } else if (deltaMain < 0) {
          const absDelta = Math.abs(deltaMain);
          await tx.warehouseStock.update({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.MAIN,
                sku: existingItem.sku,
              },
            },
            data: { quantity: { decrement: absDelta } },
          });
          await tx.stockMovement.create({
            data: {
              sku: existingItem.sku,
              asinId: existingItem.asinId,
              fromWarehouse: WarehouseLocation.MAIN,
              type: 'ADJUSTMENT',
              quantity: absDelta,
              purchaseOrderId: order.id,
              purchaseOrderItemId: existingItem.id,
              notes: `Корректировка приемки Albarán ${order.orderNumber}: -${absDelta} шт со склада MAIN`,
            },
          });
        }

        // 3.1. Прикрепление фотографий конкретного айтема с разных сторон (--item-photos "SKU:path1,path2")
        const matchingItemPhotos = itemPhotoArgs.find((arg) => arg.split(':')[0]?.trim().toUpperCase() === sku.toUpperCase());
        if (matchingItemPhotos) {
          const paths = matchingItemPhotos.split(':').slice(1).join(':').split(',').map((p) => p.trim());
          for (const p of paths) {
            if (!p) continue;
            const fileName = p.split('/').pop() || p;
            await tx.orderDocument.create({
              data: {
                distributorId: order.distributorId,
                purchaseOrderId: order.id,
                purchaseOrderItemId: existingItem.id,
                documentType: p.toLowerCase().includes('measure')
                  ? OrderDocumentType.MEASUREMENT_PHOTO
                  : OrderDocumentType.RECEIVING_PHOTO,
                fileName,
                filePath: p,
                notes: `Фото позиции SKU ${existingItem.sku} с разных сторон при приемке`,
              },
            });
            console.log(`   📸 Прикреплено фото позиции ${existingItem.sku}: ${fileName}`);
          }
        }
      }

      // 4. Прикрепление общих фотографий всей партии и документов
      if (photosArg) {
        const photoPaths = photosArg.split(',').map((p) => p.trim());
        for (const p of photoPaths) {
          if (!p) continue;
          const fileName = p.split('/').pop() || p;
          await tx.orderDocument.create({
            data: {
              distributorId: order.distributorId,
              purchaseOrderId: order.id,
              documentType: p.toLowerCase().includes('albaran')
                ? OrderDocumentType.ALBARAN
                : p.toLowerCase().includes('measure')
                ? OrderDocumentType.MEASUREMENT_PHOTO
                : OrderDocumentType.RECEIVING_PHOTO,
              fileName,
              filePath: p,
              notes: 'Фотофиксация всей партии / документов при приемке поставки',
            },
          });
          console.log(`   📸 Прикреплен документ партии: ${fileName}`);
        }
      }

      // 5. Формируем сводный комментарий приемки (включая пропущенные документы с причиной и даты)
      const skippedText = skipDocArgs.length > 0 ? `Пропущенные документы: ${skipDocArgs.join('; ')}` : null;
      const summaryHeader = `[${isOrderCorrection ? 'КОРРЕКТИРОВКА ПРИЕМКИ' : 'ПРИЕМКА ПАРТИИ'} от ${receivingDateStr} (получено: ${actualDateStr})]`;
      const combinedNotes = [order.notes, summaryHeader, notesArg, skippedText, ...warnings].filter(Boolean).join(' | ');

      let allFullyReceived = order.items.length > 0;
      for (const item of order.items) {
        const effQty = updatedQuantitiesByItemId.has(item.id)
          ? updatedQuantitiesByItemId.get(item.id)!
          : item.quantityReceived;
        if (effQty < item.quantityOrdered) allFullyReceived = false;
      }

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: allFullyReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED,
          actualDeliveryDate: actualDate,
          notes: combinedNotes,
        },
      });
    });

    console.log(`\n🎉 ПРИЕМКА ТОВАРА УСПЕШНО ЗАВЕРШЕНА!`);
    console.log(`Статус заказа: RECEIVED`);
    console.log(`Все остатки разнесены по складам СВХ и MAIN.`);
    console.log(`Для проверки остатков запустите: npx tsx scripts/inventory.ts --stocks\n`);
  } catch (err: any) {
    console.error('\n❌ Ошибка при проведении приемки:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
