import fs from 'node:fs';
import path from 'node:path';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
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
      resolveSafePath: jest.fn().mockImplementation((key: string) => {
        const cleanKey = path.normalize(key).replace(/^(\.\.[\/\\])+/, '');
        return path.resolve(process.cwd(), 'data', 'uploads', cleanKey);
      }),
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

  describe('Скачивание и выдача локальных файлов (storage/download и invoices/download)', () => {
    let mockRes: any;
    const uploadBaseDir = path.resolve(process.cwd(), 'data', 'uploads');
    const rootTestFile = 'test-invoice-2026.pdf';
    const rootTestFullPath = path.resolve(uploadBaseDir, rootTestFile);

    const subfolderRelPath = path.join('payments', '10', 'receipts', 'test-check-2026.pdf');
    const subfolderFullPath = path.resolve(uploadBaseDir, subfolderRelPath);

    beforeAll(() => {
      // Подготавливаем тестовые директории и файлы на диске
      fs.mkdirSync(uploadBaseDir, { recursive: true });
      fs.mkdirSync(path.dirname(subfolderFullPath), { recursive: true });

      // Создаем файл в корне uploads с валидной сигнатурой PDF
      fs.writeFileSync(rootTestFullPath, Buffer.from('%PDF-1.4\nTest root invoice PDF buffer content'));

      // Создаем файл во вложенной директории с валидной сигнатурой PDF
      fs.writeFileSync(subfolderFullPath, Buffer.from('%PDF-1.4\nTest payment receipt subfolder PDF buffer content'));
    });

    afterAll(() => {
      // Удаляем созданные тестовые файлы и папки
      if (fs.existsSync(rootTestFullPath)) fs.unlinkSync(rootTestFullPath);
      if (fs.existsSync(subfolderFullPath)) fs.unlinkSync(subfolderFullPath);
      try {
        fs.rmdirSync(path.dirname(subfolderFullPath));
        fs.rmdirSync(path.resolve(uploadBaseDir, 'payments', '10'));
        fs.rmdirSync(path.resolve(uploadBaseDir, 'payments'));
      } catch {
        // Игнорируем ошибки очистки директорий
      }
    });

    beforeEach(() => {
      // Создаем мок объекта ответа Express для каждого тест-кейса
      mockRes = {
        setHeader: jest.fn(),
        sendFile: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        redirect: jest.fn(),
      };
    });

    it('должен успешно отдавать существующий файл через GET /accountant/storage/download', async () => {
      // Вызываем эндпоинт скачивания по ключу файла в корне
      await controller.downloadStorageFile(rootTestFile, mockRes);

      // Проверяем корректную установку MIME-типа и имени вложения
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', `inline; filename="${rootTestFile}"`);
      // Проверяем, что res.sendFile вызван с точным абсолютным путем к файлу
      expect(mockRes.sendFile).toHaveBeenCalledWith(rootTestFullPath);
    });

    it('должен успешно отдавать файл из вложенной поддиректории через GET /accountant/storage/download', async () => {
      // Вызываем эндпоинт скачивания по относительному пути к чеку
      await controller.downloadStorageFile(subfolderRelPath, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="test-check-2026.pdf"');
      expect(mockRes.sendFile).toHaveBeenCalledWith(subfolderFullPath);
    });

    it('должен находить файл в подпапке только по имени через рекурсивный fallback в GET /accountant/storage/download', async () => {
      // Передаем только имя файла без указания подпапки
      await controller.downloadStorageFile('test-check-2026.pdf', mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.sendFile).toHaveBeenCalledWith(subfolderFullPath);
    });

    it('должен отклонять запрос на скачивание без параметра key или с плейсхолдерами *** и ... со статусом BadRequestException (400)', async () => {
      // Проверяем пустую строку
      await expect(controller.downloadStorageFile('', mockRes)).rejects.toThrow(BadRequestException);
      // Проверяем строку из пробелов
      await expect(controller.downloadStorageFile('   ', mockRes)).rejects.toThrow(BadRequestException);
      // Проверяем плейсхолдер *** (гарантируем, что статус 400, а не ложный 404)
      await expect(controller.downloadStorageFile('***', mockRes)).rejects.toThrow(BadRequestException);
      // Проверяем плейсхолдер ...
      await expect(controller.downloadStorageFile('...', mockRes)).rejects.toThrow(BadRequestException);
      // Проверяем undefined
      await expect(controller.downloadStorageFile(undefined as any, mockRes)).rejects.toThrow(BadRequestException);
    });

    it('должен возвращать NotFoundException (404), если файл отсутствует на диске, и никогда не выбрасывать 500 TypeError', async () => {
      // Проверяем явный 404 для несуществующего документа
      try {
        await controller.downloadStorageFile('non-existent-file-404.pdf', mockRes);
        fail('Ожидалось исключение NotFoundException');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect((err as NotFoundException).message).toContain('не найден на диске');
      }
    });

    it('должен успешно отдавать файл через одиночный роут GET /accountant/invoices/download/:key', async () => {
      // Вызываем контроллер со строковым параметром одиночного файла
      await controller.downloadInvoiceRaw(rootTestFile, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.sendFile).toHaveBeenCalledWith(rootTestFullPath);
    });

    it('должен возвращать NotFoundException (404) в GET /accountant/invoices/download/:key при отсутствии файла', async () => {
      // Проверяем возврат 404 при отсутствии файла по одиночному ключу
      await expect(controller.downloadInvoiceRaw('absent-invoice.pdf', mockRes)).rejects.toThrow(NotFoundException);
    });

    it('должен отклонять плейсхолдер *** в GET /accountant/invoices/download/:key со статусом BadRequestException (400)', async () => {
      // Проверяем защиту от плейсхолдера
      await expect(controller.downloadInvoiceRaw('***', mockRes)).rejects.toThrow(BadRequestException);
    });

    it('должен корректно обрабатывать массив из одного элемента в wildcard роуте GET /accountant/invoices/download/*path без 500 TypeError', async () => {
      // Express/NestJS передает массив строк для одиночного файла: ['test-invoice-2026.pdf']
      await controller.downloadInvoiceRawWildcard([rootTestFile] as any, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.sendFile).toHaveBeenCalledWith(rootTestFullPath);
    });

    it('должен корректно собирать составной путь из массива сегментов в wildcard роуте GET /accountant/invoices/download/*path', async () => {
      // Express/NestJS передает массив сегментов вложенного пути: ['payments', '10', 'receipts', 'test-check-2026.pdf']
      const pathSegments = ['payments', '10', 'receipts', 'test-check-2026.pdf'];
      await controller.downloadInvoiceRawWildcard(pathSegments as any, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="test-check-2026.pdf"');
      expect(mockRes.sendFile).toHaveBeenCalledWith(subfolderFullPath);
    });

    it('должен возвращать NotFoundException (404) при запросе отсутствующего файла через массив сегментов в wildcard роуте', async () => {
      // Проверяем, что при отсутствии файла возвращается NotFoundException, а не необработанный TypeError 500
      try {
        await controller.downloadInvoiceRawWildcard(['invoices', 'absent-nested-file.pdf'] as any, mockRes);
        fail('Ожидалось исключение NotFoundException');
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(NotFoundException);
        expect((err as NotFoundException).message).toContain('не найден на диске');
      }
    });

    it('должен отклонять плейсхолдеры и пустые элементы массива в wildcard роуте со статусом BadRequestException (400)', async () => {
      // Проверяем массив с плейсхолдером
      await expect(controller.downloadInvoiceRawWildcard(['***'] as any, mockRes)).rejects.toThrow(BadRequestException);
      // Проверяем пустой массив
      await expect(controller.downloadInvoiceRawWildcard([] as any, mockRes)).rejects.toThrow(BadRequestException);
      // Проверяем массив из пустых строк
      await expect(controller.downloadInvoiceRawWildcard(['', '   '] as any, mockRes)).rejects.toThrow(BadRequestException);
    });

    it('должен безопасно нормализовать path-traversal последовательности и предотвращать выход за пределы uploads', async () => {
      // Передаем попытку path-traversal: payments/../../test-invoice-2026.pdf
      await controller.downloadStorageFile('payments/../../test-invoice-2026.pdf', mockRes);

      // Проверяем, что путь безопасно разрешен внутри uploadDir
      expect(mockRes.sendFile).toHaveBeenCalledWith(rootTestFullPath);
    });

    it('должен защищать от перезаписи существующего файла в uploadInvoiceRaw без явного флага overwrite', async () => {
      // Создаем входящий запрос с бинарным содержимым
      const mockReq = { body: Buffer.from('%PDF-1.4\nAttempted overwrite without flag') } as any;

      // Ожидаем исключение ConflictException (409)
      await expect(
        controller.uploadInvoiceRaw(rootTestFile, undefined, mockReq, mockRes)
      ).rejects.toThrow(ConflictException);
    });

    it('должен отклонять плейсхолдер *** в uploadInvoiceRaw со статусом BadRequestException (400)', async () => {
      const mockReq = { body: Buffer.from('%PDF-1.4\nTest') } as any;

      // Ожидаем исключение BadRequestException (400)
      await expect(
        controller.uploadInvoiceRaw('***', undefined, mockReq, mockRes)
      ).rejects.toThrow(BadRequestException);
    });

    it('должен разрешать перезапись существующего файла в uploadInvoiceRaw при передаче overwrite=true', async () => {
      const updatedContent = Buffer.from('%PDF-1.4\nSuccessfully overwritten content');
      const mockReq = { body: updatedContent } as any;

      // Вызываем загрузку с явным флагом overwrite=true
      await controller.uploadInvoiceRaw(rootTestFile, 'true', mockReq, mockRes);

      // Проверяем успешный HTTP статус 200
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, key: rootTestFile }));

      // Проверяем, что файл на диске действительно обновился
      const diskContent = fs.readFileSync(rootTestFullPath);
      expect(diskContent.toString()).toBe('%PDF-1.4\nSuccessfully overwritten content');
    });
  });
});
