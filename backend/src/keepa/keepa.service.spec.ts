import { Test, TestingModule } from '@nestjs/testing';
import { KeepaService } from './keepa.service';
import { KeepaQueueService, KEEPA_PRIORITY } from './keepa-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';

describe('Сервис интеграции с Keepa (KeepaService)', () => {
  let service: KeepaService;
  let prismaService: any;
  let queueService: any;

  beforeEach(async () => {
    prismaService = {
      wholesaleAsinQueue: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      keepaAllowedCategory: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, categoryId: '599391031', name: 'Hogar y cocina', domainId: 4, isActive: true },
        ]),
      },
    };

    queueService = {
      enqueueRequest: jest.fn().mockResolvedValue({ id: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeepaService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: AnalysisService,
          useValue: {
            queueForAnalysis: jest.fn(),
          },
        },
        {
          provide: KeepaQueueService,
          useValue: queueService,
        },
      ],
    }).compile();

    service = module.get<KeepaService>(KeepaService);
  });

  it('должен успешно инициализировать сервис', () => {
    // Проверяем, что экземпляр сервиса успешно создан NestJS контейнером
    expect(service).toBeDefined();
  });

  describe('fetchAndSaveKeepaExportForCategory', () => {
    it('должен выбрасывать ошибку, если разрешенная категория не найдена в базе данных', async () => {
      prismaService.keepaAllowedCategory.findUnique = jest.fn().mockResolvedValue(null);

      await expect(service.fetchAndSaveKeepaExportForCategory('999999')).rejects.toThrow(
        'Разрешенная категория с ID "999999" не найдена в базе данных',
      );
    });

    it('должен ставить задачу поиска по категории в очередь KeepaQueueService с приоритетом NORMAL по умолчанию', async () => {
      queueService.enqueueRequest.mockResolvedValue({ id: 101 });
      prismaService.keepaAllowedCategory.findUnique = jest.fn().mockResolvedValue({
        categoryId: '599391031',
        name: 'Hogar y cocina',
      });

      const result = await service.fetchAndSaveKeepaExportForCategory('599391031');

      expect(queueService.enqueueRequest).toHaveBeenCalledWith(
        'CATEGORY_FINDER',
        { categoryId: '599391031', options: undefined },
        KEEPA_PRIORITY.NORMAL,
        1,
      );
      expect(result).toEqual({
        jobId: 101,
        categoryId: '599391031',
        categoryName: 'Hogar y cocina',
        message: 'Задача поиска по категории "Hogar y cocina" (ID: 599391031) добавлена в очередь',
      });
    });

    it('должен ставить задачу с повышенным приоритетом CRITICAL при явной передаче', async () => {
      queueService.enqueueRequest.mockResolvedValue({ id: 102 });
      prismaService.keepaAllowedCategory.findUnique = jest.fn().mockResolvedValue({
        categoryId: '599391031',
        name: 'Hogar y cocina',
      });

      await service.fetchAndSaveKeepaExportForCategory('599391031', undefined, KEEPA_PRIORITY.CRITICAL);

      expect(queueService.enqueueRequest).toHaveBeenCalledWith(
        'CATEGORY_FINDER',
        { categoryId: '599391031', options: undefined },
        KEEPA_PRIORITY.CRITICAL,
        1,
      );
    });
  });

  describe('fetchAndSaveKeepaExportForAllCategories', () => {
    it('должен опрашивать все активные разрешенные категории из базы данных с приоритетом NORMAL по умолчанию', async () => {
      process.env.KEEPA_API_KEY = 'test_key';

      const spySingle = jest.spyOn(service, 'fetchAndSaveKeepaExportForCategory').mockResolvedValue({
        jobId: 101,
        categoryId: '599391031',
        categoryName: 'Hogar y cocina',
        message: 'Задача поиска добавлена',
      } as any);

      const results = await service.fetchAndSaveKeepaExportForAllCategories();

      expect(prismaService.keepaAllowedCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(spySingle).toHaveBeenCalledWith('599391031', expect.objectContaining({ domainId: 4 }), KEEPA_PRIORITY.NORMAL);
      expect(results.length).toBe(1);
      expect(results[0].categoryName).toBe('Hogar y cocina');

      spySingle.mockRestore();
    });
  });

  describe('executeJob', () => {
    it('должен маршрутизировать задачу PRODUCT_ASINS в соответствующий обработчик', async () => {
      process.env.KEEPA_API_KEY = 'test_key';

      const mockJob: any = {
        id: 1,
        type: 'PRODUCT_ASINS',
        payload: { asins: ['B001TEST01'], domainId: 4 },
      };

      const handlerSpy = jest.spyOn(service, 'handleProductAsinsJob').mockResolvedValue({
        totalAsins: 1,
        processedCount: 1,
      });

      const result = await service.executeJob(mockJob);

      expect(handlerSpy).toHaveBeenCalledWith(mockJob);
      expect(result).toEqual({ totalAsins: 1, processedCount: 1 });

      handlerSpy.mockRestore();
    });
  });
});
