import { Test, TestingModule } from '@nestjs/testing';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AppService } from '../app.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('Контроллер и сервис CRM (CrmController & CrmService)', () => {
  let controller: CrmController;
  let service: CrmService;

  // Мок PrismaService для изолированного модульного тестирования
  const mockPrisma = {
    aSIN: {
      count: jest.fn().mockResolvedValue(420),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    brand: {
      groupBy: jest.fn().mockResolvedValue([
        { status: 'CONTRACTED', _count: { _all: 3 } },
        { status: 'UNPROCESSED', _count: { _all: 25 } },
      ]),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          name: 'KUKEN',
          status: 'CONTRACTED',
          notes: 'Бытовая техника Alfa Dyser',
          _count: { asins: 45, privateLabels: 0, keepaExports: 1 },
        },
      ]),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    manufacturer: {
      count: jest.fn().mockResolvedValue(18),
      findMany: jest.fn().mockResolvedValue([
        {
          id: 10,
          name: 'ALFA DYSER, S.L.',
          isAnalyzed: true,
          aliases: [{ id: 1, rawName: 'ALFA DYSER S.L' }],
          _count: { asins: 45, aliases: 1 },
        },
      ]),
    },
    privateLabel: {
      count: jest.fn().mockResolvedValue(12),
    },
    privateLabelView: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          brandId: 5,
          sellerId: 'A12345',
          brandName: 'TESTBRAND',
          sellerName: 'Test Official Store',
          notes: 'Подтвержденный Private Label',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    },
    distributor: {
      groupBy: jest.fn().mockResolvedValue([
        { status: 'ACCOUNT_OPENED', _count: { _all: 3 } },
        { status: 'EMAIL_SENT', _count: { _all: 4 } },
      ]),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn(),
    },
    distributorEmail: {
      count: jest.fn().mockResolvedValue(34),
      findMany: jest.fn().mockResolvedValue([]),
    },
    distributorPriceSnapshot: {
      count: jest.fn().mockResolvedValue(1250),
    },
    purchaseOrder: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          orderNumber: '26ALV-0074072',
          status: 'RECEIVED',
          totalGross: 342.5,
          subtotalNetto: 271.4,
        },
      ]),
    },
    salesOrder: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 1,
          totalAmount: 26.7,
          platformFees: 4.01,
          shippingFee: 4.5,
          netAmount: 18.19,
          items: [{ quantity: 1, netProfit: 6.45 }],
        },
      ]),
    },
    keepaRequestQueue: {
      groupBy: jest.fn().mockResolvedValue([{ status: 'COMPLETED', _count: { _all: 50 } }]),
      findMany: jest.fn().mockResolvedValue([]),
    },
    requestProductQueue: {
      count: jest.fn().mockResolvedValue(5),
      findMany: jest.fn().mockResolvedValue([]),
    },
    analysisProductQueue: {
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    keepaExport: {
      count: jest.fn().mockResolvedValue(14),
    },
    keepaAllowedCategory: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    keepaExportView: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    keepaApiProcessedData: {
      findUnique: jest.fn().mockResolvedValue(null),
    },
    warehouseStock: {
      findMany: jest.fn().mockResolvedValue([
        { warehouse: 'SVH', sku: '34316', quantity: 3 },
        { warehouse: 'MAIN', sku: '34316', quantity: 7 },
      ]),
    },
    asinView: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([
      {
        count: BigInt(15),
        profitable: BigInt(9),
        brandsCount: BigInt(12),
        cleanBrandsCount: BigInt(7),
        totalCleanAsins: BigInt(48),
      },
    ]),
  };

  const mockInventoryService = {
    getLowStockAlerts: jest.fn().mockResolvedValue({
      totalAlerts: 1,
      alerts: [
        {
          sku: '35536',
          title: 'Secador Kuken',
          asin: 'B08XYZ1234',
          svhQuantity: 1,
          minStockAlert: 1,
          mainQuantity: 7,
          status: 'NEEDS_TRANSFER',
          recommendedTransferQty: 3,
          message: 'Товар заканчивается на СВХ',
        },
      ],
    }),
  };

  const mockAppService = {
    getBackupHealth: jest.fn().mockReturnValue({
      status: 'healthy',
      checksPassed: true,
      message: 'Все резервные копии актуальны',
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CrmController],
      providers: [
        CrmService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: AppService, useValue: mockAppService },
      ],
    }).compile();

    controller = module.get<CrmController>(CrmController);
    service = module.get<CrmService>(CrmService);
  });

  it('должен успешно формировать сводную статистику главного дашборда CRM', async () => {
    // Вызываем метод получения статистики дашборда
    const res = await controller.getDashboard();

    // Проверяем корректность агрегации всех разделов
    expect(res.status).toBe('success');
    expect(res.catalog.totalAsins).toBe(420);
    expect(res.catalog.brandsByStatus.CONTRACTED).toBe(3);
    expect(res.distributors.byStatus.ACCOUNT_OPENED).toBe(3);
    expect(res.inventory.svhTotalUnits).toBe(3);
    expect(res.inventory.mainTotalUnits).toBe(7);
    expect(res.inventory.lowStockAlertsCount).toBe(1);
    expect(res.sales.totalNetProfit).toBe(6.45);
  });

  it('должен отклонять запросы с LLM-плейсхолдерами со статусом 400 Bad Request', async () => {
    // Проверяем защиту от галлюцинаций и плейсхолдеров ('***', '<asin>')
    await expect(controller.getAsinDetails('***')).rejects.toThrow(BadRequestException);
    await expect(controller.getBrands('ALL', '<brand>')).rejects.toThrow(BadRequestException);
  });

  it('должен корректно помечать снапшот Keepa как устаревший (isSnapshotStale = true), если он старше 48 часов', async () => {
    // Подготавливаем строку из get_contracted_products
    mockPrisma.$queryRaw.mockResolvedValueOnce([
      {
        asin: 'B01N4SDF1W',
        ean: '8412688266586',
        title: 'Safta Mochila',
        brand: 'SAFTA',
        distributor: 'SAFTA',
        netProfitPerUnit: 4.5,
        netProfitPerMinBoxOrder: 27.0,
      },
    ]);

    // Снапшот создан 72 часа назад (> 48 часов)
    const oldDate = new Date(Date.now() - 72 * 60 * 60 * 1000);
    mockPrisma.aSIN.findMany.mockResolvedValueOnce([
      {
        code: 'B01N4SDF1W',
        productFinders: [
          {
            createdAt: oldDate,
            image: 'https://m.media-amazon.com/images/I/test.jpg;https://second.jpg',
            amazonCurrent: null,
            newCurrent: 24.99,
          },
        ],
      },
    ]);

    const res = await controller.getContractedProducts('filtered', 'true');
    expect(res.total).toBe(1);
    expect(res.items[0].asin).toBe('B01N4SDF1W');
    expect(res.items[0].isSnapshotStale).toBe(true);
    expect(res.items[0].image).toBe('https://m.media-amazon.com/images/I/test.jpg');
  });

  it('должен обновлять статус и заметки бренда при вызове PATCH /crm/brands/:id', async () => {
    mockPrisma.brand.findUnique.mockResolvedValueOnce({
      id: 1,
      name: 'KUKEN',
      status: 'UNPROCESSED',
      notes: null,
    });
    mockPrisma.brand.update.mockResolvedValueOnce({
      id: 1,
      name: 'KUKEN',
      status: 'CONTRACTED',
      notes: 'Контракт с Alfa Dyser открыт',
    });

    const res = await controller.updateBrand(1, {
      status: 'CONTRACTED' as any,
      notes: 'Контракт с Alfa Dyser открыт',
    });

    expect(res.status).toBe('success');
    expect(res.brand.status).toBe('CONTRACTED');
    expect(res.brand.notes).toBe('Контракт с Alfa Dyser открыт');
  });

  it('должен выбрасывать 404 NotFoundException при запросе несуществующего дистрибьютора', async () => {
    mockPrisma.distributor.findUnique.mockResolvedValueOnce(null);
    await expect(controller.getDistributorDetails(9999)).rejects.toThrow(NotFoundException);
  });
});

