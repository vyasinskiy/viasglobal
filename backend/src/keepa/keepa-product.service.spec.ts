import { Test, TestingModule } from '@nestjs/testing';
import { KeepaProductService } from './keepa-product.service';
import { KeepaQueueService, KEEPA_PRIORITY } from './keepa-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';

describe('Сервис товаров Keepa (KeepaProductService)', () => {
  let service: KeepaProductService;
  let prismaService: any;
  let queueService: any;

  beforeEach(async () => {
    prismaService = {
      requestProductQueue: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      keepaApiRawResponse: {
        findMany: jest.fn().mockResolvedValue([]),
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      keepaApiProcessedData: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    };

    queueService = {
      enqueueRequest: jest.fn().mockResolvedValue({ id: 1 }),
      updateTokensInfo: jest.fn(),
    };

  const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeepaProductService,
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

    service = module.get<KeepaProductService>(KeepaProductService);
  });

  it('должен успешно инициализировать сервис', () => {
    expect(service).toBeDefined();
  });

  it('должен корректно вычислять лимит пачки calculateProductsBatchRequestLimit', () => {
    process.env.KEEPA_API_TOKENS_PER_MINUTE = '20';
    process.env.KEEPA_FETCH_OFFERS = 'false';

    const limit = service.calculateProductsBatchRequestLimit();
    expect(limit).toBe(20);
  });

  it('должен корректно вычислять Size Tier для standard parcel', () => {
    // 300x200x100 mm, 500g
    const tier = service.calculateAmazonTier(300, 200, 100, 500);
    expect(tier).toBe('Standard parcel');
  });
});
