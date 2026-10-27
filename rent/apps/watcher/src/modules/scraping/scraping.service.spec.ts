import { Test, TestingModule } from '@nestjs/testing';
import { ScrapingService } from './scraping.service';
import { AccountantClientService } from '../../common/services/accountant-client.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { KvartplataAdapter, InvoiceNotFoundError } from './adapter';
import { ClientProxy } from '@nestjs/microservices';
import * as fs from 'node:fs';
import { of } from 'rxjs';

jest.mock('node:fs');

describe('ScrapingService', () => {
  let service: ScrapingService;
  let accountantClientService: AccountantClientService;
  let prismaService: PrismaService;
  let accountantClient: ClientProxy;
  let notificationsClient: ClientProxy;

  const mockAccountantClientService = {
    findApartments: jest.fn(),
    findInvoices: jest.fn(),
    getUploadUrl: jest.fn(),
  };

  const mockPrismaService = {
    run: {
      create: jest.fn().mockResolvedValue({ id: 'run-id' }),
      update: jest.fn().mockResolvedValue({ id: 'run-id' }),
    },
  };

  const mockAccountantClient = {
    emit: jest.fn(),
    send: jest.fn().mockReturnValue(of({})),
  };

  const mockNotificationsClient = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScrapingService,
        { provide: AccountantClientService, useValue: mockAccountantClientService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: 'ACCOUNTANT_SERVICE', useValue: mockAccountantClient },
        { provide: 'NOTIFICATIONS_SERVICE', useValue: mockNotificationsClient },
      ],
    }).compile();

    service = module.get<ScrapingService>(ScrapingService);
    accountantClientService = module.get<AccountantClientService>(AccountantClientService);
    prismaService = module.get<PrismaService>(PrismaService);
    accountantClient = module.get<ClientProxy>('ACCOUNTANT_SERVICE');
    notificationsClient = module.get<ClientProxy>('NOTIFICATIONS_SERVICE');

    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // Mock global fetch
    global.fetch = jest.fn();
  });

  it('should skip invoice if it is already uploaded to storage', async () => {
    const mockInvoice = {
      accountExternalId: 'acc-1',
      periodId: '202605',
      periodLabel: 'May 2026',
      available: true,
      invoiceUrl: 'http://example.com/invoice.pdf',
      uploadedToStorage: false,
    };

    jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
      apartments: [],
      accounts: [{ externalId: 'acc-1', apartmentExternalId: 'apt-1' } as any],
      accruals: [],
      invoices: [mockInvoice as any],
      needsLogin: false,
      degraded: false,
      message: 'Scan successful',
    });

    mockAccountantClientService.findApartments.mockResolvedValue([]);
    mockAccountantClientService.findInvoices.mockResolvedValue([{ 
        accountExternalId: 'acc-1', 
        periodId: '202605',
        uploadedToStorage: true 
    }]);

    const summary = await service.scan({ trigger: 'manual' });

    expect(summary.status).toBe('success');
    expect(mockAccountantClientService.findInvoices).toHaveBeenCalledWith(expect.objectContaining({
      accountExternalId: ['acc-1'],
      uploadedToStorage: true,
    }));
    expect(mockAccountantClientService.getUploadUrl).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    // It should still emit upsert_invoice to keep accountant updated, but without uploadedToStorage: true change if it was already true?
    // Actually the code emits it anyway.
    expect(accountantClient.emit).toHaveBeenCalledWith('upsert_invoice', expect.objectContaining({
        accountExternalId: 'acc-1',
        periodId: '202605'
    }));
  });

  it('should download and upload invoice if it is not in storage', async () => {
    const mockInvoice = {
      accountExternalId: 'acc-1',
      periodId: '202605',
      periodLabel: 'May 2026',
      available: true,
      invoiceUrl: 'http://example.com/invoice.pdf',
      uploadedToStorage: false,
      rawJson: '{}',
    };

    jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
      apartments: [],
      accounts: [{ externalId: 'acc-1', apartmentExternalId: 'apt-1' } as any],
      accruals: [],
      invoices: [mockInvoice as any],
      needsLogin: false,
      degraded: false,
      message: 'Scan successful',
    });

    const mockPdfBuffer = Buffer.from('pdf content');
    jest.spyOn(KvartplataAdapter.prototype, 'downloadInvoice').mockResolvedValue(mockPdfBuffer);

    mockAccountantClientService.findApartments.mockResolvedValue([]);
    mockAccountantClientService.findInvoices.mockResolvedValue([]); // No existing invoice
    mockAccountantClientService.getUploadUrl.mockResolvedValue({
      url: 'http://storage-upload-url',
      key: 'invoices/acc-1/202605.pdf',
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });

    const summary = await service.scan({ trigger: 'manual' });

    expect(summary.status).toBe('success');
    expect(mockAccountantClientService.getUploadUrl).toHaveBeenCalledWith('acc-1', 'May 2026');
    expect(KvartplataAdapter.prototype.downloadInvoice).toHaveBeenCalledWith('http://example.com/invoice.pdf');
    expect(global.fetch).toHaveBeenCalledWith('http://storage-upload-url', expect.objectContaining({
      method: 'PUT',
      body: new Uint8Array(mockPdfBuffer),
    }));
    expect(accountantClient.emit).toHaveBeenCalledWith('upsert_invoice', expect.objectContaining({
      accountExternalId: 'acc-1',
      uploadedToStorage: true,
      localFilePath: 'invoices/acc-1/202605.pdf',
    }));
  });

  it('should process invoice if it exists in DB but is NOT marked as uploaded', async () => {
    const mockInvoice = {
      accountExternalId: 'acc-2',
      periodId: '202606',
      periodLabel: 'June 2026',
      available: true,
      invoiceUrl: 'http://example.com/invoice2.pdf',
      uploadedToStorage: false,
      rawJson: '{}',
    };

    jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
      apartments: [],
      accounts: [{ externalId: 'acc-2', apartmentExternalId: 'apt-1' } as any],
      accruals: [],
      invoices: [mockInvoice as any],
      needsLogin: false,
      degraded: false,
      message: 'Scan successful',
    });

    const mockPdfBuffer = Buffer.from('pdf content 2');
    jest.spyOn(KvartplataAdapter.prototype, 'downloadInvoice').mockResolvedValue(mockPdfBuffer);

    mockAccountantClientService.findApartments.mockResolvedValue([]);
    mockAccountantClientService.findInvoices.mockResolvedValue([]); // uploadedToStorage filter is true, so it should return empty
    mockAccountantClientService.getUploadUrl.mockResolvedValue({
      url: 'http://storage-upload-url-2',
      key: 'invoices/acc-2/202606.pdf',
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
    });

    const summary = await service.scan({ trigger: 'manual' });

    expect(summary.status).toBe('success');
    expect(mockAccountantClientService.getUploadUrl).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalled();
    expect(accountantClient.emit).toHaveBeenCalledWith('upsert_invoice', expect.objectContaining({
      accountExternalId: 'acc-2',
      uploadedToStorage: true,
    }));
  });

  it('should set status to warning if an invoice upload fails', async () => {
    const mockInvoice = {
      accountExternalId: 'acc-3',
      periodId: '202607',
      periodLabel: 'July 2026',
      available: true,
      invoiceUrl: 'http://example.com/fail.pdf',
      uploadedToStorage: false,
      rawJson: '{}',
    };

    jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
      apartments: [],
      accounts: [{ externalId: 'acc-3', apartmentExternalId: 'apt-1' } as any],
      accruals: [],
      invoices: [mockInvoice as any],
      needsLogin: false,
      degraded: false,
      message: 'Scan successful',
    });

    jest.spyOn(KvartplataAdapter.prototype, 'downloadInvoice').mockRejectedValue(new Error('Download error'));

    mockAccountantClientService.findApartments.mockResolvedValue([]);
    mockAccountantClientService.findInvoices.mockResolvedValue([]);

    const summary = await service.scan({ trigger: 'manual' });

    expect(summary.status).toBe('warning');
    expect(accountantClient.emit).toHaveBeenCalledWith('upsert_invoice', expect.objectContaining({
      accountExternalId: 'acc-3',
      uploadedToStorage: false,
    }));
  });

  it('должен устанавливать статус needs_login, возвращать ошибку и сохранять её в БД при needsLogin: true', async () => {
    // Мокируем результат работы адаптера с флагом истекшей сессии и ошибкой
    const errorMessage = 'Сессия авторизации истекла. Требуется ручной вход.';
    jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
      apartments: [],
      accounts: [],
      accruals: [],
      invoices: [],
      needsLogin: true,
      degraded: false,
      message: errorMessage,
      error: errorMessage,
      errors: [errorMessage]
    });

    mockAccountantClientService.findApartments.mockResolvedValue([]);

    // Вызываем сканирование сервиса
    const summary = await service.scan({ trigger: 'manual' });

    // Проверяем, что в результирующей сводке выставлен статус needs_login, флаг needsLogin и поля ошибок
    expect(summary.status).toBe('needs_login');
    expect(summary.needsLogin).toBe(true);
    expect(summary.message).toContain('Сессия авторизации истекла');
    expect(summary.error).toBe(errorMessage);
    expect(summary.errors).toEqual([errorMessage]);

    // Проверяем, что в базу данных передан проблемный статус и JSON с ошибкой
    expect(mockPrismaService.run.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'needs_login',
        needsLogin: true,
        message: expect.stringContaining(errorMessage),
        summaryJson: expect.stringContaining(errorMessage)
      })
    }));
  });

  it('должен перехватывать исключение сканирования, возвращать статус error и сохранять ошибку в БД', async () => {
    const fatalError = new Error('Фатальный сбой подключения к kvartplata.online');
    jest.spyOn(KvartplataAdapter.prototype, 'scan').mockRejectedValue(fatalError);

    mockAccountantClientService.findApartments.mockResolvedValue([]);

    // Запускаем сканирование
    const summary = await service.scan({ trigger: 'manual' });

    // Проверяем, что статус сводки стал error с детальным описанием сбоя
    expect(summary.status).toBe('error');
    expect(summary.error).toBe(fatalError.message);
    expect(summary.errors).toEqual([fatalError.message]);
    expect(summary.message).toContain('Фатальный сбой подключения');

    // Проверяем сохранение проблемного запуска в БД
    expect(mockPrismaService.run.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'error',
        message: expect.stringContaining(fatalError.message),
        summaryJson: expect.stringContaining(fatalError.message)
      })
    }));
  });

  describe('Ожидаемая ошибка 404 для инвойсов за текущий и последний месяц (Golden Snapshot Test)', () => {
    it('должен сохранять статус success и не создавать предупреждений при ошибке 404 по инвойсам за текущий месяц (кейс 202610, л/с 6603378, 3475821, 464655)', async () => {
      // Подготавливаем эталонные инвойсы из реального отчета пользователя за период 202610
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentPeriodId = `${currentYear}${currentMonth}`;

      const mockInvoices = [
        {
          accountExternalId: '6603378',
          periodId: currentPeriodId,
          periodLabel: currentPeriodId,
          available: true,
          invoiceUrl: 'http://example.com/invoice-6603378.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
        {
          accountExternalId: '3475821',
          periodId: currentPeriodId,
          periodLabel: currentPeriodId,
          available: true,
          invoiceUrl: 'http://example.com/invoice-3475821.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
        {
          accountExternalId: '464655',
          periodId: currentPeriodId,
          periodLabel: currentPeriodId,
          available: true,
          invoiceUrl: 'http://example.com/invoice-464655.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
      ];

      // Мокируем результат сканирования адаптера со всеми тремя инвойсами
      jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
        apartments: [{ externalId: 'apt-1', address: 'ул. Тестовая 1' } as any],
        accounts: [
          { externalId: '6603378', apartmentExternalId: 'apt-1' } as any,
          { externalId: '3475821', apartmentExternalId: 'apt-1' } as any,
          { externalId: '464655', apartmentExternalId: 'apt-1' } as any,
        ],
        accruals: [],
        invoices: mockInvoices as any,
        needsLogin: false,
        degraded: false,
        message: 'Scanned 1 apartment(s), 3 account(s).',
      });

      // Имитируем ошибку 404 от портала квартплаты (файл квитанции еще не сформирован УК)
      jest.spyOn(KvartplataAdapter.prototype, 'downloadInvoice')
        .mockRejectedValue(new InvoiceNotFoundError(404, 'Failed to download invoice: 404'));

      mockAccountantClientService.findApartments.mockResolvedValue([]);
      mockAccountantClientService.findInvoices.mockResolvedValue([]);
      mockAccountantClientService.getUploadUrl.mockImplementation(async (accountId, period) => ({
        url: `http://storage.internal/upload?key=invoices/${accountId}/${period}.pdf`,
        key: `invoices/${accountId}/${period}.pdf`
      }));

      // Запускаем процесс сканирования
      const summary = await service.scan({ trigger: 'cron' });

      // Статус должен оставаться строго 'success', а не 'warning'
      expect(summary.status).toBe('success');
      // Поля ошибок должны отсутствовать, предотвращая отправку ложных алертов в Telegram
      expect(summary.error).toBeUndefined();
      expect(summary.errors).toBeUndefined();

      // Проверяем, что все инвойсы сохранены в БД со статусом available=false
      expect(accountantClient.emit).toHaveBeenCalledWith('upsert_invoice', expect.objectContaining({
        accountExternalId: '6603378',
        available: false,
        uploadedToStorage: false,
      }));
      expect(accountantClient.emit).toHaveBeenCalledWith('upsert_invoice', expect.objectContaining({
        accountExternalId: '3475821',
        available: false,
        uploadedToStorage: false,
      }));
      expect(accountantClient.emit).toHaveBeenCalledWith('upsert_invoice', expect.objectContaining({
        accountExternalId: '464655',
        available: false,
        uploadedToStorage: false,
      }));
    });

    it('должен переводить статус в warning и фиксировать сбой системы, если эти инвойсы за 202610 (л/с 6603378, 3475821, 464655) не прогрузились и в следующем месяце (появился период 202611)', async () => {
      // Период октября (202610) и следующий месяц (202611)
      const octoberInvoices = [
        {
          accountExternalId: '6603378',
          periodId: '202610',
          periodLabel: '202610',
          available: true,
          invoiceUrl: 'http://example.com/invoice-6603378-oct.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
        {
          accountExternalId: '3475821',
          periodId: '202610',
          periodLabel: '202610',
          available: true,
          invoiceUrl: 'http://example.com/invoice-3475821-oct.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
        {
          accountExternalId: '464655',
          periodId: '202610',
          periodLabel: '202610',
          available: true,
          invoiceUrl: 'http://example.com/invoice-464655-oct.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
      ];

      // В следующем месяце по лицевым счетам уже выставлены начисления за ноябрь (202611)
      const novemberInvoices = [
        {
          accountExternalId: '6603378',
          periodId: '202611',
          periodLabel: '202611',
          available: true,
          invoiceUrl: 'http://example.com/invoice-6603378-nov.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
        {
          accountExternalId: '3475821',
          periodId: '202611',
          periodLabel: '202611',
          available: true,
          invoiceUrl: 'http://example.com/invoice-3475821-nov.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
        {
          accountExternalId: '464655',
          periodId: '202611',
          periodLabel: '202611',
          available: true,
          invoiceUrl: 'http://example.com/invoice-464655-nov.pdf',
          uploadedToStorage: false,
          rawJson: '{}',
        },
      ];

      const allDiscoveredInvoices = [...octoberInvoices, ...novemberInvoices];

      jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
        apartments: [{ externalId: 'apt-1', address: 'ул. Тестовая 1' } as any],
        accounts: [
          { externalId: '6603378', apartmentExternalId: 'apt-1' } as any,
          { externalId: '3475821', apartmentExternalId: 'apt-1' } as any,
          { externalId: '464655', apartmentExternalId: 'apt-1' } as any,
        ],
        accruals: [],
        invoices: allDiscoveredInvoices as any,
        needsLogin: false,
        degraded: false,
        message: 'Scanned 1 apartment(s), 3 account(s).',
      });

      // Инвойсы за октябрь по-прежнему отдают 404, а ноябрь успешно скачивается
      const mockPdfBuffer = Buffer.from('nov pdf');
      jest.spyOn(KvartplataAdapter.prototype, 'downloadInvoice').mockImplementation(async (url: string) => {
        if (url.includes('oct')) {
          throw new InvoiceNotFoundError(404, 'Failed to download invoice: 404');
        }
        return mockPdfBuffer;
      });

      mockAccountantClientService.findApartments.mockResolvedValue([]);
      mockAccountantClientService.findInvoices.mockResolvedValue([]);
      mockAccountantClientService.getUploadUrl.mockImplementation(async (accountId, period) => ({
        url: `http://storage.internal/upload?key=invoices/${accountId}/${period}.pdf`,
        key: `invoices/${accountId}/${period}.pdf`
      }));

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });

      // Запускаем сканирование
      const summary = await service.scan({ trigger: 'cron' });

      // Так как наступил следующий месяц и октябрьские квитанции не появились, это сбой -> статус warning
      expect(summary.status).toBe('warning');
      expect(summary.error).toBeDefined();
      expect(summary.error).toContain('Invoice 202610 (6603378): Failed to download invoice: 404');
      expect(summary.error).toContain('Invoice 202610 (3475821): Failed to download invoice: 404');
      expect(summary.error).toContain('Invoice 202610 (464655): Failed to download invoice: 404');
      expect(summary.errors).toHaveLength(3);

      // Проверяем сохранение статуса сбоя в БД (runs)
      expect(mockPrismaService.run.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: 'warning',
          message: expect.stringContaining('Invoice 202610 (6603378): Failed to download invoice: 404')
        })
      }));
    });

    it('должен переводить статус в warning, если ошибка скачивания 404 произошла по старому периоду (202601)', async () => {
      // Инвойс за старый период (январь)
      const oldInvoice = {
        accountExternalId: '6603378',
        periodId: '202601',
        periodLabel: '202601',
        available: true,
        invoiceUrl: 'http://example.com/invoice-old.pdf',
        uploadedToStorage: false,
        rawJson: '{}',
      };

      jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
        apartments: [],
        accounts: [{ externalId: '6603378', apartmentExternalId: 'apt-1' } as any],
        accruals: [],
        invoices: [oldInvoice as any],
        needsLogin: false,
        degraded: false,
        message: 'Scan successful',
      });

      // Ошибка 404 по старому инвойсу
      jest.spyOn(KvartplataAdapter.prototype, 'downloadInvoice')
        .mockRejectedValue(new Error('Failed to download invoice: 404'));

      mockAccountantClientService.findApartments.mockResolvedValue([]);
      mockAccountantClientService.findInvoices.mockResolvedValue([]);
      mockAccountantClientService.getUploadUrl.mockResolvedValue({
        url: 'http://storage.internal/upload',
        key: 'invoices/6603378/202601.pdf'
      });

      const summary = await service.scan({ trigger: 'manual' });

      // Для старого периода отсутствие квитанции является сбоем -> warning
      expect(summary.status).toBe('warning');
      expect(summary.error).toContain('Failed to download invoice: 404');
    });

    it('должен переводить статус в warning, если инвойс текущего месяца завершился серверной ошибкой 500', async () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const currentPeriodId = `${currentYear}${currentMonth}`;

      const currentInvoice = {
        accountExternalId: '6603378',
        periodId: currentPeriodId,
        periodLabel: currentPeriodId,
        available: true,
        invoiceUrl: 'http://example.com/invoice-current.pdf',
        uploadedToStorage: false,
        rawJson: '{}',
      };

      jest.spyOn(KvartplataAdapter.prototype, 'scan').mockResolvedValue({
        apartments: [],
        accounts: [{ externalId: '6603378', apartmentExternalId: 'apt-1' } as any],
        accruals: [],
        invoices: [currentInvoice as any],
        needsLogin: false,
        degraded: false,
        message: 'Scan successful',
      });

      // Серверная ошибка 500 (не 404)
      jest.spyOn(KvartplataAdapter.prototype, 'downloadInvoice')
        .mockRejectedValue(new Error('Failed to download invoice: 500'));

      mockAccountantClientService.findApartments.mockResolvedValue([]);
      mockAccountantClientService.findInvoices.mockResolvedValue([]);
      mockAccountantClientService.getUploadUrl.mockResolvedValue({
        url: 'http://storage.internal/upload',
        key: `invoices/6603378/${currentPeriodId}.pdf`
      });

      const summary = await service.scan({ trigger: 'manual' });

      // Ошибка 500 не является ожидаемой -> warning
      expect(summary.status).toBe('warning');
      expect(summary.error).toContain('Failed to download invoice: 500');
    });
  });
});

