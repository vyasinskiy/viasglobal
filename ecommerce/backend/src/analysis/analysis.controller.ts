import { Controller, Post, HttpCode } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('process-queue')
  @HttpCode(202)
  processQueueForcibly() {
    // Запускаем асинхронно, не дожидаясь завершения
    this.analysisService.processAllQueueBackground().catch((e) => {
      console.error('Ошибка при принудительной обработке очереди:', e);
    });
    return { message: 'Принудительная обработка всей очереди анализа запущена в фоне' };
  }
}
