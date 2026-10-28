import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

describe('AnalysisController (HTTP эндпоинты запуска анализа юнит-экономики)', () => {
  let controller: AnalysisController;
  let service: jest.Mocked<Partial<AnalysisService>>;

  beforeEach(async () => {
    service = {
      processAllQueueBackground: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        { provide: AnalysisService, useValue: service },
      ],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
  });

  describe('POST /analysis/process-queue', () => {
    it('должен возвращать статусное сообщение о запуске фоновой обработки очереди', async () => {
      const response = controller.processQueueForcibly();

      // Проверяем, что эндпоинт отдает понятный диагностический ответ
      expect(response).toBeDefined();
      expect(response.message).toContain('Принудительная обработка всей очереди анализа запущена');
      expect(service.processAllQueueBackground).toHaveBeenCalled();
    });
  });
});
