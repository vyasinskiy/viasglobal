import { Test, TestingModule } from '@nestjs/testing';
import { DistributorsService } from './distributors.service';

describe('DistributorsService', () => {
  let service: DistributorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DistributorsService],
    }).compile();

    service = module.get<DistributorsService>(DistributorsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
