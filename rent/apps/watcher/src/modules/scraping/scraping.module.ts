import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { BrowserManagerService } from './browser-manager.service';

@Module({
  imports: [CommonModule],
  controllers: [ScrapingController],
  providers: [ScrapingService, BrowserManagerService],
  exports: [ScrapingService, BrowserManagerService]
})
export class ScrapingModule {}
