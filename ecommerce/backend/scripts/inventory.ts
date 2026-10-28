/**
 * CLI-утилита для складского учета, контроля остатков СВХ/MAIN и перемещений
 *
 * Примеры использования:
 *   # Просмотр остатков на складах:
 *   npx tsx scripts/inventory.ts --stocks
 *   npx tsx scripts/inventory.ts --stocks --warehouse SVH
 *
 *   # Проверка алертов окончания товара на СВХ (<= 1 шт):
 *   npx tsx scripts/inventory.ts --alerts
 *
 *   # Перемещение товара с Основного склада на СВХ:
 *   npx tsx scripts/inventory.ts --transfer --sku 34316 --from MAIN --to SVH --qty 3
 *
 *   # Просмотр журнала движений:
 *   npx tsx scripts/inventory.ts --movements [--sku 34316]
 */

import 'dotenv/config';
import { PrismaClient, WarehouseLocation, StockMovementType } from '@prisma/client';
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

  const isStocks = args.includes('--stocks');
  const isAlerts = args.includes('--alerts');
  const isTransfer = args.includes('--transfer');
  const isMovements = args.includes('--movements');
  const warehouseFilter = getArg('--warehouse') as WarehouseLocation | null;
  const skuArg = getArg('--sku');
  const fromArg = getArg('--from') as WarehouseLocation | null;
  const toArg = getArg('--to') as WarehouseLocation | null;
  const qtyArg = getArg('--qty') ? Number(getArg('--qty')) : null;

  console.log('\n======================================================');
  console.log('🏭 Складской учет: СВХ (Оперативный буфер) & MAIN (Основной склад)');
  console.log('======================================================\n');

  try {
    if (isAlerts) {
      // Проверка алертов на СВХ (порог <= 1 шт)
      console.log('🔍 Проверка страховых остатков на складе СВХ (Порог: <= 1 шт)...\n');

      const svhStocks = await prisma.warehouseStock.findMany({
        where: { warehouse: WarehouseLocation.SVH },
        include: {
          asin: { select: { code: true, brand: { select: { name: true } } } },
        },
      });

      const lowStockItems = svhStocks.filter((s) => s.quantity <= s.minStockAlert);

      if (lowStockItems.length === 0) {
        console.log('✅ Все товары на складе СВХ в достаточном количестве. Предупреждений нет.');
      } else {
        console.log(`⚠️ ОБНАРУЖЕНО ПРЕДУПРЕЖДЕНИЙ: ${lowStockItems.length}\n`);

        for (const item of lowStockItems) {
          const mainStock = await prisma.warehouseStock.findUnique({
            where: {
              warehouse_sku: {
                warehouse: WarehouseLocation.MAIN,
                sku: item.sku,
              },
            },
          });

          const mainQty = mainStock ? Math.max(0, mainStock.quantity - mainStock.reservedQuantity) : 0;

          if (mainQty > 0) {
            const recommended = Math.min(3, mainQty);
            console.log(`------------------------------------------------------`);
            console.log(`⚠️ ВНИМАНИЕ: Заканчивается на СВХ!`);
            console.log(`  Товар: ${item.title ?? 'Товар'} (SKU: ${item.sku}, ASIN: ${item.asin?.code ?? '—'})`);
            console.log(`  Остаток на СВХ:    ${item.quantity} шт (страховой порог: ${item.minStockAlert} шт)`);
            console.log(`  Остаток на MAIN:   ${mainQty} шт (доступно к перемещению)`);
            console.log(`  👉 РЕКОМЕНДАЦИЯ: Пополнить СВХ на ${recommended} шт со склада MAIN:`);
            console.log(`     npx tsx scripts/inventory.ts --transfer --sku ${item.sku} --from MAIN --to SVH --qty ${recommended}`);
            console.log(`------------------------------------------------------\n`);
          } else {
            console.log(`------------------------------------------------------`);
            console.log(`🚨 КРИТИЧНО: Товар полностью исчерпан!`);
            console.log(`  Товар: ${item.title ?? 'Товар'} (SKU: ${item.sku}, ASIN: ${item.asin?.code ?? '—'})`);
            console.log(`  Остаток на СВХ:  ${item.quantity} шт`);
            console.log(`  Остаток на MAIN: 0 шт`);
            console.log(`  👉 РЕКОМЕНДАЦИЯ: Срочно оформить дозаказ поставщику!`);
            console.log(`------------------------------------------------------\n`);
          }
        }
      }
    } else if (isTransfer) {
      if (!skuArg || !fromArg || !toArg || !qtyArg) {
        console.error('Ошибка: для перемещения укажите все параметры:');
        console.error('  npx tsx scripts/inventory.ts --transfer --sku <sku> --from MAIN --to SVH --qty 3');
        process.exit(1);
      }

      console.log(`📦 Оформление перемещения: ${qtyArg} шт (SKU: ${skuArg})`);
      console.log(`   Откуда: Склад ${fromArg}`);
      console.log(`   Куда:   Склад ${toArg}\n`);

      const result = await prisma.$transaction(async (tx) => {
        const source = await tx.warehouseStock.findUnique({
          where: { warehouse_sku: { warehouse: fromArg, sku: skuArg } },
        });

        if (!source || source.quantity < qtyArg) {
          throw new Error(`Недостаточно товара на складе ${fromArg}. В наличии: ${source?.quantity ?? 0} шт, запрошено: ${qtyArg} шт.`);
        }

        await tx.warehouseStock.update({
          where: { id: source.id },
          data: { quantity: { decrement: qtyArg } },
        });

        const target = await tx.warehouseStock.upsert({
          where: { warehouse_sku: { warehouse: toArg, sku: skuArg } },
          create: {
            warehouse: toArg,
            sku: skuArg,
            asinId: source.asinId,
            title: source.title,
            quantity: qtyArg,
            minStockAlert: toArg === WarehouseLocation.SVH ? 1 : 0,
          },
          update: {
            quantity: { increment: qtyArg },
          },
        });

        const movement = await tx.stockMovement.create({
          data: {
            sku: skuArg,
            asinId: source.asinId,
            fromWarehouse: fromArg,
            toWarehouse: toArg,
            type: StockMovementType.TRANSFER,
            quantity: qtyArg,
            notes: `Внутреннее пополнение склада ${toArg} с ${fromArg}`,
          },
        });

        return { source, target, movement };
      });

      console.log(`✅ Перемещение успешно завершено!`);
      console.log(`   Новый остаток на складе ${fromArg}: ${result.source.quantity - qtyArg} шт`);
      console.log(`   Новый остаток на складе ${toArg}:   ${result.target.quantity} шт\n`);
    } else if (isMovements) {
      const where: any = {};
      if (skuArg) where.sku = skuArg;

      const movements = await prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          purchaseOrder: { select: { orderNumber: true } },
          salesOrder: { select: { orderNumber: true } },
        },
      });

      console.log(`📋 Журнал последних движений товаров (${movements.length} записей):\n`);
      console.table(
        movements.map((m) => ({
          'Дата': m.createdAt.toISOString().replace('T', ' ').slice(0, 16),
          'SKU': m.sku,
          'Тип': m.type,
          'Кол-во': m.quantity,
          'Откуда': m.fromWarehouse ?? '—',
          'Куда': m.toWarehouse ?? '—',
          'Заказ': m.purchaseOrder?.orderNumber ?? m.salesOrder?.orderNumber ?? '—',
          'Примечание': m.notes ?? '',
        })),
      );
    } else {
      // По умолчанию: просмотр остатков (--stocks)
      const where: any = {};
      if (warehouseFilter) where.warehouse = warehouseFilter;

      const stocks = await prisma.warehouseStock.findMany({
        where,
        include: {
          asin: { select: { code: true } },
        },
        orderBy: [{ warehouse: 'asc' }, { sku: 'asc' }],
      });

      console.log(`📊 Текущие остатки на складах (${stocks.length} позиций):\n`);

      if (stocks.length === 0) {
        console.log('Склад пуст. Оприходуйте первую партию через приемку товара:');
        console.log('  npx tsx scripts/receive-shipment.ts --order "26ALV-0074072"');
      } else {
        console.table(
          stocks.map((s) => ({
            'Склад': s.warehouse === WarehouseLocation.SVH ? 'СВХ (Буфер)' : 'MAIN (Основной)',
            'SKU': s.sku,
            'ASIN': s.asin?.code ?? '—',
            'Наименование': (s.title ?? '').slice(0, 32),
            'В наличии': s.quantity,
            'Резерв': s.reservedQuantity,
            'Доступно': Math.max(0, s.quantity - s.reservedQuantity),
            'Порог алерта': s.minStockAlert,
            'Статус': s.warehouse === WarehouseLocation.SVH && s.quantity <= s.minStockAlert ? '⚠️ ЗАКАНЧИВАЕТСЯ' : '✅ В НОРМЕ',
          })),
        );
      }
    }
  } catch (err: any) {
    console.error('Ошибка выполнения:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
