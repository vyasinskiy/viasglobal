import { Test, TestingModule } from '@nestjs/testing';
import { BrowserManagerService } from './browser-manager.service';

describe('BrowserManagerService (Управление удаленным визуальным браузером)', () => {
  let service: BrowserManagerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BrowserManagerService],
    }).compile();

    service = module.get<BrowserManagerService>(BrowserManagerService);
  });

  it('сервис должен быть успешно инициализирован', () => {
    expect(service).toBeDefined();
  });

  describe('getStatus', () => {
    it('должен корректно обрабатывать отсутствие docker socket в тестовом окружении', async () => {
      const status = await service.getStatus();

      expect(status).toBeDefined();
      expect(typeof status.isRunning).toBe('boolean');
      expect(['running', 'stopped', 'not_found', 'error']).toContain(status.status);
      expect(status.browserUrl).toContain('http');
      expect(status.message).toBeDefined();
    });
  });

  describe('startBrowser', () => {
    it('должен возвращать статус already_running, если контейнер уже работает', async () => {
      // Мокируем getStatus для имитации работающего контейнера
      jest.spyOn(service, 'getStatus').mockResolvedValue({
        isRunning: true,
        status: 'running',
        browserUrl: 'https://browser.viasglobal.es',
        message: 'Удаленный виртуальный браузер активен.',
      });

      const result = await service.startBrowser();

      expect(result.success).toBe(true);
      expect(result.status).toBe('already_running');
      expect(result.browserUrl).toBe('https://browser.viasglobal.es');
      expect(result.message).toContain('уже запущен');
    });
  });

  describe('stopBrowser', () => {
    it('должен возвращать статус already_stopped, если контейнер уже не работает', async () => {
      // Мокируем getStatus для имитации остановленного контейнера
      jest.spyOn(service, 'getStatus').mockResolvedValue({
        isRunning: false,
        status: 'stopped',
        browserUrl: 'https://browser.viasglobal.es',
        message: 'Удаленный виртуальный браузер остановлен.',
      });

      const result = await service.stopBrowser();

      expect(result.success).toBe(true);
      expect(result.status).toBe('already_stopped');
      expect(result.browserUrl).toBe('https://browser.viasglobal.es');
      expect(result.message).toContain('уже остановлен');
    });
  });
});
