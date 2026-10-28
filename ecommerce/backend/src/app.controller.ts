import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Эндпоинт мониторинга состояния резервных копий всех баз данных
   * Возвращает сводный JSON-статус для OpenClaw, Prometheus и внешних хелсчеков
   */
  @Get('health/backups')
  getBackupHealth() {
    return this.appService.getBackupHealth();
  }
}

