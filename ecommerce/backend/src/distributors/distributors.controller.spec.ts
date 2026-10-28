import { Test, TestingModule } from '@nestjs/testing';
import { DistributorsController } from './distributors.controller';
import { DistributorsService } from './distributors.service';

describe('DistributorsController', () => {
  let controller: DistributorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DistributorsController],
      providers: [
        { provide: DistributorsService, useValue: {} },
      ],
    }).compile();

    controller = module.get<DistributorsController>(DistributorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
