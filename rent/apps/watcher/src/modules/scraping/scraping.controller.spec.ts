import { Test, TestingModule } from '@nestjs/testing';
import { ScrapingController } from './scraping.controller';
import { ScrapingService } from './scraping.service';
import { ScanSummary } from '../../types';

describe('ScrapingController (HTTP эндпоинты сканирования)', () => {
  let controller: ScrapingController;
  let service: jest.Mocked<Partial<ScrapingService>>;

  beforeEach(async () => {
    // Мокируем методы сервиса сканирования для изоляции контроллера
    service = {
      scan: jest.fn(),
      getStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScrapingController],
      providers: [
        {
          provide: ScrapingService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ScrapingController>(ScrapingController);
  });

  describe('POST /scraping/scan', () => {
    it('должен возвращать полный структурированный ответ при успешном сканировании', async () => {
      // Подготавливаем эталонный ответ успешного сканирования
      const mockSuccessSummary: ScanSummary = {
        startedAt: '2026-10-04T20:00:00.000Z',
        finishedAt: '2026-10-04T20:00:15.000Z',
        trigger: 'manual',
        status: 'success',
        message: 'Сканирование успешно завершено. Найдено 3 квартиры.',
        apartmentsScanned: 3,
        accrualsObserved: 6,
        invoicesObserved: 6,
        newApartments: 0,
        newAccruals: 1,
        newInvoices: 1,
        needsLogin: false,
      };

      (service.scan as jest.Mock).mockResolvedValue(mockSuccessSummary);

      // Вызываем контроллер напрямую
      const result = await controller.scan({});

      // Проверяем полноту и вменяемость структуры ответа для диагностики
      expect(result).toBeDefined();
      expect(result.status).toBe('success');
      expect(result.apartmentsScanned).toBe(3);
      expect(result.message).toContain('Сканирование успешно завершено');
      expect(result.needsLogin).toBe(false);
      expect(result.startedAt).toBeDefined();
      expect(result.finishedAt).toBeDefined();
    });

    it('должен возвращать детальное поле ошибки и статус needs_login при истекшей сессии', async () => {
      // Подготавливаем ответ со статусом истекшей сессии
      const errorText = 'Сессия авторизации истекла. Требуется ручной вход через visual-browser.';
      const mockLoginSummary: ScanSummary = {
        startedAt: '2026-10-04T20:00:00.000Z',
        finishedAt: '2026-10-04T20:00:03.000Z',
        trigger: 'manual',
        status: 'needs_login',
        message: errorText,
        error: errorText,
        errors: [errorText],
        apartmentsScanned: 0,
        accrualsObserved: 0,
        invoicesObserved: 0,
        newApartments: 0,
        newAccruals: 0,
        newInvoices: 0,
        needsLogin: true,
      };

      (service.scan as jest.Mock).mockResolvedValue(mockLoginSummary);

      const result = await controller.scan({ trigger: 'manual' });

      // Проверяем, что в ответе присутствуют поля error и errors для автономного анализа ИИ-агентами
      expect(result.status).toBe('needs_login');
      expect(result.needsLogin).toBe(true);
      expect(result.error).toBe(errorText);
      expect(result.errors).toContain(errorText);
    });

    it('должен возвращать статус error и массив причин при сбое парсера', async () => {
      // Подготавливаем ответ при критическом сбое
      const failReason = 'Ошибка сетевого подключения к порталу kvartplata.online: 502 Bad Gateway';
      const mockErrorSummary: ScanSummary = {
        startedAt: '2026-10-04T20:00:00.000Z',
        finishedAt: '2026-10-04T20:00:05.000Z',
        trigger: 'manual',
        status: 'error',
        message: failReason,
        error: failReason,
        errors: [failReason],
        apartmentsScanned: 0,
        accrualsObserved: 0,
        invoicesObserved: 0,
        newApartments: 0,
        newAccruals: 0,
        newInvoices: 0,
        needsLogin: false,
      };

      (service.scan as jest.Mock).mockResolvedValue(mockErrorSummary);

      const result = await controller.scan({});

      // Проверяем статус и исчерпывающую информацию о сбое
      expect(result.status).toBe('error');
      expect(result.error).toBe(failReason);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('GET /scraping/runs', () => {
    it('должен возвращать историю запусков с полными диагностическими данными', async () => {
      // Мокируем список запусков из базы данных
      const mockRuns = [
        {
          id: 101,
          startedAt: new Date('2026-10-04T19:00:00.000Z'),
          finishedAt: new Date('2026-10-04T19:00:10.000Z'),
          trigger: 'manual',
          status: 'success',
          message: 'Scanned 3 apartment(s)',
          apartmentsScanned: 3,
          accrualsObserved: 3,
          invoicesObserved: 3,
          newApartments: 0,
          newAccruals: 0,
          newInvoices: 0,
          needsLogin: false,
          summaryJson: JSON.stringify({ status: 'success' }),
        },
        {
          id: 102,
          startedAt: new Date('2026-10-04T19:30:00.000Z'),
          finishedAt: new Date('2026-10-04T19:30:03.000Z'),
          trigger: 'cron',
          status: 'needs_login',
          message: 'Сессия авторизации истекла',
          apartmentsScanned: 0,
          accrualsObserved: 0,
          invoicesObserved: 0,
          newApartments: 0,
          newAccruals: 0,
          newInvoices: 0,
          needsLogin: true,
          summaryJson: JSON.stringify({ status: 'needs_login', error: 'Сессия авторизации истекла' }),
        },
      ];

      (service.getStatus as jest.Mock).mockResolvedValue(mockRuns);

      const runs = await controller.getRuns();

      // Проверяем, что эндпоинт отдает массив с полными полями аудита
      expect(Array.isArray(runs)).toBe(true);
      expect(runs).toHaveLength(2);
      expect(runs[0].id).toBe(101);
      expect(runs[0].status).toBe('success');
      expect(runs[1].status).toBe('needs_login');
      expect(runs[1].summaryJson).toContain('Сессия авторизации истекла');
    });
  });
});
