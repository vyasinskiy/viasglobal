import { Module } from '@nestjs/common';
import { AnalysisModule } from '../analysis/analysis.module';
import { KeepaService } from './keepa.service';
import { KeepaQueueService } from './keepa-queue.service';
import { KeepaController } from './keepa.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AnalysisModule],
  controllers: [KeepaController],
  providers: [KeepaService, KeepaQueueService],
  exports: [KeepaService, KeepaQueueService],
})
export class KeepaModule {}
