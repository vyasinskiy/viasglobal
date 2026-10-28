/**
 * CLI-утилита для просмотра заказов поставщиков и юнит-экономики партий
 *
 * Примеры использования:
 *   # Просмотр всех заказов конкретного поставщика:
 *   npx tsx scripts/orders.ts --distributor "Alfa Dyser" --list
 *
 *   # Просмотр детальной карточки заказа и юнит-экономики:
 *   npx tsx scripts/orders.ts --order "26ALV-0074072"
 *   npx tsx scripts/orders.ts --order 1
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
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

  const distributorQuery = getArg('--distributor');
  const orderQuery = getArg('--order');
  const isList = args.includes('--list');

  console.log('\n======================================================');
  console.log('📦 Управление заказами поставщиков и юнит-экономика');
  console.log('======================================================\n');

  try {
    if (distributorQuery) {
      // 1. Поиск дистрибьютора
      const dist = await prisma.distributor.findFirst({
        where: {
          OR: [
            { name: { contains: distributorQuery, mode: 'insensitive' } },
            { notes: { contains: distributorQuery, mode: 'insensitive' } },
          ],
        },
      });

      if (!dist) {
        console.error(`❌ Поставщик "${distributorQuery}" не найден в базе данных.`);
        process.exit(1);
      }

      console.log(`🏢 Поставщик: ${dist.name} (ID: ${dist.id}, Статус: ${dist.status})`);
      if (dist.email) console.log(`📧 Email: ${dist.email}`);
      if (dist.website) console.log(`🌐 Сайт: ${dist.website}`);

      const orders = await prisma.purchaseOrder.findMany({
        where: { distributorId: dist.id },
        include: {
          items: true,
          documents: true,
        },
        orderBy: { orderDate: 'desc' },
      });

      console.log(`\n📋 Найдено заказов: ${orders.length}\n`);

      if (orders.length === 0) {
        console.log('У данного поставщика пока нет зарегистрированных заказов.');
      } else {
        console.table(
          orders.map((o) => ({
            'ID': o.id,
            'Номер заказа / Накладная': o.orderNumber,
            'Статус': o.status,
            'Дата заказа': o.orderDate.toISOString().split('T')[0],
            'Дата приемки': o.actualDeliveryDate ? o.actualDeliveryDate.toISOString().split('T')[0] : '—',
            'Позиций': o.items.length,
            'Чистая база (€)': o.subtotalNetto.toFixed(2),
            'Эко-таса (€)': o.totalEcoTasa.toFixed(2),
            'Налоги IVA+RE (€)': o.taxAmount.toFixed(2),
            'Итого брутто (€)': o.totalGross.toFixed(2),
            'Документов': o.documents.length,
          })),
        );
      }
    } else if (orderQuery) {
      // 2. Детальный просмотр конкретного заказа
      let whereClause: any;
      if (!isNaN(Number(orderQuery)) && !orderQuery.includes('-')) {
        whereClause = { id: Number(orderQuery) };
      } else {
        whereClause = { orderNumber: orderQuery.trim() };
      }

      const order = await prisma.purchaseOrder.findFirst({
        where: whereClause,
        include: {
          distributor: true,
          items: {
            include: {
              asin: {
                include: {
                  productFinders: { take: 1, orderBy: { createdAt: 'desc' } },
                },
              },
              allocations: {
                include: {
                  salesOrderItem: {
                    include: { salesOrder: true },
                  },
                },
              },
            },
          },
          documents: true,
          stockMovements: { orderBy: { createdAt: 'desc' } },
        },
      });

      if (!order) {
        console.error(`❌ Заказ "${orderQuery}" не найден в базе данных.`);
        process.exit(1);
      }

      console.log(`📄 Карточка заказа: ${order.orderNumber} (ID: ${order.id})`);
      console.log(`🏢 Поставщик: ${order.distributor.name}`);
      console.log(`📌 Статус: ${order.status}`);
      console.log(`📅 Дата оформления: ${order.orderDate.toISOString().split('T')[0]}`);
      console.log(`🚚 Фактическая дата поступления: ${order.actualDeliveryDate ? order.actualDeliveryDate.toISOString().split('T')[0] : 'В пути'}`);
      console.log(`💳 Метод оплаты: ${order.paymentMethod ?? 'Не указан'} (${order.paymentStatus})`);
      if (order.notes) console.log(`📝 Заметки: ${order.notes}`);

      console.log('\n--- Финансовая сводка партии ---');
      console.log(`Чистая база (Netto):     ${order.subtotalNetto.toFixed(2)} €`);
      console.log(`Экологический сбор RAEE:  ${order.totalEcoTasa.toFixed(2)} € (Уплачено поставщику / Amazon EPR освобожден)`);
      console.log(`Налоги (21% IVA + 5.2% RE): ${order.taxAmount.toFixed(2)} €`);
      console.log(`Доставка поставщика:      ${order.shippingCost.toFixed(2)} € (Franco / Portes pagados)`);
      console.log(`Итоговая себестоимость:   ${order.totalGross.toFixed(2)} € (Gross)`);

      console.log('\n--- Состав партии и расчетная юнит-экономика ---');
      const tableData = order.items.map((item) => {
        const snap = item.asin?.productFinders?.[0];
        const buyBox = snap?.buyBoxCurrent ?? snap?.newCurrent ?? null;
        const fbaFee = snap?.fBAPickPackFee ?? null;
        const refFee = snap?.referralFee ?? (buyBox ? Math.round(buyBox * 0.15 * 100) / 100 : null);
        const fees = fbaFee !== null && refFee !== null ? fbaFee + refFee : null;
        const profit = buyBox !== null && fees !== null ? Math.round((buyBox - fees - item.costPrice) * 100) / 100 : null;
        const totalSold = item.allocations.reduce((sum, a) => sum + a.quantity, 0);

        return {
          'SKU': item.sku,
          'EAN': item.ean ?? '—',
          'ASIN': item.asin?.code ?? '—',
          'Наименование': item.title.slice(0, 32),
          'Заказано': item.quantityOrdered,
          'Принято': item.quantityReceived,
          'Продано': totalSold,
          'Остаток': Math.max(0, item.quantityReceived - totalSold),
          'Netto (€)': item.priceNetto.toFixed(2),
          'Эко-таса (€)': item.ecoTasa.toFixed(2),
          'Себестоимость (€)': item.costPrice.toFixed(2),
          'BuyBox (€)': buyBox ? buyBox.toFixed(2) : '—',
          'Комиссии (€)': fees ? fees.toFixed(2) : '—',
          'Прибыль/шт (€)': profit !== null ? (profit > 0 ? `+${profit.toFixed(2)}` : profit.toFixed(2)) : '—',
          'Замеры упаковки (ДxШxВ, вес)':
            item.packageLengthCm && item.packageWidthCm && item.packageHeightCm
              ? `${item.packageLengthCm}x${item.packageWidthCm}x${item.packageHeightCm} см (${item.packageWeightG ?? 0} г)`
              : 'Не замерено',
        };
      });

      console.table(tableData);

      if (order.documents.length > 0) {
        console.log('\n--- Прикрепленные документы и фотографии ---');
        order.documents.forEach((d, idx) => {
          console.log(`  ${idx + 1}. [${d.documentType}] ${d.fileName} (${d.filePath}) ${d.notes ? `- ${d.notes}` : ''}`);
        });
      }

      if (order.stockMovements.length > 0) {
        console.log('\n--- Журнал складских движений по данному заказу ---');
        order.stockMovements.forEach((m) => {
          console.log(`  [${m.createdAt.toISOString().split('T')[0]}] ${m.type} ${m.quantity} шт (SKU: ${m.sku}) ${m.fromWarehouse ? `со склада ${m.fromWarehouse}` : ''} ${m.toWarehouse ? `на склад ${m.toWarehouse}` : ''} - ${m.notes ?? ''}`);
        });
      }
    } else {
      console.log('Укажите параметры для работы:');
      console.log('  npx tsx scripts/orders.ts --distributor "<имя>" --list');
      console.log('  npx tsx scripts/orders.ts --order "<номер_или_id>"');
    }
  } catch (err: any) {
    console.error('Ошибка выполнения:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
