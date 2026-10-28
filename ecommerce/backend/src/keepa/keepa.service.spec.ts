import { Test, TestingModule } from '@nestjs/testing';
import { KeepaService } from './keepa.service';
import { KeepaProductService } from './keepa-product.service';
import { KeepaQueryService } from './keepa-query.service';

describe('Фасадный сервис интеграции с Keepa (KeepaService)', () => {
  let service: KeepaService;
  let productService: any;
  let queryService: any;

  beforeEach(async () => {
    productService = {
      populateQueue: jest.fn().mockResolvedValue(undefined),
      calculateProductsBatchRequestLimit: jest.fn().mockReturnValue(10),
    };

    queryService = {
      fetchAndSaveKeepaExportForCategory: jest.fn().mockResolvedValue({ jobId: 1 }),
      fetchAndSaveKeepaExportForBrand: jest.fn().mockResolvedValue({ jobId: 2 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeepaService,
        {
          provide: KeepaProductService,
          useValue: productService,
        },
        {
          provide: KeepaQueryService,
          useValue: queryService,
        },
      ],
    }).compile();

    service = module.get<KeepaService>(KeepaService);
  });

  it('должен успешно инициализировать фасадный сервис', () => {
    expect(service).toBeDefined();
  });

  it('должен делегировать вызовы товаров в KeepaProductService', async () => {
    await service.populateQueue();
    expect(productService.populateQueue).toHaveBeenCalled();

    const limit = service.calculateProductsBatchRequestLimit();
    expect(limit).toBe(10);
    expect(productService.calculateProductsBatchRequestLimit).toHaveBeenCalled();
  });

  it('должен делегировать вызовы поиска в KeepaQueryService', async () => {
    await service.fetchAndSaveKeepaExportForCategory('123');
    expect(queryService.fetchAndSaveKeepaExportForCategory).toHaveBeenCalledWith('123', undefined, 10);
  });
});
