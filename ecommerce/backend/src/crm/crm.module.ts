import { Module } from '@nestjs/common';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';
import { PrismaModule } from '../prisma/prisma.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AppService } from '../app.service';

/**
 * Модуль агрегации данных для панели управления Viasglobal E-Commerce CRM & WMS
 */
@Module({
  imports: [PrismaModule, InventoryModule],
  controllers: [CrmController],
  providers: [CrmService, AppService],
  exports: [CrmService],
})
export class CrmModule {}

