import { Test, TestingModule } from '@nestjs/testing';
import { KeepaService } from './keepa.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';

describe('Сервис интеграции с Keepa (KeepaService)', () => {
  let service: KeepaService;
  let prismaService: any;

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
      ],
    }).compile();

    service = module.get<KeepaService>(KeepaService);
  });

  it('должен успешно инициализировать сервис', () => {
    // Проверяем, что экземпляр сервиса успешно создан NestJS контейнером
    expect(service).toBeDefined();
  });

  describe('fetchProductFinder', () => {
    it('должен возвращать пустой результат, если KEEPA_API_KEY не задан', async () => {
      // Сохраняем исходный ключ и очищаем для проверки защитного условия
      const originalKey = process.env.KEEPA_API_KEY;
      delete process.env.KEEPA_API_KEY;

      const result = await service.fetchProductFinder('599391031');
      expect(result).toEqual({ asins: [], totalResults: 0, queued: 0 });

      // Восстанавливаем ключ
      process.env.KEEPA_API_KEY = originalKey;
    });

    it('должен отправлять корректный POST запрос с параметрами фильтрации и ставить ASIN в очередь', async () => {
      process.env.KEEPA_API_KEY = 'test_key';

      // Мокаем глобальный fetch
      const mockFetch = jest.spyOn(global, 'fetch' as any).mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          asinList: ['B001TEST01', 'B001TEST02'],
          totalResults: 2,
        }),
      } as any);

      const result = await service.fetchProductFinder('599391031');

      // Проверяем факт вызова fetch
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      const url = callArgs[0] as string;
      const options = callArgs[1] as any;

      expect(url).toContain('api.keepa.com/query');
      expect(options.method).toBe('POST');

      // Проверяем параметры в теле запроса
      const body = JSON.parse(options.body);
      expect(body.rootCategory).toEqual(['599391031']);
      expect(body.isAdultProduct).toBe(false);
      expect(body.productType).toEqual([0]);
      expect(body.current_COUNT_NEW_gte).toBe(5);
      expect(body.current_COUNT_NEW_lte).toBe(15);

      // Проверяем результат и добавление в очередь
      expect(result.asins).toEqual(['B001TEST01', 'B001TEST02']);
      expect(result.queued).toBe(2);
      expect(prismaService.wholesaleAsinQueue.upsert).toHaveBeenCalledTimes(2);

      mockFetch.mockRestore();
    });
  });

  describe('fetchProductFinderForAllAllowedCategories', () => {
    it('должен опрашивать все активные разрешенные категории из базы данных', async () => {
      process.env.KEEPA_API_KEY = 'test_key';

      const spySingle = jest.spyOn(service, 'fetchProductFinder').mockResolvedValue({
        asins: ['B001TEST01'],
        totalResults: 1,
        queued: 1,
      });

      const results = await service.fetchProductFinderForAllAllowedCategories();

      expect(prismaService.keepaAllowedCategory.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(spySingle).toHaveBeenCalledWith('599391031', expect.objectContaining({ domainId: 4 }));
      expect(results.length).toBe(1);
      expect(results[0].categoryName).toBe('Hogar y cocina');

      spySingle.mockRestore();
    });
  });
});
