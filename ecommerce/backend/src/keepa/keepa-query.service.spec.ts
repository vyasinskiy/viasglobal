import { Test, TestingModule } from '@nestjs/testing';
import { KeepaQueryService } from './keepa-query.service';
import { KeepaQueueService, KEEPA_PRIORITY } from './keepa-queue.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Сервис поиска каталогов Keepa (KeepaQueryService)', () => {
  let service: KeepaQueryService;
  let prismaService: any;
  let queueService: any;

  beforeEach(async () => {
    prismaService = {
      keepaAllowedCategory: {
        findUnique: jest.fn().mockResolvedValue({
          categoryId: '599391031',
          name: 'Hogar y cocina',
          domainId: 4,
          isActive: true,
        }),
        findMany: jest.fn().mockResolvedValue([
          { id: 1, categoryId: '599391031', name: 'Hogar y cocina', domainId: 4, isActive: true },
        ]),
      },
      requestProductQueue: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      aSIN: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      keepaExport: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };

    queueService = {
      enqueueRequest: jest.fn().mockResolvedValue({ id: 101 }),
      updateTokensInfo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeepaQueryService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
        {
          provide: KeepaQueueService,
          useValue: queueService,
        },
      ],
    }).compile();

    service = module.get<KeepaQueryService>(KeepaQueryService);
  });

  it('должен успешно инициализировать сервис', () => {
    expect(service).toBeDefined();
  });

  describe('fetchAndSaveKeepaExportForCategory', () => {
    it('должен выбрасывать ошибку, если категория не найдена в белом списке', async () => {
      prismaService.keepaAllowedCategory.findUnique.mockResolvedValue(null);

      await expect(service.fetchAndSaveKeepaExportForCategory('999999')).rejects.toThrow(
        'Категория с ID 999999 не найдена в списке разрешенных категорий',
      );
    });

    it('должен ставить задачу поиска по категории в очередь KeepaQueueService', async () => {
      const result = await service.fetchAndSaveKeepaExportForCategory('599391031');

      expect(queueService.enqueueRequest).toHaveBeenCalledWith(
        'CATEGORY_FINDER',
        { categoryId: '599391031', options: undefined },
        KEEPA_PRIORITY.NORMAL,
        10,
      );
      expect(result).toEqual({
        jobId: 101,
        message: 'Задача поиска по категории "Hogar y cocina" добавлена в очередь',
      });
    });
  });

  describe('fetchAndSaveKeepaExportForBrand', () => {
    it('должен ставить задачу поиска по бренду в очередь', async () => {
      const result = await service.fetchAndSaveKeepaExportForBrand(1, 'Barbie');

      expect(queueService.enqueueRequest).toHaveBeenCalledWith(
        'BRAND_FINDER',
        { brandId: 1, brandName: 'Barbie', options: undefined },
        KEEPA_PRIORITY.NORMAL,
        10,
      );
      expect(result).toEqual({
        jobId: 101,
        message: 'Задача выгрузки бренда Barbie добавлена в очередь',
      });
    });
  });
});
