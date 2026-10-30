// ecommerce/backend/src/finance/finance.spec.ts
// Автоматические тесты модуля сводного финансового учета Viasglobal
import { Test, TestingModule } from '@nestjs/testing';
import { FinanceService } from './finance.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Модуль сводного финансового учета Viasglobal (FinanceModule)', () => {
  let financeService: FinanceService;
  const testDataFile = path.resolve(process.cwd(), 'data', 'test-finance-ledger.json');

  const mockPrisma = {
    purchaseOrder: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 101,
          orderNumber: '26ALV-0074072',
          orderDate: new Date('2026-10-26T10:00:00.000Z'),
          status: 'RECEIVED',
          totalGross: 343.8,
          subtotalNetto: 259.4,
          totalEcoTasa: 13.0,
          taxAmount: 71.4,
          paymentStatus: 'PAID',
          distributor: { name: 'Alfa Dyser' },
          documents: [
            {
              id: 1,
              documentType: 'INVOICE',
              fileName: 'Factura_AlfaDyser.pdf',
              filePath: 'attachments/Factura_AlfaDyser.pdf',
              notes: 'Factura 26FA-00123',
            },
            {
              id: 2,
              documentType: 'PAYMENT_RECEIPT',
              fileName: 'sepa_direct_debit.pdf',
              filePath: 'attachments/sepa_direct_debit.pdf',
              notes: 'SEPA Direct Debit',
            },
          ],
          notes: '[TAXFIX: UPLOADED=true, LINKED=true, REF=SEPA-26ALV]',
          items: [],
        },
      ]),
    },
    salesOrder: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 501,
          platform: 'AMAZON',
          orderNumber: '402-1234567-8901234',
          orderDate: new Date('2026-10-28T14:30:00.000Z'),
          status: 'SHIPPED',
          totalAmount: 26.7,
          platformFees: 4.01,
          shippingFee: 4.5,
          netAmount: 18.19,
          items: [
            {
              sku: '34316',
              quantity: 1,
              costPrice: 15.74,
              netProfit: 2.45,
            },
          ],
          documents: [],
        },
      ]),
    },
  };

  const mockOrdersService = {
    computeTaxfixCompliance: jest.fn().mockImplementation((order: any) => {
      return {
        status: 'COMPLETED',
        isCompliant: true,
        hasInvoice: true,
        hasPaymentReceipt: true,
        uploadedToTaxfix: true,
        paymentLinkedInTaxfix: true,
        bankReference: 'SEPA-26ALV',
        pendingActions: [],
        recommendedLegalTask: null,
      };
    }),
  };

  beforeAll(() => {
    process.env.FINANCE_DATA_FILE = testDataFile;
    if (fs.existsSync(testDataFile)) {
      fs.unlinkSync(testDataFile);
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDataFile)) {
      fs.unlinkSync(testDataFile);
    }
    delete process.env.FINANCE_DATA_FILE;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile();

    financeService = module.get<FinanceService>(FinanceService);
  });

  it('должен инициализировать сервис и автоматически генерировать ежемесячный IT-инвойс 4000 € с июля 2026 года', () => {
    const { store, allEntries } = financeService.getMergedLedgerEntries(2026);
    expect(store.eurRubRate).toBe(105);
    expect(store.defaultItMonthlyAmountEur).toBe(4000);

    // Должны присутствовать авто-шаблоны за июль, август, сентябрь, октябрь 2026
    const octItInvoice = allEntries.find(
      (e) => e.segment === 'IT_DEV' && e.period === '2026-10' && e.type === 'INCOME',
    );
    expect(octItInvoice).toBeDefined();
    expect(octItInvoice?.amountGross).toBe(4000);
    expect(octItInvoice?.date).toBe('2026-10-31');
    expect(octItInvoice?.invoiceNumber).toBe('FACT-IT-2026-10');
  });

  it('должен правильно формировать сводный дашборд с доходами и расходами по всем 3 направлениям', async () => {
    // Мокируем метод fetchRentFinancials для изоляции от сети в тестах
    jest.spyOn(financeService, 'fetchRentFinancials').mockResolvedValueOnce({
      available: true,
      sourceUrl: 'http://viasrent-accountant:3005',
      apartmentsCount: 3,
      activeTenantsCount: 3,
      expectedMonthlyRentRub: 120000,
      payments: [
        {
          id: 1,
          amountRub: 45000,
          status: 'confirmed',
          paymentDate: '2026-10-15',
          period: '2026-10',
          tenantName: 'Иван Иванов',
          bankName: 'Т-Банк',
          comment: 'Аренда октябрь',
          receiptPhotoId: 'payments/1/receipts/check.pdf',
        },
      ],
      invoices: [
        {
          id: 10,
          amountRub: 5000,
          invoiceType: 'utility',
          period: '2026-10',
          accountLabel: 'Свет (Iberdrola)',
          available: true,
        },
      ],
    });

    const res = await financeService.getConsolidatedDashboard({ year: 2026, eurRubRate: 100 });
    expect(res.status).toBe('success');
    expect(res.year).toBe(2026);
    expect(res.eurRubRate).toBe(100);

    // Проверяем месяц 2026-10
    const oct = res.months.find((m) => m.period === '2026-10');
    expect(oct).toBeDefined();

    // 1. IT-разработка: доход 4000 €
    expect(oct?.itDev.incomeEur).toBe(4000);

    // 2. E-Commerce: доход от продажи (26.70 €) и закупки (343.80 €) + упаковка
    expect(oct?.ecommerce.salesGrossEur).toBe(26.7);
    expect(oct?.ecommerce.purchasesGrossEur).toBe(343.8);

    // 3. Аренда квартир (РФ): 45 000 руб доход, 5 000 руб ЖКУ расход -> чистыми 40 000 руб
    expect(oct?.rentRu.incomeRub).toBe(45000);
    expect(oct?.rentRu.expensesRub).toBe(5000);
    expect(oct?.rentRu.netRub).toBe(40000);
    // При курсе 100 руб/евро эквивалент = 400 € чистыми
    expect(oct?.rentRu.netEurEquivalent).toBe(400);

    // 4. Сводный годовой итог
    expect(res.annual.itDev.incomeEur).toBeGreaterThanOrEqual(16000); // минимум 4 месяца по 4000 €
  });

  it('должен генерировать печатный документ инвойса Word/PDF и данные для Taxfix', () => {
    const doc = financeService.generateItInvoiceDocument('2026-10');
    expect(doc.entry.period).toBe('2026-10');
    expect(doc.entry.amountGross).toBe(4000);
    expect(doc.htmlDocument).toContain('FACTURA / INVOICE');
    expect(doc.htmlDocument).toContain('ESZ1154366R');
    expect(doc.htmlDocument).toContain('IAE 763 / CNAE 6201');
    expect(doc.taxfixElectronicInvoicePayload.baseImponibleEur).toBe(4000);
    expect(doc.taxfixElectronicInvoicePayload.epigrafeIae).toContain('763');
  });

  it('должен позволять добавлять и обновлять финансовые записи расходов e-commerce (упаковка Embalaje24)', () => {
    const entry = financeService.createLedgerEntry({
      segment: 'ECOMMERCE',
      type: 'EXPENSE',
      category: 'PACKAGING',
      date: '2026-10-29',
      invoiceNumber: 'INV#TEST-123',
      counterpartyName: 'EMBALAJE24, S.L.',
      description: 'Курьерские пакеты 50 шт',
      amountNetto: 10.0,
      vatRate: 21,
    });

    expect(entry.amountNetto).toBe(10);
    expect(entry.vatAmount).toBe(2.1);
    expect(entry.amountGross).toBe(12.1);
    expect(entry.createdInTaxfix).toBe(false);

    // Обновляем статус создания в Taxfix и оплаты
    const updated = financeService.updateLedgerEntry(entry.id, {
      createdInTaxfix: true,
      uploadedToTaxfix: true,
      paymentLinkedInTaxfix: true,
      paymentStatus: 'PAID',
    });

    expect(updated.createdInTaxfix).toBe(true);
    expect(updated.uploadedToTaxfix).toBe(true);
    expect(updated.paymentLinkedInTaxfix).toBe(true);
    expect(updated.paymentStatus).toBe('PAID');
  });
});

