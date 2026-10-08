import { Test, TestingModule } from '@nestjs/testing';
import { AccountantController } from './accountant.controller';
import { AccountantService } from './accountant.service';
import { StorageService } from '../storage/storage.service';

describe('AccountantController (HTTP REST эндпоинты финансового учета)', () => {
  let controller: AccountantController;
  let service: jest.Mocked<Partial<AccountantService>>;
  let storage: jest.Mocked<Partial<StorageService>>;

  beforeEach(async () => {
    // Мокируем методы сервиса бухгалтерского учета
    service = {
      getStats: jest.fn(),
      findApartments: jest.fn(),
      findApartmentById: jest.fn(),
      findAccounts: jest.fn(),
      findAccountById: jest.fn(),
      findAccruals: jest.fn(),
      findInvoices: jest.fn(),
      findInvoiceById: jest.fn(),
      findPayments: jest.fn(),
      createPayment: jest.fn(),
      confirmPayment: jest.fn(),
      rejectPayment: jest.fn(),
      findTenants: jest.fn(),
      findTenantById: jest.fn(),
      createTenant: jest.fn(),
      findMeterSubmissionEvents: jest.fn(),
      findSystemEvents: jest.fn(),
    };

    // Мокируем сервис локального файлового хранилища
    storage = {
      buildInvoiceKey: jest.fn().mockReturnValue('invoices/acc-1/202610.pdf'),
      getUploadUrl: jest.fn().mockReturnValue('http://accruals-accountant:3005/accountant/invoices/upload-raw?key=invoices%2Facc-1%2F202610.pdf'),
      resolveSafePath: jest.fn().mockImplementation((key) => `/data/uploads/${key}`),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountantController],
      providers: [
        {
          provide: AccountantService,
          useValue: service,
        },
        {
          provide: StorageService,
          useValue: storage,
        },
      ],
    }).compile();

    controller = module.get<AccountantController>(AccountantController);
  });

  describe('GET /accountant/stats', () => {
    it('должен возвращать сводную финансовую статистику', async () => {
      const mockStats = {
        totalPayments: 45,
        pendingPayments: 2,
        upcomingEvents: 1,
      };
      (service.getStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await controller.getStatsHttp();

      // Проверяем наличие всех ключевых полей для панели мониторинга
      expect(result).toBeDefined();
      expect(result.totalPayments).toBe(45);
      expect(result.pendingPayments).toBe(2);
      expect(result.upcomingEvents).toBe(1);
    });
  });

  describe('GET /accountant/apartments', () => {
    it('должен возвращать список квартир с привязанными лицевыми счетами', async () => {
      const mockApartments = [
        {
          id: 1,
          externalId: 'apt-101',
          address: 'ул. Ленина, д. 10, кв. 15',
          organization: 'УК Комфорт',
          accounts: [
            { id: 1, externalId: 'acc-1', accountNumber: '78901', balance: -1500.5 },
          ],
        },
      ];
      (service.findApartments as jest.Mock).mockResolvedValue(mockApartments);

      const result = await controller.findApartments({});

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].address).toContain('ул. Ленина');
      expect(result[0].accounts[0].balance).toBe(-1500.5);
    });

    it('должен возвращать детальную информацию по конкретной квартире GET /accountant/apartments/:id', async () => {
      const mockApartment = {
        id: 5,
        externalId: 'apt-5',
        address: 'ул. Мира, 4',
        organization: 'ТСЖ Мир',
      };
      (service.findApartmentById as jest.Mock).mockResolvedValue(mockApartment);

      const result = await controller.findApartment(5);

      expect(result).toBeDefined();
      expect(result.id).toBe(5);
      expect(result.address).toBe('ул. Мира, 4');
    });
  });

  describe('GET /accountant/tenants', () => {
    it('должен возвращать список жильцов с параметрами аренды', async () => {
      const mockTenants = [
        {
          id: 1,
          name: 'Иван Петров',
          apartmentId: 1,
          rentPaymentDay: 5,
          rentAmount: 35000,
          status: 'ACTIVE',
        },
      ];
      (service.findTenants as jest.Mock).mockResolvedValue(mockTenants);

      const result = await controller.getTenants('false');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].name).toBe('Иван Петров');
      expect(result[0].rentAmount).toBe(35000);
    });

    it('должен корректно создавать арендатора POST /accountant/tenants', async () => {
      const newTenantDto = {
        name: 'Ольга Сидорова',
        apartmentId: 2,
        rentPaymentDay: 10,
        rentAmount: 42000,
      };
      const createdTenant = { id: 12, ...newTenantDto, status: 'ACTIVE' };
      (service.createTenant as jest.Mock).mockResolvedValue(createdTenant);

      const result = await controller.createTenant(newTenantDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(12);
      expect(result.name).toBe('Ольга Сидорова');
      expect(result.rentAmount).toBe(42000);
    });
  });

  describe('GET /accountant/invoices/upload-url', () => {
    it('должен генерировать URL загрузки и корректный ключ файла', async () => {
      const result = await controller.getUploadUrl('acc-test', 'Октябрь 2026');

      // Проверяем формирование валидного ключа и URL
      expect(result).toBeDefined();
      expect(result.key).toBe('invoices/acc-1/202610.pdf');
      expect(result.url).toBeDefined();
      expect(storage.buildInvoiceKey).toHaveBeenCalledWith('acc-test', 'Октябрь 2026');
    });
  });

  describe('Платежи арендаторов (GET, POST, confirm, reject)', () => {
    it('должен возвращать список платежей с фильтрацией GET /accountant/payments', async () => {
      const mockPayments = [
        {
          id: 10,
          tenantId: 1,
          amount: 35000,
          status: 'pending',
          comment: 'Аренда за октябрь',
        },
      ];
      (service.findPayments as jest.Mock).mockResolvedValue(mockPayments);

      const result = await controller.findPayments({ status: 'pending' });

      expect(Array.isArray(result)).toBe(true);
      expect(result[0].amount).toBe(35000);
      expect(result[0].status).toBe('pending');
    });

    it('должен регистрировать новый входящий платеж POST /accountant/payments', async () => {
      const paymentData = {
        tenantId: 1,
        amount: 35000,
        comment: 'Перевод Сбербанк',
      };
      const createdPayment = { id: 25, ...paymentData, status: 'pending' };
      (service.createPayment as jest.Mock).mockResolvedValue(createdPayment);

      const result = await controller.createPaymentHttp(paymentData);

      expect(result).toBeDefined();
      expect(result.id).toBe(25);
      expect(result.status).toBe('pending');
    });

    it('должен подтверждать платеж администратором POST /accountant/payments/confirm', async () => {
      const confirmedPayment = { id: 25, status: 'confirmed', confirmedBy: 743866013 };
      (service.confirmPayment as jest.Mock).mockResolvedValue(confirmedPayment);

      const result = await controller.confirmPaymentHttp({ paymentId: 25, confirmedBy: 743866013 });

      expect(result.status).toBe('confirmed');
      expect(result.confirmedBy).toBe(743866013);
    });

    it('должен отклонять некорректный платеж с комментарием POST /accountant/payments/reject', async () => {
      const rejectedPayment = { id: 25, status: 'rejected', comment: 'Неверная сумма перевода' };
      (service.rejectPayment as jest.Mock).mockResolvedValue(rejectedPayment);

      const result = await controller.rejectPaymentHttp({
        paymentId: 25,
        confirmedBy: 743866013,
        comment: 'Неверная сумма перевода',
      });

      expect(result.status).toBe('rejected');
      expect(result.comment).toBe('Неверная сумма перевода');
    });
  });

  describe('GET /accountant/notifications', () => {
    it('должен возвращать структурированные события счетчиков и системы', async () => {
      const mockMeterEvents = [
        { id: 1, accountId: 1, title: 'Подача счетчиков', status: 'PENDING' },
      ];
      const mockSystemEvents = [
        { id: 2, title: 'Проверка договора', status: 'ACTIVE' },
      ];

      (service.findMeterSubmissionEvents as jest.Mock).mockResolvedValue(mockMeterEvents);
      (service.findSystemEvents as jest.Mock).mockResolvedValue(mockSystemEvents);

      const result = await controller.findNotifications({});

      // Проверяем полную структуру ответа для диагностики и ИИ-агентов
      expect(result).toBeDefined();
      expect(result.meterEvents).toHaveLength(1);
      expect(result.systemEvents).toHaveLength(1);
      expect(result.meterEvents[0].status).toBe('PENDING');
    });
  });
});
