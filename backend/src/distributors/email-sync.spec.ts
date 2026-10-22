import { EmailSyncService } from './email-sync.service';
import { ParsedMail } from 'mailparser';

describe('Сервис синхронизации почты и сопоставления с дистрибьюторами (EmailSyncService)', () => {
  let service: EmailSyncService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      distributor: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      distributorContact: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      distributorEmail: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new EmailSyncService(mockPrisma);
  });

  describe('Извлечение доменов (extractDomain)', () => {
    it('корректно извлекает домен из email адреса менеджера (guido@alfadyser.es)', () => {
      const domain = service.extractDomain('guido@alfadyser.es');
      expect(domain).toBe('alfadyser.es');
    });

    it('корректно извлекает домен из URL официального сайта (https://alfadyser.es/es/login)', () => {
      const domain = service.extractDomain('https://alfadyser.es/es/login');
      expect(domain).toBe('alfadyser.es');
    });

    it('корректно отсекает www и протоколы (http://www.kuken.es/)', () => {
      const domain = service.extractDomain('http://www.kuken.es/');
      expect(domain).toBe('kuken.es');
    });

    it('возвращает null для пустых или некорректных значений', () => {
      expect(service.extractDomain(null)).toBeNull();
      expect(service.extractDomain('')).toBeNull();
    });
  });

  describe('Умное сопоставление с дистрибьютором (matchDistributor)', () => {
    const mockDistributor = {
      id: 5,
      name: 'Alfadyser (Kuken)',
      email: 'alfa@alfadyser.es',
      website: 'https://alfadyser.es',
      domains: ['alfadyser.es', 'alfadyser.com'],
    };

    it('сопоставляет по прямому совпадению адреса дистрибьютора (alfa@alfadyser.es)', async () => {
      mockPrisma.distributor.findFirst.mockResolvedValueOnce(mockDistributor);

      const result = await service.matchDistributor('alfa@alfadyser.es');
      expect(result).not.toBeNull();
      expect(result?.distributor.id).toBe(5);
      expect(result?.matchedBy).toBe('distributor_email');
    });

    it('сопоставляет по контакту менеджера в DistributorContact (guido@alfadyser.es)', async () => {
      // Прямого адреса дистрибьютора нет
      mockPrisma.distributor.findFirst.mockResolvedValueOnce(null);
      // Зато есть контакт менеджера Guido
      mockPrisma.distributorContact.findFirst.mockResolvedValueOnce({
        id: 10,
        distributorId: 5,
        name: 'Guido',
        email: 'guido@alfadyser.es',
        distributor: mockDistributor,
      });

      const result = await service.matchDistributor('guido@alfadyser.es');
      expect(result).not.toBeNull();
      expect(result?.distributor.id).toBe(5);
      expect(result?.contact?.name).toBe('Guido');
      expect(result?.matchedBy).toBe('contact_email');
    });

    it('сопоставляет по домену из списка domains фабрики (@alfadyser.es)', async () => {
      mockPrisma.distributor.findFirst
        .mockResolvedValueOnce(null) // по email
        .mockResolvedValueOnce(mockDistributor); // по domains has 'alfadyser.es'
      mockPrisma.distributorContact.findFirst.mockResolvedValueOnce(null);

      const result = await service.matchDistributor('sales-new@alfadyser.es');
      expect(result).not.toBeNull();
      expect(result?.distributor.id).toBe(5);
      expect(result?.matchedBy).toBe('domain_list');
    });
  });

  describe('Обработка и сохранение письма (processAndSaveMail)', () => {
    const mockDistributor = {
      id: 5,
      name: 'Alfadyser (Kuken)',
      email: 'alfa@alfadyser.es',
      website: 'https://alfadyser.es',
      domains: ['alfadyser.es'],
    };

    it('сохраняет новое входящее письмо от менеджера и создает контакт менеджера в БД', async () => {
      // Сопоставление по домену
      mockPrisma.distributor.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(mockDistributor);
      mockPrisma.distributorContact.findFirst.mockResolvedValueOnce(null);
      mockPrisma.distributorContact.create.mockResolvedValueOnce({
        id: 101,
        distributorId: 5,
        name: 'Guido - Alfa Dyser',
        email: 'guido@alfadyser.es',
      });
      mockPrisma.distributorEmail.findUnique.mockResolvedValueOnce(null);
      mockPrisma.distributorEmail.create.mockResolvedValueOnce({ id: 1 });
      mockPrisma.distributor.update.mockResolvedValueOnce(mockDistributor);

      const parsedMock: ParsedMail = {
        messageId: '<test-message-123@alfadyser.es>',
        subject: 'RE: Catálogo Alfa Dyser',
        from: {
          value: [{ address: 'guido@alfadyser.es', name: 'Guido - Alfa Dyser' }],
          text: 'Guido - Alfa Dyser <guido@alfadyser.es>',
          html: '',
        },
        to: {
          value: [{ address: 'info@viasglobal.es', name: 'Viasglobal' }],
          text: 'info@viasglobal.es',
          html: '',
        },
        date: new Date('2026-10-22T14:00:00Z'),
        text: 'Hola Vitalii, el pedido mínimo para portes pagados es de 300 € para la península. Saludos, Guido.',
        attachments: [],
        headers: new Map(),
        headerLines: [],
      } as any;

      const result = await service.processAndSaveMail(parsedMock);

      expect(result.isNew).toBe(true);
      expect(result.distributorId).toBe(5);
      expect(result.distributorName).toBe('Alfadyser (Kuken)');
      expect(result.subject).toBe('RE: Catálogo Alfa Dyser');

      // Проверяем создание контакта
      expect(mockPrisma.distributorContact.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            distributorId: 5,
            name: 'Guido - Alfa Dyser',
            email: 'guido@alfadyser.es',
          }),
        })
      );

      // Проверяем создание записи письма
      expect(mockPrisma.distributorEmail.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            messageId: '<test-message-123@alfadyser.es>',
            distributorId: 5,
            subject: 'RE: Catálogo Alfa Dyser',
            bodyText: expect.stringContaining('el pedido mínimo para portes pagados es de 300 €'),
          }),
        })
      );
    });

    it('обеспечивает идемпотентность и обновляет существующее письмо без дублирования', async () => {
      mockPrisma.distributor.findFirst.mockResolvedValueOnce(mockDistributor);
      mockPrisma.distributorEmail.findUnique.mockResolvedValueOnce({
        id: 777,
        messageId: '<existing-msg-id@alfadyser.es>',
      });
      mockPrisma.distributorEmail.update.mockResolvedValueOnce({ id: 777 });

      const parsedMock: ParsedMail = {
        messageId: '<existing-msg-id@alfadyser.es>',
        subject: 'Re: Catálogo Alfa Dyser',
        from: {
          value: [{ address: 'alfa@alfadyser.es', name: 'Alfa Dyser' }],
          text: 'alfa@alfadyser.es',
          html: '',
        },
        text: 'Condiciones actualizadas.',
        attachments: [],
        headers: new Map(),
        headerLines: [],
      } as any;

      const result = await service.processAndSaveMail(parsedMock);

      expect(result.isNew).toBe(false);
      expect(mockPrisma.distributorEmail.create).not.toHaveBeenCalled();
      expect(mockPrisma.distributorEmail.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { messageId: '<existing-msg-id@alfadyser.es>' },
        })
      );
    });
  });
});
