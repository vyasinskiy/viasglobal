import { Test, TestingModule } from '@nestjs/testing';
import { DistributorsController } from './distributors.controller';

describe('DistributorsController', () => {
  let controller: DistributorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DistributorsController],
    }).compile();

    controller = module.get<DistributorsController>(DistributorsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
