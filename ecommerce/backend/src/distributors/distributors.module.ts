import { Module } from '@nestjs/common';
import { DistributorsController } from './distributors.controller';
import { DistributorsService } from './distributors.service';
import { EmailSyncService } from './email-sync.service';

@Module({
  controllers: [DistributorsController],
  providers: [DistributorsService, EmailSyncService],
  exports: [DistributorsService, EmailSyncService],
})
export class DistributorsModule {}
