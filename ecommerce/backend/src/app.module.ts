import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BrandsModule } from './brands/brands.module';
import { DistributorsModule } from './distributors/distributors.module';
import { PrivateLabelsModule } from './private-labels/private-labels.module';
import { KeepaModule } from './keepa/keepa.module';
import { AnalysisModule } from './analysis/analysis.module';
import { OrdersModule } from './orders/orders.module';
import { InventoryModule } from './inventory/inventory.module';
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    PrismaModule, 
    BrandsModule, 
    DistributorsModule, 
    PrivateLabelsModule, 
    KeepaModule,
    AnalysisModule,
    OrdersModule,
    InventoryModule,
    SalesModule,
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
