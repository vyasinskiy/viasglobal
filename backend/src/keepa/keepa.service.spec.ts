import { Test, TestingModule } from '@nestjs/testing';
import { KeepaService } from './keepa.service';
import { PrismaService } from '../prisma/prisma.service';
import { AnalysisService } from '../analysis/analysis.service';

describe('KeepaService', () => {
  let service: KeepaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeepaService,
        {
          provide: PrismaService,
          useValue: {},
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
