import { Test, TestingModule } from '@nestjs/testing';
import { PrivateLabelsController } from './private-labels.controller';
import { PrivateLabelsService } from './private-labels.service';

describe('PrivateLabelsController (HTTP эндпоинты проверки приватных лейблов)', () => {
  let controller: PrivateLabelsController;
  let service: jest.Mocked<Partial<PrivateLabelsService>>;

  beforeEach(async () => {
    service = {
      checkPrivateLabel: jest.fn(),
      addPrivateLabel: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrivateLabelsController],
      providers: [
        { provide: PrivateLabelsService, useValue: service },
      ],
    }).compile();

    controller = module.get<PrivateLabelsController>(PrivateLabelsController);
  });

  describe('GET /private-labels/check', () => {
    it('должен возвращать статус связки Бренд + Продавец для анализа', async () => {
      (service.checkPrivateLabel as jest.Mock).mockResolvedValue({
        isPrivateLabel: true,
        reason: 'Совпадение названия продавца и владельца торговой марки',
      });

      const response = await controller.check('ANKER', 'A2N8Z7EXAMPLE');

      // Проверяем полную диагностическую структуру
      expect(response).toBeDefined();
      expect(response.brandName).toBe('ANKER');
      expect(response.sellerId).toBe('A2N8Z7EXAMPLE');
      expect(response.isPrivateLabel).toBe(true);
      expect(response.reason).toBeDefined();
    });

    it('должен возвращать isPrivateLabel: false при отсутствии обязательных query-параметров', async () => {
      const response = await controller.check('', '');

      expect(response).toBeDefined();
      expect(response.isPrivateLabel).toBe(false);
    });
  });

  describe('POST /private-labels', () => {
    it('должен регистрировать связку приватного лейбла и возвращать результат', async () => {
      const mockCreated = {
        id: 15,
        brandName: 'ANKER',
        sellerId: 'A2N8Z7EXAMPLE',
        sellerName: 'AnkerDirect EU',
      };
      (service.addPrivateLabel as jest.Mock).mockResolvedValue(mockCreated);

      const response = await controller.add('ANKER', 'A2N8Z7EXAMPLE', 'AnkerDirect EU');

      expect(response).toBeDefined();
      expect(response.id).toBe(15);
      expect(response.brandName).toBe('ANKER');
    });

    it('должен возвращать понятную ошибку при отсутствии обязательных полей', async () => {
      const response = await controller.add('', '');

      expect(response).toBeDefined();
      expect(response.error).toContain('brandName and sellerId are required');
    });
  });
});
