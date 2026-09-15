import { Test, TestingModule } from '@nestjs/testing';
import { KeepaService } from './keepa.service';
import { KeepaQueueService } from './keepa-queue.service';
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
    it('должен ставить задачу поиска по категории в очередь KeepaQueueService с низким приоритетом LOW', async () => {
      queueService.enqueueRequest.mockResolvedValue({ id: 101 });

      const result = await service.fetchAndSaveKeepaExportForCategory('599391031');

      expect(queueService.enqueueRequest).toHaveBeenCalledWith(
        'CATEGORY_FINDER',
        { categoryId: '599391031', options: undefined },
        1,
        1,
      );
      expect(result).toEqual({
        jobId: 101,
        message: 'Задача поиска по категории 599391031 добавлена в очередь',
      });
    });
  });

  describe('fetchAndSaveKeepaExportForAllCategories', () => {
    it('должен опрашивать все активные разрешенные категории из базы данных', async () => {
      process.env.KEEPA_API_KEY = 'test_key';

      const spySingle = jest.spyOn(service, 'fetchAndSaveKeepaExportForCategory').mockResolvedValue({
        asins: ['B001TEST01'],
        totalResults: 1,
        queued: 1,
      });

      const results = await service.fetchAndSaveKeepaExportForAllCategories();

      expect(prismaService.keepaAllowedCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(spySingle).toHaveBeenCalledWith('599391031', expect.objectContaining({ domainId: 4 }));
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
