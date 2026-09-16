import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { KeepaService } from './keepa.service';
import { KeepaProductService } from './keepa-product.service';
import { KeepaQueryService } from './keepa-query.service';
import { KeepaQueueService } from './keepa-queue.service';
import { KeepaController } from './keepa.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AnalysisModule],
  controllers: [KeepaController],
  providers: [
    KeepaService,
    KeepaProductService,
    KeepaQueryService,
    KeepaQueueService,
  ],
  exports: [
    KeepaService,
    KeepaProductService,
    KeepaQueryService,
    KeepaQueueService,
  ],
})
export class KeepaModule {}
