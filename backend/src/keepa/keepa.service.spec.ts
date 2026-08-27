import { Test, TestingModule } from '@nestjs/testing';
import { KeepaService } from './keepa.service';
import { PrismaService } from '../prisma/prisma.service';

describe('KeepaService', () => {
  let service: KeepaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeepaService,
        {
          provide: PrismaService,
          useValue: {},
        }
      ],
    }).compile();

    service = module.get<KeepaService>(KeepaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
