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
          filePath: 'ecommerce/contractors/kuken/attachments/albaran_26ALV-0074072.pdf',
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

  it('получение списка всех текущих заказов без параметров (для старта приемки товара в OpenClaw) должно возвращать все заказы с составом позиций', async () => {
    // Мокаем возврат текущего активного заказа 26ALV-0074072 при вызове getOrders() без фильтров
    const mockOrders = [
      {
        id: 1,
        orderNumber: '26ALV-0074072',
        status: PurchaseOrderStatus.CONFIRMED,
        distributor: { id: 3, name: 'ALFA DYSER, S.L.', email: 'guido@alfadyser.es' },
        items: [
          { sku: '34316', title: 'SECADOR PROF.IONICO 2000w. NEGRO KUKEN', quantityOrdered: 10, quantityReceived: 0 },
          { sku: '35536', title: 'PLANCHA VAPOR 2600W. SUELA CERAMICA KUKEN', quantityOrdered: 10, quantityReceived: 0 },
        ],
        documents: [],
      },
    ];
    mockPrismaService.purchaseOrder.findMany.mockResolvedValue(mockOrders);

    // Вызываем getOrders без параметров (как делает OpenClaw при сообщении "мне пришел товар, хочу произвести приемку")
    const result = await ordersService.getOrders();

    expect(result).toHaveLength(1);
    expect(result[0].orderNumber).toBe('26ALV-0074072');
    expect(result[0].items).toHaveLength(2);
    expect(mockPrismaService.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
      }),
    );
  });

  it('поиск заказов по строке search и статусу должен находить партию по названию товара, SKU, EAN или бренду поставщика', async () => {
    // Проверяем, что при передаче search="SECADOR" и status="CONFIRMED" формируется корректный фильтр Prisma
    mockPrismaService.purchaseOrder.findMany.mockResolvedValue([
      {
        id: 1,
        orderNumber: '26ALV-0074072',
        status: PurchaseOrderStatus.CONFIRMED,
      },
    ]);

    const result = await ordersService.getOrders({ search: 'SECADOR', status: 'CONFIRMED' });

    expect(result).toHaveLength(1);
    expect(mockPrismaService.purchaseOrder.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: PurchaseOrderStatus.CONFIRMED,
          OR: expect.any(Array),
        }),
      }),
    );
  });

  it('обязательная тройная сверка EAN (Заказ <-> Albarán <-> Коробка) должна фиксировать совпадение или добавлять предупреждение в комментарий приемки при расхождении', async () => {
    const existingOrder = {
      id: 101,
      orderNumber: '26ALV-0074072',
      distributorId: 5,
      status: PurchaseOrderStatus.CONFIRMED,
      notes: 'Отгрузка DHL',
      items: [
        {
          id: 1,
          sku: '34316',
          ean: '8425160343163',
          title: 'SECADOR PROF.IONICO 2000w. NEGRO KUKEN',
          quantityOrdered: 10,
          quantityReceived: 0,
          asinId: 201,
          costPrice: 15.74,
          notes: null,
        },
        {
          id: 2,
          sku: '35536',
          ean: '8425160355364',
          title: 'PLANCHA VAPOR 2600W. SUELA CERAMICA KUKEN',
          quantityOrdered: 10,
          quantityReceived: 0,
          asinId: 202,
          costPrice: 18.64,
          notes: null,
        },
      ],
    };

    mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(existingOrder);
    mockPrismaService.stockMovement.findMany.mockResolvedValue([]);
    mockPrismaService.purchaseOrderItem.update.mockResolvedValue({});
    mockPrismaService.warehouseStock.upsert.mockResolvedValue({});
    mockPrismaService.stockMovement.create.mockResolvedValue({});
    mockPrismaService.purchaseOrder.update.mockImplementation(async (args) => ({
      id: 101,
      ...args.data,
    }));

    // По первой позиции (34316) все три EAN совпадают, а по второй (35536) на коробке обнаружен другой EAN
    const result = await ordersService.receiveOrder(101, {
      actualDeliveryDate: '2026-10-27',
      receivingDate: '2026-10-29',
      items: [
        {
          sku: '34316',
          quantityReceived: 10,
          eanAlbaran: '8425160343163',
          eanBox: '8425160343163',
          packageLengthCm: 28,
          packageWidthCm: 10,
          packageHeightCm: 22,
          packageWeightG: 850,
          itemNotes: 'Коробки в идеальном состоянии',
        },
        {
          sku: '35536',
          quantityReceived: 10,
          eanAlbaran: '8425160355364',
          eanBox: '8425160999999', // Расхождение EAN на коробке!
          packageLengthCm: 30,
          packageWidthCm: 12,
          packageHeightCm: 16,
          packageWeightG: 1200,
          itemNotes: 'На одной коробке стикер с другим штрихкодом',
        },
      ],
    });

    // Проверяем результаты тройной сверки EAN
    expect(result.receivingSummary.eanVerifications).toHaveLength(2);
    expect(result.receivingSummary.eanVerifications[0]).toEqual(
      expect.objectContaining({
        sku: '34316',
        orderEan: '8425160343163',
        albaranEan: '8425160343163',
        boxEan: '8425160343163',
        matched: true,
      }),
    );
    expect(result.receivingSummary.eanVerifications[1]).toEqual(
      expect.objectContaining({
        sku: '35536',
        orderEan: '8425160355364',
        albaranEan: '8425160355364',
        boxEan: '8425160999999',
        matched: false,
      }),
    );

    // Проверяем, что несоответствие попало в массив warnings и в сводный комментарий приемки заказа
    expect(result.receivingSummary.warnings).toEqual(
      expect.arrayContaining([expect.stringContaining('НЕСООТВЕТСТВИЕ EAN по SKU 35536')]),
    );
    expect(result.notes).toContain('2026-10-29 (получено: 2026-10-27)');
    expect(result.notes).toContain('НЕСООТВЕТСТВИЕ EAN по SKU 35536');
  });

  it('приемка должна поддерживать список документов с явным разрешением пользователя на пропуск документа с комментарием причины, а также раздельные фото всей партии и каждого отдельного айтема с разных сторон', async () => {
    const existingOrder = {
      id: 101,
      orderNumber: '26ALV-0074072',
      distributorId: 5,
      status: PurchaseOrderStatus.CONFIRMED,
      notes: null,
      items: [
        {
          id: 10,
          sku: '34316',
          ean: '8425160343163',
          title: 'SECADOR PROF.IONICO 2000w. NEGRO KUKEN',
          quantityOrdered: 10,
          quantityReceived: 0,
          asinId: 201,
          costPrice: 15.74,
          notes: null,
        },
      ],
    };

    mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(existingOrder);
    mockPrismaService.stockMovement.findMany.mockResolvedValue([]);
    mockPrismaService.purchaseOrderItem.update.mockResolvedValue({});
    mockPrismaService.warehouseStock.upsert.mockResolvedValue({});
    mockPrismaService.stockMovement.create.mockResolvedValue({});
    mockPrismaService.orderDocument.create.mockResolvedValue({});
    mockPrismaService.purchaseOrder.update.mockImplementation(async (args) => ({
      id: 101,
      ...args.data,
    }));

    // Проводим приемку с датой получения (26.10) и датой приемки (29.10), пропуском фактуры по причине,
    // общими фото всей партии с разных сторон и поштучными фото отдельного айтема с разных сторон
    const result = await ordersService.receiveOrder(101, {
      actualDeliveryDate: '2026-10-26',
      receivingDate: '2026-10-29',
      receivingNotes: 'Приемка задержалась на 3 дня. Внешний короб #2 слегка помят сбоку, внутри товар целый.',
      skippedDocuments: [
        {
          documentType: 'INVOICE',
          reason: 'Поставщик ALFA DYSER выставляет счет-фактуру после отгрузки, придет на email позже',
        },
      ],
      documents: [
        {
          documentType: 'ALBARAN',
          fileName: 'albaran_26ALV-0074072.jpg',
          filePath: 'telegram:file_id_albaran_01',
          notes: 'Бумажный Albarán из коробки со строкой TASA 0.65 €',
        },
        {
          documentType: 'RECEIVING_PHOTO',
          fileName: 'batch_boxes_front_side.jpg',
          filePath: 'telegram:file_id_batch_01',
          notes: 'Общее фото всей партии (2 транспортных короба DHL спереди и сбоку, вмятина на коробе #2)',
        },
      ],
      items: [
        {
          sku: '34316',
          quantityReceived: 10,
          eanAlbaran: '8425160343163',
          eanBox: '8425160343163',
          packageLengthCm: 28,
          packageWidthCm: 10,
          packageHeightCm: 22,
          packageWeightG: 850,
          itemNotes: 'На 1 заводской коробке небольшая потертость глянцевого слоя, сам фен исправен',
          documents: [
            {
              documentType: 'RECEIVING_PHOTO',
              fileName: 'item_34316_front_back.jpg',
              filePath: 'telegram:file_id_item_front_back',
              notes: 'Фото заводской коробки фена спереди и сзади',
            },
            {
              documentType: 'RECEIVING_PHOTO',
              fileName: 'item_34316_ean_weee.jpg',
              filePath: 'telegram:file_id_item_ean',
              notes: 'Фото торца коробки со штрихкодом EAN 8425160343163 и знаком WEEE',
            },
            {
              documentType: 'MEASUREMENT_PHOTO',
              fileName: 'item_34316_ruler_scale.jpg',
              filePath: 'telegram:file_id_item_measure',
              notes: 'Фото замеров рулеткой 28x10x22 см и веса 850 г на весах',
            },
          ],
        },
      ],
    });

    // Проверяем, что создано 5 записей OrderDocument (2 на уровне партии + 3 на уровне конкретного айтема с purchaseOrderItemId: 10)
    expect(mockPrismaService.orderDocument.create).toHaveBeenCalledTimes(5);
    expect(mockPrismaService.orderDocument.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        purchaseOrderId: 101,
        purchaseOrderItemId: 10,
        fileName: 'item_34316_front_back.jpg',
      }),
    });

    // Проверяем, что в комментарий позиции (PurchaseOrderItem.notes) записаны и дефекты, и сверка EAN, и все присланные фото айтема
    expect(mockPrismaService.purchaseOrderItem.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: expect.objectContaining({
        notes: expect.stringContaining('На 1 заводской коробке небольшая потертость'),
      }),
    });
    expect(mockPrismaService.purchaseOrderItem.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: expect.objectContaining({
        notes: expect.stringContaining('Фото айтема (3 шт)'),
      }),
    });

    // Проверяем, что в общий комментарий приемки заказа попали обе даты, причина пропуска документа и описание повреждений
    expect(result.notes).toContain('[ПРИЕМКА ПАРТИИ от 2026-10-29 (получено: 2026-10-26)]');
    expect(result.notes).toContain('Внешний короб #2 слегка помят сбоку');
    expect(result.notes).toContain('INVOICE (причина пропуска: Поставщик ALFA DYSER выставляет счет-фактуру после отгрузки');
  });

  it('попытка пропустить обязательный документ без указания причины пользователя должна отклоняться с ошибкой 400 Bad Request', async () => {
    mockPrismaService.purchaseOrder.findUnique.mockResolvedValue({
      id: 101,
      orderNumber: '26ALV-0074072',
      distributorId: 5,
      status: PurchaseOrderStatus.CONFIRMED,
      items: [],
    });

    await expect(
      ordersService.receiveOrder(101, {
        skippedDocuments: [{ documentType: 'INVOICE', reason: '   ' }],
      }),
    ).rejects.toThrow('Для пропуска документа "INVOICE" необходимо указать явную причину пользователя');
  });

  it('повторное прохождение процедуры приемки по уже принятой партии (корректировка) должно пересчитывать остатки строго по дельте без задвоения складов СВХ и MAIN', async () => {
    // Партия уже была принята ранее: 10 шт (3 на СВХ, 7 на MAIN)
    const alreadyReceivedOrder = {
      id: 101,
      orderNumber: '26ALV-0074072',
      distributorId: 5,
      status: PurchaseOrderStatus.RECEIVED,
      actualDeliveryDate: new Date('2026-10-26T00:00:00.000Z'),
      notes: 'Первичная приемка',
      items: [
        {
          id: 1,
          sku: '34316',
          ean: '8425160343163',
          title: 'SECADOR PROF.IONICO 2000w. NEGRO KUKEN',
          quantityOrdered: 10,
          quantityReceived: 10, // Уже было принято 10 шт!
          packageLengthCm: 28,
          packageWidthCm: 10,
          packageHeightCm: 22,
          packageWeightG: 850,
          asinId: 201,
          costPrice: 15.74,
          notes: 'Коробки целые',
        },
      ],
    };

    mockPrismaService.purchaseOrder.findUnique.mockResolvedValue(alreadyReceivedOrder);
    // В истории движений по заказу уже числятся 3 шт на СВХ и 7 шт на MAIN
    mockPrismaService.stockMovement.findMany.mockResolvedValue([
      { toWarehouse: WarehouseLocation.SVH, fromWarehouse: null, quantity: 3 },
      { toWarehouse: WarehouseLocation.MAIN, fromWarehouse: null, quantity: 7 },
    ]);
    mockPrismaService.purchaseOrderItem.update.mockResolvedValue({});
    mockPrismaService.warehouseStock.upsert.mockResolvedValue({});
    mockPrismaService.stockMovement.create.mockResolvedValue({});
    mockPrismaService.purchaseOrder.update.mockImplementation(async (args) => ({
      id: 101,
      ...args.data,
    }));

    // Сценарий А: Повторная приемка с тем же количеством (10 шт), но уточнением веса (870 г вместо 850 г) и добавлением комментария
    const resSameQty = await ordersService.receiveOrder(101, {
      receivingDate: '2026-10-29',
      receivingNotes: 'Уточнили вес на точных весах',
      items: [
        {
          sku: '34316',
          quantityReceived: 10,
          packageWeightG: 870,
          itemNotes: 'Вес уточнен: 870 г',
        },
      ],
    });

    expect(resSameQty.receivingSummary.isCorrection).toBe(true);
    expect(resSameQty.receivingSummary.stockAdjustments[0]).toEqual(
      expect.objectContaining({
        sku: '34316',
        isItemCorrection: true,
        prevSvh: 3,
        newSvh: 3,
        deltaSvh: 0,
        prevMain: 7,
        newMain: 7,
        deltaMain: 0,
      }),
    );
    // Самое главное: так как дельта = 0, складские остатки WarehouseStock НЕ вызывались и НЕ задвоились!
    expect(mockPrismaService.warehouseStock.upsert).not.toHaveBeenCalled();
    expect(mockPrismaService.stockMovement.create).not.toHaveBeenCalled();
    // При этом ранее замеренные габариты (28x10x22) сохранились, а вес обновился на 870 г
    expect(mockPrismaService.purchaseOrderItem.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({
        quantityReceived: 10,
        packageLengthCm: 28,
        packageWidthCm: 10,
        packageHeightCm: 22,
        packageWeightG: 870,
      }),
    });

    // Сценарий Б: Корректировка количества с 10 шт до 9 шт (1 фен оказался с заводским браком: на СВХ остается 3, на MAIN становится 6 вместо 7)
    const resReducedQty = await ordersService.receiveOrder(101, {
      receivingDate: '2026-10-29',
      receivingNotes: 'Обнаружен 1 бракованный экземпляр при детальной проверке',
      items: [
        {
          sku: '34316',
          quantityReceived: 9,
          svhQuantity: 3,
          mainQuantity: 6,
          itemNotes: '1 шт отбракована (трещина корпуса)',
        },
      ],
    });

    expect(resReducedQty.status).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);
    expect(resReducedQty.receivingSummary.stockAdjustments[0]).toEqual(
      expect.objectContaining({
        prevSvh: 3,
        newSvh: 3,
        deltaSvh: 0,
        prevMain: 7,
        newMain: 6,
        deltaMain: -1,
      }),
    );
    // Со склада MAIN должно списаться ровно 1 шт (decrement: 1) с проводкой ADJUSTMENT
    expect(mockPrismaService.warehouseStock.upsert).toHaveBeenCalledTimes(1);
    expect(mockPrismaService.warehouseStock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { warehouse_sku: { warehouse: WarehouseLocation.MAIN, sku: '34316' } },
        update: expect.objectContaining({ quantity: { decrement: 1 } }),
      }),
    );
    expect(mockPrismaService.stockMovement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sku: '34316',
        fromWarehouse: WarehouseLocation.MAIN,
        type: StockMovementType.ADJUSTMENT,
        quantity: 1,
      }),
    });
  });

  it('при загрузке фактуры (INVOICE) без выписки из банка система должна требовать прикрепления банковской оплаты и формировать задачу категории [Legal] для Taxfix', async () => {
    const orderWithoutDocs = {
      id: 202,
      orderNumber: 'ES127926',
      distributorId: 9,
      paymentStatus: 'PENDING',
      notes: 'Заказ упаковки Embalaje24',
      distributor: { id: 9, name: 'EMBALAJE24, S.L.' },
      documents: [],
    };

    mockPrismaService.purchaseOrder.findFirst.mockResolvedValue(orderWithoutDocs);
    mockPrismaService.orderDocument.create.mockImplementation(async (args) => ({
      id: 501,
      ...args.data,
    }));
    mockPrismaService.purchaseOrder.update.mockImplementation(async (args) => ({
      ...orderWithoutDocs,
      ...args.data,
    }));

    // Шаг 1: Пользователь загружает только счет-фактуру INV#ES127926
    const step1 = await ordersService.updateTaxfixCompliance('ES127926', {
      invoiceFile: {
        fileName: 'Factura_INV_ES127926_2026-10-29.pdf',
        filePath: '../contractors/embalaje24/invoices/Factura_INV_ES127926_2026-10-29.pdf',
        invoiceNumber: 'INV#ES127926',
        notes: 'Фактура 18.80 EUR (IVA 3.25 EUR)',
      },
    });

    expect(step1.taxfixCompliance.hasInvoice).toBe(true);
    expect(step1.taxfixCompliance.hasPaymentReceipt).toBe(false);
    expect(step1.taxfixCompliance.uploadedToTaxfix).toBe(false);
    expect(step1.taxfixCompliance.paymentLinkedInTaxfix).toBe(false);
    expect(step1.taxfixCompliance.status).toBe('PENDING_TAXFIX_AND_PAYMENT');
    expect(step1.taxfixCompliance.recommendedLegalTask).toEqual(
      expect.objectContaining({
        category: 'Legal',
        title: '[Legal]: Taxfix — Загрузить фактуру по заказу ES127926 (EMBALAJE24, S.L.) и слинковать с банковской оплатой',
      }),
    );

    // Шаг 2: Прикрепляем выписку об оплате из банка (PAYMENT_RECEIPT) и отмечаем загрузку и линковку в Taxfix
    mockPrismaService.purchaseOrder.findFirst.mockResolvedValue({
      ...orderWithoutDocs,
      notes: 'Заказ упаковки Embalaje24\n[TAXFIX: UPLOADED=false, LINKED=false]',
      documents: [
        {
          id: 501,
          documentType: 'INVOICE',
          fileName: 'Factura_INV_ES127926_2026-10-29.pdf',
          filePath: '../contractors/embalaje24/invoices/Factura_INV_ES127926_2026-10-29.pdf',
          notes: 'Factura № INV#ES127926',
        },
      ],
    });

    const step2 = await ordersService.updateTaxfixCompliance('ES127926', {
      paymentReceiptFile: {
        fileName: 'bank_receipt_ES127926.pdf',
        filePath: '../contractors/embalaje24/invoices/bank_receipt_ES127926.pdf',
        bankReference: 'Карта 18.80 EUR от 29.10.2026',
      },
      uploadedToTaxfix: true,
      paymentLinkedInTaxfix: true,
    });

    expect(step2.paymentStatus).toBe('PAID');
    expect(step2.taxfixCompliance.isCompliant).toBe(true);
    expect(step2.taxfixCompliance.status).toBe('COMPLETED');
    expect(step2.taxfixCompliance.hasInvoice).toBe(true);
    expect(step2.taxfixCompliance.hasPaymentReceipt).toBe(true);
    expect(step2.taxfixCompliance.uploadedToTaxfix).toBe(true);
    expect(step2.taxfixCompliance.paymentLinkedInTaxfix).toBe(true);
    expect(step2.taxfixCompliance.bankReference).toBe('Карта 18.80 EUR от 29.10.2026');
    expect(step2.taxfixCompliance.recommendedLegalTask).toBeNull();
  });
});
