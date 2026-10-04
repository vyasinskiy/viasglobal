import { Test, TestingModule } from '@nestjs/testing';
import { KeepaController } from './keepa.controller';
import { KeepaProductService } from './keepa-product.service';
import { KeepaQueryService } from './keepa-query.service';
import { KeepaQueueService } from './keepa-queue.service';
import { PrismaService } from '../prisma/prisma.service';

describe('KeepaController (HTTP эндпоинты очередей и экспорта Keepa)', () => {
  let controller: KeepaController;
  let productService: jest.Mocked<Partial<KeepaProductService>>;
  let queryService: jest.Mocked<Partial<KeepaQueryService>>;
  let queueService: jest.Mocked<Partial<KeepaQueueService>>;
  let prisma: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    // Мокируем сервисы для изоляции контроллера
    productService = {
      populateQueue: jest.fn().mockResolvedValue(undefined),
      handleProductAsinsJob: jest.fn().mockResolvedValue(undefined),
    };

    queryService = {
      fetchAndSaveKeepaExportForCategory: jest.fn(),
      fetchAndSaveKeepaExportForAllCategories: jest.fn(),
      fetchAndSaveKeepaExportForBrand: jest.fn(),
      fetchAndSaveKeepaExportForSeller: jest.fn(),
    };

    queueService = {
      enqueueRequest: jest.fn().mockResolvedValue({ id: 99, status: 'PENDING' } as any),
    };

    prisma = {
      keepaRequestQueue: {
        update: jest.fn().mockResolvedValue({ id: 99, status: 'COMPLETED' }),
      } as any,
      keepaApiProcessedData: {
        findUnique: jest.fn(),
      } as any,
      keepaAllowedCategory: {
        findMany: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KeepaController],
      providers: [
        { provide: KeepaProductService, useValue: productService },
        { provide: KeepaQueryService, useValue: queryService },
        { provide: KeepaQueueService, useValue: queueService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    controller = module.get<KeepaController>(KeepaController);
  });

  describe('POST /keepa/populate-queue', () => {
    it('должен возвращать понятное текстовое сообщение об успешном наполнении очереди', async () => {
      const response = await controller.triggerPopulateQueue();

      // Проверяем наличие читаемого статуса
      expect(response).toBeDefined();
      expect(response.message).toContain('Queue populated successfully');
      expect(productService.populateQueue).toHaveBeenCalled();
    });
  });

  describe('GET /keepa/allowed-categories', () => {
    it('должен возвращать список категорий из белого списка', async () => {
      const mockCategories = [
        { id: 1, categoryId: 100, name: 'Home & Kitchen', domainId: 1, isActive: true },
      ];
      (prisma.keepaAllowedCategory!.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await controller.getAllowedCategories();

      // Проверяем валидность списка для фронтенда и ИИ-агентов
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Home & Kitchen');
    });
  });

  describe('POST /keepa/export/brand/:brandId', () => {
    it('должен запускать экспорт бренда и возвращать структурированный отчет об импорте', async () => {
      const mockExportResult = {
        brandId: 42,
        brandName: 'LEGO',
        totalProductsFound: 150,
        queuedAsinsCount: 150,
        status: 'SUCCESS',
      };
      (queryService.fetchAndSaveKeepaExportForBrand as jest.Mock).mockResolvedValue(mockExportResult);

      const result = await controller.exportBrand('42', 'LEGO');

      // Проверяем полноту диагностических счетчиков
      expect(result).toBeDefined();
      expect(result.brandName).toBe('LEGO');
      expect(result.totalProductsFound).toBe(150);
      expect(result.status).toBe('SUCCESS');
    });
  });

  describe('POST /keepa/export/seller/:sellerId', () => {
    it('должен запускать экспорт продавца и возвращать количество найденных ASIN', async () => {
      const mockSellerResult = {
        sellerId: 'A2N8Z7EXAMPLE',
        totalProductsFound: 80,
        status: 'SUCCESS',
      };
      (queryService.fetchAndSaveKeepaExportForSeller as jest.Mock).mockResolvedValue(mockSellerResult);

      const result = await controller.exportSeller('A2N8Z7EXAMPLE');

      expect(result).toBeDefined();
      expect(result.sellerId).toBe('A2N8Z7EXAMPLE');
      expect(result.totalProductsFound).toBe(80);
    });
  });
});
