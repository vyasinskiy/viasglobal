import { Body, Controller, Get, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ScrapingService } from './scraping.service';
import { BrowserManagerService } from './browser-manager.service';
import { ManualScanDto } from './dto/manual-scan.dto';

@ApiTags('scraping')
@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly scrapingService: ScrapingService,
    private readonly browserManager: BrowserManagerService
  ) {
    this.scan = this.scan.bind(this);
    this.getRuns = this.getRuns.bind(this);
    this.startBrowser = this.startBrowser.bind(this);
    this.stopBrowser = this.stopBrowser.bind(this);
    this.getBrowserStatus = this.getBrowserStatus.bind(this);
  }

  @Post('scan')
  @MessagePattern('run_scan')
  @ApiOperation({ summary: 'Запуск сессионного сканирования начислений вручную' })
  @ApiBody({ type: ManualScanDto, required: false })
  @ApiOkResponse({ description: 'Результаты сканирования' })
  scan(@Body() @Payload() body: ManualScanDto) {
    return this.scrapingService.scan(body ?? {});
  }

  @Get('runs')
  @ApiOperation({ summary: 'История последних запусков сканирования' })
  getRuns() {
    return this.scrapingService.getStatus();
  }

  @Post('browser/start')
  @MessagePattern('start_browser')
  @ApiOperation({ summary: 'Запуск удаленного визуального браузера для прохождения авторизации' })
  @ApiOkResponse({ description: 'Статус запуска и ссылка на веб-интерфейс браузера' })
  startBrowser() {
    return this.browserManager.startBrowser();
  }

  @Post('browser/stop')
  @MessagePattern('stop_browser')
  @ApiOperation({ summary: 'Остановка удаленного визуального браузера и освобождение профиля сессии' })
  @ApiOkResponse({ description: 'Статус остановки браузера' })
  stopBrowser() {
    return this.browserManager.stopBrowser();
  }

  @Get('browser/status')
  @MessagePattern('get_browser_status')
  @ApiOperation({ summary: 'Проверка статуса работы удаленного визуального браузера' })
  @ApiOkResponse({ description: 'Текущий статус контейнера браузера' })
  getBrowserStatus() {
    return this.browserManager.getStatus();
  }
}
