import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BrandsModule } from './brands/brands.module';
import { DistributorsModule } from './distributors/distributors.module';
import { PrivateLabelsModule } from './private-labels/private-labels.module';

@Module({
  imports: [PrismaModule, BrandsModule, DistributorsModule, PrivateLabelsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
