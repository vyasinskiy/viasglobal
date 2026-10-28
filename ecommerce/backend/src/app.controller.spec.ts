import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController (Контроллер приложения и хелсчеков)', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('Корневой маршрут (root)', () => {
    it('должен возвращать приветственную строку "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('Эндпоинт мониторинга бэкапов (GET /health/backups)', () => {
    it('должен возвращать структурированный объект со статусом здоровья бэкапов', () => {
      const result = appController.getBackupHealth();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('checksPassed');
      expect(result).toHaveProperty('message');
    });
  });
});

