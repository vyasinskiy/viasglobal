import { Module } from '@nestjs/common';
import { KeepaService } from './keepa.service';
import { KeepaController } from './keepa.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KeepaController],
  providers: [KeepaService]
})
export class KeepaModule {}
