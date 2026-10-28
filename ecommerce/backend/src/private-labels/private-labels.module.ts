import { Module } from '@nestjs/common';
import { PrivateLabelsController } from './private-labels.controller';
import { PrivateLabelsService } from './private-labels.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrivateLabelsController],
  providers: [PrivateLabelsService],
})
export class PrivateLabelsModule {}
