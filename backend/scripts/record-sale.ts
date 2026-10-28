/**
 * CLI-утилита для фиксации продажи на Amazon / маркетплейсе
 *
 * Автоматизирует:
 * 1. Списание 1 шт (или N шт) со склада СВХ (буфер оперативной отправки).
 * 2. Партионное списание FIFO: привязку к конкретной партии закупки поставщика (PurchaseOrderItem).
 * 3. Фиксацию точной себестоимости партии и расчет чистой прибыли с продажи.
 * 4. Контроль остатка на СВХ: если остаток падает до <= 1 шт, выводит заметный алерт о необходимости пополнения с Основного склада!
 *
 * Примеры использования:
 *   # Продажа фена KUKEN 34316 на Amazon по цене 26.70 €:
 *   npx tsx scripts/record-sale.ts \
 *     --order "402-1234567-8901234" \
 *     --sku "34316" \
 *     --qty 1 \
 *     --price 26.70 \
 *     --fee 4.01 \
 *     --shipping 4.50 \
 *     --city "Valencia"
 */

import 'dotenv/config';
import { PrismaClient, WarehouseLocation, StockMovementType, SalesOrderStatus } from '@prisma/client';
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

  const orderNumberArg = getArg('--order');
  const skuArg = getArg('--sku');
  const qtyArg = getArg('--qty') ? parseInt(getArg('--qty')!, 10) : 1;
  const priceArg = getArg('--price') ? parseFloat(getArg('--price')!) : null;
  const feeArg = getArg('--fee') ? parseFloat(getArg('--fee')!) : null;
  const shippingArg = getArg('--shipping') ? parseFloat(getArg('--shipping')!) : 0;
  const cityArg = getArg('--city') || 'Madrid';

  console.log('\n======================================================');
  console.log('🛒 Регистрация продажи маркетплейса (Amazon FBM)');
  console.log('======================================================\n');

  if (!orderNumberArg || !skuArg || priceArg === null) {
    console.log('Укажите обязательные параметры:');
    console.log('  npx tsx scripts/record-sale.ts --order "<Amazon_Order_ID>" --sku "<артикул>" --price <цена_продажи> [--fee <комиссия>] [--shipping <доставка>] [--city <город>]');
    console.log('\nПример:');
    console.log('  npx tsx scripts/record-sale.ts --order "402-1234567-8901234" --sku "34316" --price 26.70 --fee 4.01 --shipping 4.50 --city "Valencia"\n');
    process.exit(1);
  }

  try {
    const cleanSku = skuArg.trim();
    const platformFee = feeArg ?? Math.round(priceArg * 0.15 * 100) / 100;

    console.log(`Продажа: Заказ Amazon ${orderNumberArg}`);
    console.log(`Товар:   SKU ${cleanSku}, Количество: ${qtyArg} шт`);
    console.log(`Цена:    ${priceArg.toFixed(2)} €, Комиссия Amazon: ${platformFee.toFixed(2)} €, Доставка: ${shippingArg.toFixed(2)} €`);
    console.log(`Город:   ${cityArg}\n`);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Проверяем остаток на СВХ
      const svhStock = await tx.warehouseStock.findUnique({
        where: {
          warehouse_sku: {
            warehouse: WarehouseLocation.SVH,
            sku: cleanSku,
          },
        },
      });

      if (!svhStock || svhStock.quantity < qtyArg) {
        throw new Error(
          `Недостаточно товара на складе СВХ! Доступно: ${svhStock?.quantity ?? 0} шт, требуется списать: ${qtyArg} шт. Пополните СВХ со склада MAIN.`,
        );
      }

      const newSvhQty = svhStock.quantity - qtyArg;

      // 2. Списываем с остатка СВХ
      await tx.warehouseStock.update({
        where: { id: svhStock.id },
        data: { quantity: newSvhQty },
      });

      // 3. Создаем заказ продажи SalesOrder
      const totalAmount = priceArg * qtyArg;
      const totalFees = platformFee * qtyArg;
      const totalShipping = shippingArg * qtyArg;
      const netAmount = Math.round((totalAmount - totalFees - totalShipping) * 100) / 100;

      const salesOrder = await tx.salesOrder.create({
        data: {
          platform: 'AMAZON',
          orderNumber: orderNumberArg.trim(),
          orderDate: new Date(),
          status: SalesOrderStatus.SHIPPED,
          fulfillmentChannel: 'FBM',
          warehouse: WarehouseLocation.SVH,
          totalAmount,
          platformFees: totalFees,
          shippingFee: totalShipping,
          netAmount,
          customerCity: cityArg,
          customerCountry: 'ES',
        },
      });

      // 4. Логируем движение в StockMovement
      await tx.stockMovement.create({
        data: {
          sku: cleanSku,
          asinId: svhStock.asinId,
          fromWarehouse: WarehouseLocation.SVH,
          type: StockMovementType.SALE_OUT,
          quantity: qtyArg,
          salesOrderId: salesOrder.id,
          notes: `Продажа на Amazon (Заказ: ${orderNumberArg}): списано со склада СВХ`,
        },
      });

      // 5. Партионное списание FIFO (Batch Allocation)
      const batches = await tx.purchaseOrderItem.findMany({
        where: { sku: cleanSku, quantityReceived: { gt: 0 } },
        include: { purchaseOrder: true, allocations: true },
        orderBy: { purchaseOrder: { orderDate: 'asc' } },
      });

      let remainingToAllocate = qtyArg;
      let totalCostAllocated = 0;
      let allocatedCount = 0;

      const salesOrderItem = await tx.salesOrderItem.create({
        data: {
          salesOrderId: salesOrder.id,
          sku: cleanSku,
          asinId: svhStock.asinId,
          quantity: qtyArg,
          salePrice: priceArg,
          platformFee,
          shippingCost: shippingArg,
          costPrice: null,
          netProfit: null,
        },
      });

      const batchDetails: Array<{ batchOrder: string; qty: number; cost: number }> = [];

      for (const b of batches) {
        if (remainingToAllocate <= 0) break;
        const alreadyAllocated = b.allocations.reduce((sum, a) => sum + a.quantity, 0);
        const freeInBatch = Math.max(0, b.quantityReceived - alreadyAllocated);

        if (freeInBatch > 0) {
          const take = Math.min(remainingToAllocate, freeInBatch);
          await tx.batchSalesAllocation.create({
            data: {
              purchaseOrderItemId: b.id,
              salesOrderItemId: salesOrderItem.id,
              quantity: take,
              costPriceAtAllocation: b.costPrice,
            },
          });

          batchDetails.push({ batchOrder: b.purchaseOrder.orderNumber, qty: take, cost: b.costPrice });
          totalCostAllocated += b.costPrice * take;
          allocatedCount += take;
          remainingToAllocate -= take;
        }
      }

      const avgUnitCost = allocatedCount > 0 ? Math.round((totalCostAllocated / allocatedCount) * 100) / 100 : 0;
      const netProfitUnit = Math.round((priceArg - platformFee - shippingArg - avgUnitCost) * 100) / 100;

      await tx.salesOrderItem.update({
        where: { id: salesOrderItem.id },
        data: {
          costPrice: avgUnitCost,
          netProfit: netProfitUnit,
        },
      });

      // 6. Проверяем остаток на основном складе MAIN
      const mainStock = await tx.warehouseStock.findUnique({
        where: {
          warehouse_sku: {
            warehouse: WarehouseLocation.MAIN,
            sku: cleanSku,
          },
        },
      });

      const mainQty = mainStock ? mainStock.quantity : 0;

      return {
        salesOrderId: salesOrder.id,
        newSvhQty,
        minAlert: svhStock.minStockAlert,
        mainQty,
        avgUnitCost,
        netProfitUnit,
        totalNetProfit: Math.round(netProfitUnit * qtyArg * 100) / 100,
        batchDetails,
      };
    });

    console.log(`✅ Продажа успешно зафиксирована в системе!`);
    console.log(`   Себестоимость партии закупки: ${result.avgUnitCost.toFixed(2)} €/шт`);
    console.log(`   Чистая прибыль с единицы:     ${result.netProfitUnit > 0 ? `+${result.netProfitUnit.toFixed(2)}` : result.netProfitUnit.toFixed(2)} €`);
    console.log(`   Итого чистая прибыль:         ${result.totalNetProfit > 0 ? `+${result.totalNetProfit.toFixed(2)}` : result.totalNetProfit.toFixed(2)} €`);
    console.log(`   Списано из партий:           ${result.batchDetails.map((b) => `${b.qty} шт из партии ${b.batchOrder}`).join(', ')}`);
    console.log(`   Новый остаток на складе СВХ:  ${result.newSvhQty} шт\n`);

    // 7. Срабатывание алерта СВХ!
    if (result.newSvhQty <= result.minAlert) {
      console.log('======================================================');
      console.log('🚨 АЛЕРТ ПОПОЛНЕНИЯ СКЛАДА СВХ!');
      console.log(`   Внимание: На складе СВХ осталось всего ${result.newSvhQty} шт товара (SKU: ${cleanSku})!`);
      console.log(`   (Страховой порог: <= ${result.minAlert} шт).`);
      console.log(`   На основном складе (MAIN) в наличии: ${result.mainQty} шт.`);
      if (result.mainQty > 0) {
        const transferQty = Math.min(3, result.mainQty);
        console.log(`   👉 РЕКОМЕНДАЦИЯ: Пополнить склад СВХ на ${transferQty} шт со склада MAIN:`);
        console.log(`      npx tsx scripts/inventory.ts --transfer --sku ${cleanSku} --from MAIN --to SVH --qty ${transferQty}`);
      } else {
        console.log(`   🚨 ВНИМАНИЕ: На основном складе запас также исчерпан (0 шт)! Срочно сформируйте заказ поставщику!`);
      }
      console.log('======================================================\n');
    }
  } catch (err: any) {
    console.error('❌ Ошибка при оформлении продажи:', err.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
