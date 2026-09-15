import { Test, TestingModule } from '@nestjs/testing';
import { KeepaQueueService, KEEPA_PRIORITY } from './keepa-queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';
import { KeepaService } from './keepa.service';
import { KeepaRequestStatus, KeepaRequestType } from '@prisma/client';

describe('Сервис приоритетной очереди Keepa (KeepaQueueService)', () => {
  let service: KeepaQueueService;
  let prismaService: any;
  let analysisService: any;
  let keepaService: any;

  beforeEach(async () => {
    keepaService = {
      processRawProduct: jest.fn().mockResolvedValue(undefined),
    };

    prismaService = {
      keepaRequestQueue: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 1, ...data })),
        findFirst: jest.fn(),
        update: jest.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where?.id || 1, ...data })),
      },
      keepaApiRawResponse: {
        upsert: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
      keepaApiProcessedData: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      wholesaleAsinQueue: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      keepaExport: {
        create: jest.fn().mockResolvedValue({ id: 99 }),
      },
      aSIN: {
        upsert: jest.fn().mockResolvedValue({}),
      },
    };

    analysisService = {
      queueForAnalysis: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeepaQueueService,
        { provide: PrismaService, useValue: prismaService },
        { provide: AnalysisService, useValue: analysisService },
        { provide: KeepaService, useValue: keepaService },
      ],
    }).compile();

    service = module.get<KeepaQueueService>(KeepaQueueService);
  });

  it('должен успешно инициализировать сервис очереди', () => {
    expect(service).toBeDefined();
  });

  describe('enqueueRequest', () => {
    it('должен ставить задачу с явным приоритетом CRITICAL (100) при передаче параметра', async () => {
      const job = await service.enqueueRequest(
        KeepaRequestType.PRODUCT_ASINS,
        { asins: ['B001TEST01'] },
        KEEPA_PRIORITY.CRITICAL,
        1,
      );

      expect(prismaService.keepaRequestQueue.create).toHaveBeenCalledWith({
        data: {
          type: KeepaRequestType.PRODUCT_ASINS,
          payload: { asins: ['B001TEST01'] },
          priority: KEEPA_PRIORITY.CRITICAL,
          expectedCost: 1,
          status: KeepaRequestStatus.PENDING,
        },
      });
      expect(job.id).toBe(1);
    });

    it('должен ставить задачу с приоритетом NORMAL (10) по умолчанию', async () => {
      // Вызываем без явного приоритета - по умолчанию должен быть NORMAL (10) и expectedCost = 1
      const job = await service.enqueueRequest(
        KeepaRequestType.PRODUCT_ASINS,
        { asins: ['B001TEST01'] },
      );

      expect(prismaService.keepaRequestQueue.create).toHaveBeenCalledWith({
        data: {
          type: KeepaRequestType.PRODUCT_ASINS,
          payload: { asins: ['B001TEST01'] },
          priority: KEEPA_PRIORITY.NORMAL,
          expectedCost: 1,
          status: KeepaRequestStatus.PENDING,
        },
      });
      expect(job.id).toBe(1);
    });
  });

  describe('Резерв токенов и приоритеты в processNextJobs', () => {
    it('не должен запускать обычную задачу NORMAL, если токенов меньше либо равно резерву (<= 10)', async () => {
      // Искусственно устанавливаем баланс токенов равным 10 (весь резерв)
      (service as any).tokensLeft = 10;

      // Мокаем кандидатов из БД: обычная задача с приоритетом NORMAL (10)
      prismaService.keepaRequestQueue.findFirst.mockResolvedValue({
        id: 10,
        type: KeepaRequestType.PRODUCT_ASINS,
        priority: KEEPA_PRIORITY.NORMAL,
        expectedCost: 1,
        status: KeepaRequestStatus.PENDING,
        payload: { asins: ['B001TEST01'] },
      });

      // Мокаем refreshTokensStatus, чтобы баланс остался 10
      jest.spyOn(service, 'refreshTokensStatus').mockResolvedValue({ tokensLeft: 10, refillRate: 1 });

      await service.processNextJobs();

      // Задача не должна была быть захвачена в PROCESSING, так как резерв 10 токенов неприкосновенен
      expect(prismaService.keepaRequestQueue.update).not.toHaveBeenCalled();
    });

    it('должен разрешать экстренной задаче CRITICAL расходовать токены из резерва', async () => {
      // Искусственно устанавливаем баланс токенов = 5 (внутри резерва)
      (service as any).tokensLeft = 5;

      const criticalJob = {
        id: 77,
        type: KeepaRequestType.PRODUCT_ASINS,
        priority: KEEPA_PRIORITY.CRITICAL,
        expectedCost: 1,
        status: KeepaRequestStatus.PENDING,
        payload: { asins: ['B001URGENT'] },
      };

      prismaService.keepaRequestQueue.findFirst
        .mockResolvedValueOnce(criticalJob)
        .mockResolvedValueOnce(null); // Второй раз возвращает null для выхода из цикла

      // Проверяем вызов executeJob в основном сервисе KeepaService
      keepaService.executeJob = jest.fn().mockResolvedValue({ totalAsins: 1, processedCount: 1 });

      await service.processNextJobs();

      // Экстренная задача должна быть успешно захвачена и выполнена
      expect(prismaService.keepaRequestQueue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 77, status: KeepaRequestStatus.PENDING },
          data: expect.objectContaining({ status: KeepaRequestStatus.PROCESSING }),
        }),
      );
      expect(keepaService.executeJob).toHaveBeenCalledWith(expect.objectContaining({ id: 77 }));
    });
  });
});
