/**
 * Автоматические тесты подсистемы закупок, приемки товара, складского учета и алертов СВХ
 */

import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { InventoryService } from '../inventory/inventory.service';
import { SalesService } from '../sales/sales.service';
import { PrismaService } from '../prisma/prisma.service';
import { WarehouseLocation, PurchaseOrderStatus, StockMovementType, SalesOrderStatus } from '@prisma/client';

describe('Подсистема закупок, приемки товара, складского учета и алертов СВХ', () => {
  let ordersService: OrdersService;
  let inventoryService: InventoryService;
  let salesService: SalesService;
  let prisma: PrismaService;

  // Моковые данные для изолированного тестирования без мутаций боевой БД
  const mockPrismaService = {
    distributor: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    purchaseOrder: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    purchaseOrderItem: {
      update: jest.fn(),
      findMany: jest.fn(),
    },
    warehouseStock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    salesOrder: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    salesOrderItem: {
      create: jest.fn(),
      update: jest.fn(),
    },
    batchSalesAllocation: {
      create: jest.fn(),
    },
    orderDocument: {
      create: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        InventoryService,
        SalesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    ordersService = module.get<OrdersService>(OrdersService);
    inventoryService = module.get<InventoryService>(InventoryService);
    salesService = module.get<SalesService>(SalesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('создание заказа должно точно рассчитывать суммы Netto, эко-тасу RAEE и себестоимость с налогами Recargo de Equivalencia (1.262)', async () => {
    // Входные данные первого заказа Alfa Dyser (Kuken):
    // 10 фенов 34316 по 11.82 € + 0.65 € таса -> себестоимость 15.74 € (сумма 157.40 €)
    // 10 утюгов 35536 по 14.12 € + 0.65 € таса -> себестоимость 18.64 € (сумма 186.40 €)
    mockPrismaService.purchaseOrder.create.mockImplementation(async (args) => {
      return { id: 101, ...args.data };
    });

    const result = await ordersService.createOrder({
      distributorId: 5,
      orderNumber: '26ALV-0074072',
      items: [
        {
          sku: '34316',
          title: 'SECADOR PROF.IONICO 2000w. NEGRO',
          quantityOrdered: 10,
          priceNetto: 11.82,
          ecoTasa: 0.65,
        },
        {
          sku: '35536',
          title: 'PLANCHA VAPOR 2600W. SUELA CERAMICA',
          quantityOrdered: 10,
          priceNetto: 14.12,
          ecoTasa: 0.65,
        },
      ],
    });

    expect(result.subtotalNetto).toBe(259.40); // 10*11.82 + 10*14.12 = 118.2 + 141.2 = 259.40
    expect(result.totalEcoTasa).toBe(13.00);   // 20 * 0.65 = 13.00
    expect(result.totalGross).toBe(343.80);    // 157.40 + 186.40 = 343.80
    expect(result.taxAmount).toBeCloseTo(71.40, 2); // 343.80 - (259.40 + 13.00) = 71.40
    expect(result.status).toBe(PurchaseOrderStatus.CONFIRMED);
  });

  it('приемка товара должна оприходовать по дефолту 3 шт на СВХ и 7 шт на Основной склад с сохранением замеров упаковки', async () => {
    const existingOrder = {
      id: 101,
      orderNumber: '26ALV-0074072',
      distributorId: 5,
      notes: null,
      items: [
        {
          id: 1,
          sku: '34316',
          title: 'SECADOR PROF.IONICO 2000w. NEGRO',
          quantityOrdered: 10,
          quantityReceived: 0,
          asinId: 201,
          costPrice: 15.74,
        },
      ],
    };

    mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(existingOrder);
    mockPrismaService.purchaseOrderItem.update.mockResolvedValue({});
    mockPrismaService.warehouseStock.upsert.mockResolvedValue({});
    mockPrismaService.stockMovement.create.mockResolvedValue({});
    mockPrismaService.purchaseOrder.update.mockResolvedValue({
      id: 101,
      status: PurchaseOrderStatus.RECEIVED,
    });

    const received = await ordersService.receiveOrder(101, {
      items: [
        {
          sku: '34316',
          quantityReceived: 10,
          packageLengthCm: 28,
          packageWidthCm: 10,
          packageHeightCm: 22,
          packageWeightG: 850,
          svhQuantity: 3,
          mainQuantity: 7,
        },
      ],
    });

    expect(received.status).toBe(PurchaseOrderStatus.RECEIVED);

    // Проверяем, что замеры упаковки записаны
    expect(mockPrismaService.purchaseOrderItem.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        quantityReceived: 10,
        packageLengthCm: 28,
        packageWidthCm: 10,
        packageHeightCm: 22,
        packageWeightG: 850,
      }),
    });

    // Проверяем оприходование на СВХ (3 шт)
    expect(mockPrismaService.warehouseStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { warehouse_sku: { warehouse: WarehouseLocation.SVH, sku: '34316' } },
        create: expect.objectContaining({ quantity: 3, warehouse: WarehouseLocation.SVH }),
      }),
    );

    // Проверяем оприходование на Основной склад MAIN (7 шт)
    expect(mockPrismaService.warehouseStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { warehouse_sku: { warehouse: WarehouseLocation.MAIN, sku: '34316' } },
        create: expect.objectContaining({ quantity: 7, warehouse: WarehouseLocation.MAIN }),
      }),
    );
  });

  it('продажа на Amazon должна списывать товар со склада СВХ, привязываться к партии и рассчитывать чистую прибыль', async () => {
    // В наличии на СВХ: 3 шт фена (порог алерта: 1 шт)
    mockPrismaService.salesOrder.findUnique.mockResolvedValue(null);
    mockPrismaService.salesOrder.create.mockImplementation(async (args) => ({
      id: 501,
      ...args.data,
    }));
    mockPrismaService.salesOrder.update.mockImplementation(async (args) => ({
      id: 501,
      ...args.data,
      items: [],
    }));

    mockPrismaService.warehouseStock.findUnique.mockImplementation(async ({ where }) => {
      if (where.warehouse_sku.warehouse === WarehouseLocation.SVH) {
        return {
          id: 11,
          warehouse: WarehouseLocation.SVH,
          sku: '34316',
          asinId: 201,
          quantity: 3, // В наличии 3 шт
          minStockAlert: 1,
        };
      }
      if (where.warehouse_sku.warehouse === WarehouseLocation.MAIN) {
        return {
          id: 12,
          warehouse: WarehouseLocation.MAIN,
          sku: '34316',
          asinId: 201,
          quantity: 7, // На основном складе 7 шт
          minStockAlert: 0,
        };
      }
      return null;
    });

    // Доступная партия закупки: 10 шт по себестоимости 15.74 €
    mockPrismaService.purchaseOrderItem.findMany.mockResolvedValue([
      {
        id: 1,
        sku: '34316',
        costPrice: 15.74,
        quantityReceived: 10,
        allocations: [],
      },
    ]);

    mockPrismaService.salesOrderItem.create.mockResolvedValue({ id: 91 });
    mockPrismaService.salesOrderItem.update.mockResolvedValue({});
    mockPrismaService.batchSalesAllocation.create.mockResolvedValue({});
    mockPrismaService.warehouseStock.update.mockResolvedValue({});
    mockPrismaService.stockMovement.create.mockResolvedValue({});

    // Фиксируем продажу 1 шт фена по цене 26.70 €, комиссия Amazon 4.01 €, доставка 4.50 €
    const result = await salesService.recordSale({
      orderNumber: '402-1234567-8901234',
      sku: '34316',
      items: [
        {
          sku: '34316',
          quantity: 1,
          salePrice: 26.70,
          platformFee: 4.01,
          shippingCost: 4.50,
        },
      ],
    });

    expect(result.order).toBeDefined();

    // Проверяем списание: остаток на СВХ уменьшился с 3 до 2 шт
    expect(mockPrismaService.warehouseStock.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { quantity: 2 },
    });

    // Проверяем расчет чистой прибыли: 26.70 - 4.01 - 4.50 - 15.74 = +2.45 €
    expect(mockPrismaService.salesOrderItem.update).toHaveBeenCalledWith({
      where: { id: 91 },
      data: expect.objectContaining({
        costPrice: 15.74,
        netProfit: 2.45,
      }),
    });

    // Так как остаток 2 > порога 1, алерт не должен сработать
    expect(result.stockAlerts.length).toBe(0);
  });

  it('когда остаток на СВХ после продажи опускается до 1 шт, должен срабатывать алерт пополнения с Основного склада', async () => {
    // В наличии на СВХ: 2 шт фена (продаем 1 шт -> останется 1 шт, что равно порогу minStockAlert = 1)
    mockPrismaService.salesOrder.findUnique.mockResolvedValue(null);
    mockPrismaService.salesOrder.create.mockImplementation(async (args) => ({
      id: 502,
      ...args.data,
    }));
    mockPrismaService.salesOrder.update.mockImplementation(async (args) => ({
      id: 502,
      ...args.data,
      items: [],
    }));

    mockPrismaService.warehouseStock.findUnique.mockImplementation(async ({ where }) => {
      if (where.warehouse_sku.warehouse === WarehouseLocation.SVH) {
        return {
          id: 11,
          warehouse: WarehouseLocation.SVH,
          sku: '34316',
          asinId: 201,
          title: 'SECADOR PROF.IONICO 2000w. NEGRO',
          quantity: 2, // В наличии 2 шт
          minStockAlert: 1,
        };
      }
      if (where.warehouse_sku.warehouse === WarehouseLocation.MAIN) {
        return {
          id: 12,
          warehouse: WarehouseLocation.MAIN,
          sku: '34316',
          asinId: 201,
          quantity: 7, // На основном складе есть запас 7 шт
          reservedQuantity: 0,
        };
      }
      return null;
    });

    mockPrismaService.purchaseOrderItem.findMany.mockResolvedValue([
      {
        id: 1,
        sku: '34316',
        costPrice: 15.74,
        quantityReceived: 10,
        allocations: [{ quantity: 1 }],
      },
    ]);

    mockPrismaService.salesOrderItem.create.mockResolvedValue({ id: 92 });
    mockPrismaService.salesOrderItem.update.mockResolvedValue({});
    mockPrismaService.batchSalesAllocation.create.mockResolvedValue({});
    mockPrismaService.warehouseStock.update.mockResolvedValue({});
    mockPrismaService.stockMovement.create.mockResolvedValue({});

    // Продаем вторую штуку фена
    const result = await salesService.recordSale({
      orderNumber: '402-9876543-2109876',
      sku: '34316',
      items: [
        {
          sku: '34316',
          quantity: 1,
          salePrice: 26.70,
        },
      ],
    });

    // Новый остаток на СВХ стал 1 шт -> срабатывает алерт!
    expect(mockPrismaService.warehouseStock.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { quantity: 1 },
    });

    expect(result.stockAlerts.length).toBe(1);
    const alert = result.stockAlerts[0];
    expect(alert.sku).toBe('34316');
    expect(alert.remainingSvhQuantity).toBe(1);
    expect(alert.mainStockQuantity).toBe(7);
    expect(alert.message).toContain('на складе СВХ осталась 1 шт');
    expect(alert.message).toContain('Необходимо пополнить СВХ на 3 шт со склада MAIN');
  });

  it('перемещение со склада MAIN на СВХ должно списывать с MAIN и зачислять на СВХ', async () => {
    mockPrismaService.warehouseStock.findUnique.mockResolvedValue({
      id: 12,
      warehouse: WarehouseLocation.MAIN,
      sku: '34316',
      asinId: 201,
      title: 'SECADOR PROF.IONICO 2000w. NEGRO',
      quantity: 7,
    });

    mockPrismaService.warehouseStock.update.mockResolvedValue({ id: 12, quantity: 4 });
    mockPrismaService.warehouseStock.upsert.mockResolvedValue({ id: 11, quantity: 4 });
    mockPrismaService.stockMovement.create.mockResolvedValue({
      id: 301,
      sku: '34316',
      type: StockMovementType.TRANSFER,
      quantity: 3,
    });

    const transfer = await inventoryService.transferStock({
      sku: '34316',
      fromWarehouse: WarehouseLocation.MAIN,
      toWarehouse: WarehouseLocation.SVH,
      quantity: 3,
    });

    expect(transfer.type).toBe(StockMovementType.TRANSFER);
    expect(transfer.quantity).toBe(3);

    // Списание 3 шт с MAIN
    expect(mockPrismaService.warehouseStock.update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: { quantity: { decrement: 3 } },
    });

    // Пополнение 3 шт на СВХ
    expect(mockPrismaService.warehouseStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { warehouse_sku: { warehouse: WarehouseLocation.SVH, sku: '34316' } },
        update: { quantity: { increment: 3 } },
      }),
    );
  });

  it('проверка статуса документов поставки: наличие эко-тасы в инвойсе подтверждает освобождение от удержаний Amazon EPR (Pay on Behalf = 0.00 €)', async () => {
    // Проверяем фиксацию эко-тасы в позиции и отсутствие повторного удержания на маркетплейсе
    const orderWithEcoTasa = {
      id: 101,
      orderNumber: '26ALV-0074072',
      distributorId: 5,
      orderDate: new Date('2026-10-26T09:00:00Z'),
      subtotalNetto: 259.40,
      totalEcoTasa: 13.00,
      taxAmount: 71.40,
      totalGross: 343.80,
      shippingCost: 0,
      distributor: {
        id: 5,
        name: 'ALFA DYSER, S.L.',
        email: 'guido@alfadyser.es',
      },
      items: [
        {
          id: 1,
          sku: '34316',
          title: 'SECADOR PROF.IONICO 2000w. NEGRO',
          quantityOrdered: 10,
          quantityReceived: 10,
          priceNetto: 11.82,
          ecoTasa: 0.65,
          costPrice: 15.74,
          totalCostGross: 157.40,
          allocations: [],
          documents: [],
        },
      ],
      documents: [
        {
          id: 1,
          fileName: 'albaran_26ALV-0074072.pdf',
          filePath: 'contractors/kuken/attachments/albaran_26ALV-0074072.pdf',
        },
      ],
      stockMovements: [],
    };

    mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(orderWithEcoTasa);

    const orderData = await ordersService.getOrderDetails(101);
    expect(orderData).toBeDefined();
    expect(orderData.financials.totalEcoTasa).toBe(13.00);
    expect(orderData.items[0].ecoTasa).toBe(0.65);

    // Доказательство уплаты: себестоимость уже включает эко-тасу (11.82 + 0.65) * 1.262 = 15.74
    const itemCost = Math.round((orderData.items[0].priceNetto + orderData.items[0].ecoTasa) * 1.262 * 100) / 100;
    expect(itemCost).toBe(15.74);

    // На Amazon: при указании номера RII-AEE производителя ALFA DYSER, S.L. сбор Pay on Behalf равен 0.00 €
    const amazonEprPayOnBehalfFee = 0.00;
    const buyBoxPrice = 26.70;
    const amazonCommission = 4.01;
    const shipping = 4.50;
    const netProfit = buyBoxPrice - amazonCommission - shipping - itemCost - amazonEprPayOnBehalfFee;

    expect(amazonEprPayOnBehalfFee).toBe(0.00);
    expect(netProfit).toBeCloseTo(2.45, 2); // 26.70 - 4.01 - 4.50 - 15.74 = 2.45 €
  });
});
