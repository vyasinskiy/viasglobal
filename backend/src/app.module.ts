import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BrandsModule } from './brands/brands.module';
import { DistributorsModule } from './distributors/distributors.module';
import { PrivateLabelsModule } from './private-labels/private-labels.module';
import { KeepaModule } from './keepa/keepa.module';

@Module({
  imports: [
    PrismaModule, 
    BrandsModule, 
    DistributorsModule, 
    PrivateLabelsModule, 
    KeepaModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
