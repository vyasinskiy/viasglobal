// ecommerce/backend/src/finance/finance.service.ts
// Сервис сводного финансового учета Viasglobal по всем видам деятельности:
// 1. Autónomo IAE 763 / CNAE 6201 (IT-разработка, инвойсы 4000 EUR/мес, фактуры в гос. системе Испании через Taxfix)
// 2. Autónomo IAE 665 / CNAE 4791 (E-Commerce Amazon Wholesale, закупки у дистрибьюторов, продажи, упаковка, софт, взносы)
// 3. Аренда недвижимости (РФ, отдельное юрлицо вне налогового контура Испании, консолидация из accruals-accountant)

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import * as fs from 'fs';
import * as path from 'path';

// Допустимые направления бизнеса в сводном дашборде
export type FinanceSegment = 'IT_DEV' | 'ECOMMERCE' | 'COMMON_AUTONOMO' | 'RENT_RU';

// Допустимые типы финансовых записей
export type FinanceRecordType = 'INCOME' | 'EXPENSE';

// Интерфейс записи в локальном финансовом реестре Autónomo (IT-инвойсы и операционные фактуры расходов)
export interface FinanceLedgerEntry {
  id: string;
  // Направление деятельности:
  // IT_DEV - IAE 763 / CNAE 6201 (Programadores y Analistas de Informática)
  // ECOMMERCE - IAE 665 / CNAE 4791 (Comercio Menor Por Correo o Catálogo)
  // COMMON_AUTONOMO - Общие расходы предпринимателя (Seguridad Social RETA, Gestoría Taxfix, Modelo 130/303)
  segment: 'IT_DEV' | 'ECOMMERCE' | 'COMMON_AUTONOMO';
  // Тип операции: INCOME (приход / выставленный инвойс) или EXPENSE (расход / полученная фактура)
  type: FinanceRecordType;
  // Категория операции (например, IT_MONTHLY_INVOICE, PACKAGING, SOFTWARE_KEEPA, SEGURIDAD_SOCIAL, GESTORIA_TAXFIX, SCRAP_RAP, OTHER)
  category: string;
  // Дата документа / операции в формате YYYY-MM-DD
  date: string;
  // Отчетный период в формате YYYY-MM (например, "2026-10")
  period: string;
  // Номер инвойса или счета-фактуры (например, "IT-2026-10" или "INV#ES127926")
  invoiceNumber: string;
  // Наименование контрагента (клиент по разработке или поставщик услуг/упаковки)
  counterpartyName: string;
  // Налоговый номер контрагента (NIF / CIF / VAT ID)
  counterpartyTaxId?: string;
  // Описание услуги или расхода
  description: string;
  // Налогооблагаемая база без НДС (Base Imponible, EUR)
  amountNetto: number;
  // Ставка НДС (IVA %, например 0% для B2B Intra-EU / Reverse Charge или 21% для Испании)
  vatRate: number;
  // Сумма НДС (IVA, EUR)
  vatAmount: number;
  // Удержание IRPF (если применимо, EUR)
  irpfAmount: number;
  // Итоговая сумма брутто к оплате/получению (Total Factura, EUR)
  amountGross: number;
  // Валюта операции (по умолчанию EUR)
  currency: 'EUR';
  // Статус оплаты: PAID (оплачено) или PENDING (ожидает оплаты)
  paymentStatus: 'PAID' | 'PENDING';
  // Статус формирования Word (.docx) и конвертации в PDF (актуально для IT-инвойсов)
  wordPdfGenerated: boolean;
  // Статус создания официальной электронной фактуры в Taxfix (гос. система Испании Verifactu / AEAT)
  createdInTaxfix: boolean;
  // Статус загрузки PDF фактуры в сервис Taxfix
  uploadedToTaxfix: boolean;
  // Статус линковки фактуры с банковской транзакцией оплаты в Taxfix
  paymentLinkedInTaxfix: boolean;
  // Ссылка на файл фактуры или квитанции
  invoiceFilePath?: string;
  paymentReceiptFilePath?: string;
  // Референс банковской транзакции
  bankReference?: string;
  // Примечания
  notes?: string;
  // Флаг автоматически сгенерированного шаблона (например, ежемесячный IT-инвойс на 4000 €)
  isAutoTemplate?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Структура файла персистентного хранилища финансового реестра
interface FinanceStoreData {
  // Курс конвертации RUB за 1 EUR (по умолчанию 105.0 RUB = 1 EUR)
  eurRubRate: number;
  // Базовая ежемесячная сумма IT-инвойса (по умолчанию 4000 EUR)
  defaultItMonthlyAmountEur: number;
  // Наименование клиента по умолчанию для IT-инвойсов
  defaultItClientName: string;
  defaultItClientVat: string;
  defaultItServiceDescription: string;
  // Список сохраненных записей реестра
  entries: FinanceLedgerEntry[];
}

@Injectable()
export class FinanceService {
  private readonly logger = new Logger(FinanceService.name);
  private readonly dataFilePath: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
  ) {
    // Определяем путь к JSON-хранилищу финансового реестра (позволяет переопределять в тестах через FINANCE_DATA_FILE)
    this.dataFilePath =
      process.env.FINANCE_DATA_FILE ||
      path.resolve(process.cwd(), 'data', 'finance-ledger.json');
  }

  /**
   * Валидация параметров на отсутствие технических плейсхолдеров LLM (Fail-Fast HTTP 400)
   */
  public validateNoPlaceholders(fieldName: string, value: unknown): void {
    if (value === undefined || value === null || value === '') return;
    const str = String(value).trim();
    if (
      str === '***' ||
      str === '...' ||
      str === 'undefined' ||
      str === 'null' ||
      /^<[^>]+>$/.test(str) ||
      /^\[[^\]]+\]$/.test(str)
    ) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: `Параметр "${fieldName}" содержит недопустимый плейсхолдер "${str}"`,
        hint: `Передайте реальное значение параметра "${fieldName}" без маскирования`,
      });
    }
  }

  /**
   * Начальные эталонные записи реестра (включая реальную оплаченную фактуру упаковки Embalaje24 INV#ES127926 от 29.10.2026)
   */
  private getInitialSeedEntries(): FinanceLedgerEntry[] {
    const nowIso = new Date().toISOString();
    return [
      {
        id: 'seed-embalaje24-es127926',
        segment: 'ECOMMERCE',
        type: 'EXPENSE',
        category: 'PACKAGING',
        date: '2026-10-29',
        period: '2026-10',
        invoiceNumber: 'INV#ES127926',
        counterpartyName: 'EMBALAJE24, S.L.',
        counterpartyTaxId: 'ESB26768358',
        description:
          'Закупка курьерских пакетов FBM/FBA: 50 шт 40x50+5 см и 50 шт 23x32+5 см + доставка (#ES127926)',
        amountNetto: 15.55,
        vatRate: 21,
        vatAmount: 3.25,
        irpfAmount: 0,
        amountGross: 18.8,
        currency: 'EUR',
        paymentStatus: 'PAID',
        wordPdfGenerated: true,
        createdInTaxfix: false,
        uploadedToTaxfix: false,
        paymentLinkedInTaxfix: false,
        invoiceFilePath:
          'ecommerce/contractors/embalaje24/invoices/Factura_INV_ES127926_2026-10-29.pdf',
        bankReference: 'Карта / Shopify Payments 18.80 EUR от 29.10.2026',
        notes: 'Оплачено 29.10.2026 (PAGADA). Требуется загрузить в Taxfix и слинковать с выпиской.',
        isAutoTemplate: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      },
    ];
  }

  /**
   * Чтение хранилища финансового реестра с автоматической инициализацией дефолтных настроек
   */
  private readStore(): FinanceStoreData {
    try {
      if (fs.existsSync(this.dataFilePath)) {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<FinanceStoreData>;
        return {
          eurRubRate:
            typeof parsed.eurRubRate === 'number' && parsed.eurRubRate > 0
              ? parsed.eurRubRate
              : 105.0,
          defaultItMonthlyAmountEur:
            typeof parsed.defaultItMonthlyAmountEur === 'number' &&
            parsed.defaultItMonthlyAmountEur > 0
              ? parsed.defaultItMonthlyAmountEur
              : 4000,
          defaultItClientName: parsed.defaultItClientName || 'IT B2B Client (Software Development)',
          defaultItClientVat: parsed.defaultItClientVat || 'EU-B2B-CLIENT',
          defaultItServiceDescription:
            parsed.defaultItServiceDescription ||
            'Software Development & IT Architecture Services (IAE 763 / CNAE 6201)',
          entries: Array.isArray(parsed.entries) ? parsed.entries : this.getInitialSeedEntries(),
        };
      }
    } catch (err) {
      this.logger.warn(`Ошибка чтения файла финансового реестра, используем значения по умолчанию: ${err}`);
    }

    return {
      eurRubRate: 105.0,
      defaultItMonthlyAmountEur: 4000,
      defaultItClientName: 'IT B2B Client (Software Development)',
      defaultItClientVat: 'EU-B2B-CLIENT',
      defaultItServiceDescription:
        'Software Development & IT Architecture Services (IAE 763 / CNAE 6201)',
      entries: this.getInitialSeedEntries(),
    };
  }

  /**
   * Сохранение хранилища финансового реестра на диск
   */
  private writeStore(store: FinanceStoreData): void {
    const dir = path.dirname(this.dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dataFilePath, JSON.stringify(store, null, 2), 'utf-8');
  }

  /**
   * Вычисление последнего календарного дня месяца в формате YYYY-MM-DD
   */
  public getLastDayOfMonth(year: number, monthOneBased: number): string {
    const lastDay = new Date(Date.UTC(year, monthOneBased, 0)).getUTCDate();
    const mm = String(monthOneBased).padStart(2, '0');
    const dd = String(lastDay).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  /**
   * Генерация полных месячных записей по IT-разработке (IAE 763 / CNAE 6201):
   * Согласно правилу предпринимателя, с 01.07.2026 (дата постановки IAE 763 в AEAT)
   * в конце каждого месяца выставляется инвойс на 4000 EUR (в Word -> PDF + электронная фактура в Taxfix).
   * Если за какой-либо месяц (с июля выбранного года по текущий месяц) запись еще не создана вручную,
   * она автоматически формируется как ожидающий/плановый инвойс 4000 EUR.
   */
  public getMergedLedgerEntries(year: number): {
    store: FinanceStoreData;
    allEntries: FinanceLedgerEntry[];
  } {
    const store = this.readStore();
    const entries = [...store.entries];

    // Определяем диапазон месяцев для авто-генерации ежемесячного IT-инвойса 4000 EUR
    // Код деятельности IAE 763 зарегистрирован с 01/07/2026 (в 2026 году с 7-го месяца, в последующих годах с 1-го по 12-й)
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    const startMonth = year === 2026 ? 7 : year > 2026 ? 1 : 13;
    const endMonth = year < currentYear ? 12 : year === currentYear ? currentMonth : 0;

    for (let m = startMonth; m <= endMonth; m++) {
      const period = `${year}-${String(m).padStart(2, '0')}`;
      // Проверяем, есть ли уже сохраненный IT-инвойс (INCOME) за этот месяц
      const hasItInvoiceForMonth = entries.some(
        (e) => e.segment === 'IT_DEV' && e.type === 'INCOME' && e.period === period,
      );

      if (!hasItInvoiceForMonth) {
        const lastDate = this.getLastDayOfMonth(year, m);
        // Для уже завершившихся месяцев считаем инвойс выставленным и оплаченным, для текущего месяца — ожидающим закрытия в конце месяца
        const isPastMonth = year < currentYear || (year === currentYear && m < currentMonth);

        entries.push({
          id: `auto-it-${period}`,
          segment: 'IT_DEV',
          type: 'INCOME',
          category: 'IT_MONTHLY_INVOICE',
          date: lastDate,
          period,
          invoiceNumber: `FACT-IT-${year}-${String(m).padStart(2, '0')}`,
          counterpartyName: store.defaultItClientName,
          counterpartyTaxId: store.defaultItClientVat,
          description: `${store.defaultItServiceDescription} — ${period}`,
          amountNetto: store.defaultItMonthlyAmountEur,
          vatRate: 0,
          vatAmount: 0,
          irpfAmount: 0,
          amountGross: store.defaultItMonthlyAmountEur,
          currency: 'EUR',
          paymentStatus: isPastMonth ? 'PAID' : 'PENDING',
          wordPdfGenerated: isPastMonth,
          createdInTaxfix: isPastMonth,
          uploadedToTaxfix: isPastMonth,
          paymentLinkedInTaxfix: isPastMonth,
          notes: isPastMonth
            ? 'Ежемесячный IT-инвойс (IAE 763 / CNAE 6201): 4 000 € в конце месяца (Word/PDF + электронная фактура в Taxfix)'
            : 'Плановый ежемесячный IT-инвойс 4 000 € в конце месяца: сформировать Word/PDF и выпустить электронную фактуру в Taxfix',
          isAutoTemplate: true,
          createdAt: `${lastDate}T10:00:00.000Z`,
          updatedAt: `${lastDate}T10:00:00.000Z`,
        });
      }
    }

    // Сортируем записи по дате от новых к старым
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return { store, allEntries: entries };
  }

  /**
   * Запрос финансовых данных по аренде квартир (РФ, другое юрлицо) из микросервиса accruals-accountant
   */
  public async fetchRentFinancials(): Promise<{
    available: boolean;
    sourceUrl: string;
    error?: string;
    apartmentsCount: number;
    activeTenantsCount: number;
    expectedMonthlyRentRub: number;
    payments: Array<{
      id: number;
      amountRub: number;
      status: string;
      paymentDate: string;
      period: string;
      tenantName: string;
      bankName: string | null;
      comment: string | null;
      receiptPhotoId: string | null;
    }>;
    invoices: Array<{
      id: number;
      amountRub: number;
      invoiceType: string;
      period: string;
      accountLabel: string;
      available: boolean;
    }>;
  }> {
    const baseUrl = (
      process.env.ACCOUNTANT_API_URL || 'http://accruals-accountant:3005'
    ).replace(/\/+$/, '');

    try {
      // Выполняем параллельные запросы к микросервису accountant с коротким таймаутом (3.5 сек)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const [paymentsRes, invoicesRes, tenantsRes, apartmentsRes] = await Promise.all([
        fetch(`${baseUrl}/accountant/payments`, { signal: controller.signal }),
        fetch(`${baseUrl}/accountant/invoices`, { signal: controller.signal }),
        fetch(`${baseUrl}/accountant/tenants`, { signal: controller.signal }),
        fetch(`${baseUrl}/accountant/apartments`, { signal: controller.signal }),
      ]);
      clearTimeout(timeoutId);

      const paymentsRaw = paymentsRes.ok ? ((await paymentsRes.json()) as any[]) : [];
      const invoicesRaw = invoicesRes.ok ? ((await invoicesRes.json()) as any[]) : [];
      const tenantsRaw = tenantsRes.ok ? ((await tenantsRes.json()) as any[]) : [];
      const apartmentsRaw = apartmentsRes.ok ? ((await apartmentsRes.json()) as any[]) : [];

      // Нормализуем платежи арендаторов (приходы в рублях)
      const payments = (Array.isArray(paymentsRaw) ? paymentsRaw : []).map((p: any) => {
        const rawDate = p.paymentDate || p.createdAt || new Date().toISOString();
        const isoDate = new Date(rawDate).toISOString();
        const period = isoDate.slice(0, 7);
        return {
          id: Number(p.id),
          amountRub: Number(p.amount) || 0,
          status: String(p.status || 'unconfirmed').toLowerCase(),
          paymentDate: isoDate.slice(0, 10),
          period,
          tenantName: p.user?.name || p.tenantName || `Арендатор #${p.userId || p.id}`,
          bankName: p.bank?.name || null,
          comment: p.comment || null,
          receiptPhotoId: p.receiptPhotoId || null,
        };
      });

      // Нормализуем коммунальные квитанции / начисления ЖКУ (расходы в рублях)
      const invoices = (Array.isArray(invoicesRaw) ? invoicesRaw : []).map((inv: any) => {
        // Приводим periodLabel / periodId (например "202609" или "2026-09") к формату "YYYY-MM"
        const rawPeriod = String(inv.periodLabel || inv.periodId || '');
        let normalizedPeriod = rawPeriod;
        if (/^\d{6}$/.test(rawPeriod)) {
          normalizedPeriod = `${rawPeriod.slice(0, 4)}-${rawPeriod.slice(4, 6)}`;
        } else if (!/^\d{4}-\d{2}$/.test(rawPeriod)) {
          const fallbackDate = inv.firstSeenAt ? new Date(inv.firstSeenAt).toISOString() : new Date().toISOString();
          normalizedPeriod = fallbackDate.slice(0, 7);
        }

        return {
          id: Number(inv.id),
          amountRub: Number(inv.amount) || 0,
          invoiceType: String(inv.invoiceType || 'utility'),
          period: normalizedPeriod,
          accountLabel:
            inv.account?.customLabel ||
            inv.account?.accountLabel ||
            inv.account?.accountNumber ||
            `Счет #${inv.accountId || inv.id}`,
          available: Boolean(inv.available),
        };
      });

      // Считаем активных арендаторов и плановую месячную ставку аренды
      const activeTenants = (Array.isArray(tenantsRaw) ? tenantsRaw : []).filter(
        (t: any) => String(t.status || '').toUpperCase() === 'ACTIVE' || Number(t.rentAmount) > 0,
      );
      const expectedMonthlyRentRub = activeTenants.reduce(
        (sum: number, t: any) => sum + (Number(t.rentAmount) || 0),
        0,
      );

      return {
        available: true,
        sourceUrl: baseUrl,
        apartmentsCount: Array.isArray(apartmentsRaw) ? apartmentsRaw.length : 0,
        activeTenantsCount: activeTenants.length,
        expectedMonthlyRentRub,
        payments,
        invoices,
      };
    } catch (err: any) {
      return {
        available: false,
        sourceUrl: baseUrl,
        error: err?.message || 'Сервис accruals-accountant недоступен по сети',
        apartmentsCount: 0,
        activeTenantsCount: 0,
        expectedMonthlyRentRub: 0,
        payments: [],
        invoices: [],
      };
    }
  }

  /**
   * Главный метод сводного дашборда: агрегирует доходы, расходы, налоги и чистую прибыль
   * по месяцам и за весь год по всем 3 направлениям деятельности:
   * 1) IT-разработка (Autónomo IAE 763 / CNAE 6201)
   * 2) Продажа товаров на Amazon (Autónomo IAE 665 / CNAE 4791)
   * 3) Аренда квартир (Другое юрлицо в РФ, не подлежит учету в Испании)
   */
  public async getConsolidatedDashboard(params?: {
    year?: number;
    eurRubRate?: number;
  }) {
    const targetYear = params?.year && !isNaN(Number(params.year)) ? Number(params.year) : new Date().getUTCFullYear();
    const { store, allEntries } = this.getMergedLedgerEntries(targetYear);
    const eurRubRate =
      params?.eurRubRate && Number(params.eurRubRate) > 0
        ? Number(params.eurRubRate)
        : store.eurRubRate;

    // 1. Загружаем все закупки товаров (PurchaseOrder) и продажи маркетплейсов (SalesOrder) из БД viasglobal_db
    const [purchaseOrders, salesOrders, rentData] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where: {
          status: { not: 'CANCELLED' },
        },
        include: {
          distributor: true,
          items: true,
          documents: true,
        },
        orderBy: { orderDate: 'desc' },
      }),
      this.prisma.salesOrder.findMany({
        where: {
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
        include: {
          items: true,
          documents: true,
        },
        orderBy: { orderDate: 'desc' },
      }),
      this.fetchRentFinancials(),
    ]);

    // 2. Обогащаем заказы поставщикам статусом налогового комплаенса Taxfix
    const ordersWithTaxfix = purchaseOrders.map((po) => ({
      ...po,
      period: new Date(po.orderDate).toISOString().slice(0, 7),
      taxfixCompliance: this.ordersService.computeTaxfixCompliance(po),
    }));

    // 3. Формируем помесячную разбивку (12 месяцев выбранного года: YYYY-01 .. YYYY-12)
    const months = Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      const period = `${targetYear}-${String(m).padStart(2, '0')}`;

      // --- 3.1. Направление 1: IT-разработка (IAE 763 / CNAE 6201, Испания) ---
      const itEntries = allEntries.filter(
        (e) => e.segment === 'IT_DEV' && e.period === period,
      );
      const itIncomeEur = this.round2(
        itEntries
          .filter((e) => e.type === 'INCOME')
          .reduce((s, e) => s + e.amountGross, 0),
      );
      const itExpensesEur = this.round2(
        itEntries
          .filter((e) => e.type === 'EXPENSE')
          .reduce((s, e) => s + e.amountGross, 0),
      );
      const itNetEur = this.round2(itIncomeEur - itExpensesEur);

      // --- 3.2. Направление 2: E-Commerce Amazon (IAE 665 / CNAE 4791, Испания) ---
      // Закупки товаров у дистрибьюторов за этот месяц (PurchaseOrder)
      const monthOrders = ordersWithTaxfix.filter((po) => po.period === period);
      const ecomPurchasesGrossEur = this.round2(
        monthOrders.reduce((s, po) => s + (Number(po.totalGross) || 0), 0),
      );
      const ecomPurchasesNettoEur = this.round2(
        monthOrders.reduce((s, po) => s + (Number(po.subtotalNetto) || 0), 0),
      );
      const ecomPurchasesEcoTasaEur = this.round2(
        monthOrders.reduce((s, po) => s + (Number(po.totalEcoTasa) || 0), 0),
      );
      const ecomPurchasesTaxesEur = this.round2(
        monthOrders.reduce((s, po) => s + (Number(po.taxAmount) || 0), 0),
      );

      // Продажи на Amazon за этот месяц (SalesOrder)
      const monthSales = salesOrders.filter(
        (so) => new Date(so.orderDate).toISOString().slice(0, 7) === period,
      );
      const ecomSalesGrossEur = this.round2(
        monthSales.reduce((s, so) => s + (Number(so.totalAmount) || 0), 0),
      );
      const ecomPlatformFeesEur = this.round2(
        monthSales.reduce((s, so) => s + (Number(so.platformFees) || 0), 0),
      );
      const ecomShippingFeesEur = this.round2(
        monthSales.reduce((s, so) => s + (Number(so.shippingFee) || 0), 0),
      );
      const ecomSalesNetPayoutEur = this.round2(
        monthSales.reduce((s, so) => s + (Number(so.netAmount) || 0), 0),
      );
      // Себестоимость проданных единиц по партиям FIFO
      const ecomSoldCogsEur = this.round2(
        monthSales.reduce(
          (s, so) =>
            s +
            so.items.reduce(
              (is, item) => is + (Number(item.costPrice) || 0) * (Number(item.quantity) || 1),
              0,
            ),
          0,
        ),
      );

      // Прочие операционные фактуры E-Commerce из реестра (упаковка Embalaje24, софт, взносы RAP/SCRAP)
      const ecomExtraEntries = allEntries.filter(
        (e) => e.segment === 'ECOMMERCE' && e.period === period,
      );
      const ecomExtraIncomeEur = this.round2(
        ecomExtraEntries
          .filter((e) => e.type === 'INCOME')
          .reduce((s, e) => s + e.amountGross, 0),
      );
      const ecomExtraExpensesEur = this.round2(
        ecomExtraEntries
          .filter((e) => e.type === 'EXPENSE')
          .reduce((s, e) => s + e.amountGross, 0),
      );

      const ecomTotalIncomeEur = this.round2(ecomSalesGrossEur + ecomExtraIncomeEur);
      // Денежный расход e-commerce за месяц (закупки партий + комиссии площадки + доставка + прочие фактуры упаковки/сервисов)
      const ecomTotalExpensesCashflowEur = this.round2(
        ecomPurchasesGrossEur + ecomPlatformFeesEur + ecomShippingFeesEur + ecomExtraExpensesEur,
      );
      const ecomNetCashflowEur = this.round2(ecomTotalIncomeEur - ecomTotalExpensesCashflowEur);
      // Операционная прибыль по методу начисления (FIFO маржа с проданных товаров минус доп. расходы)
      const ecomNetAccrualProfitEur = this.round2(
        ecomTotalIncomeEur -
          ecomSoldCogsEur -
          ecomPlatformFeesEur -
          ecomShippingFeesEur -
          ecomExtraExpensesEur,
      );

      // --- 3.3. Общие расходы Autónomo (Seguridad Social RETA, Taxfix и т.д.) ---
      const commonEntries = allEntries.filter(
        (e) => e.segment === 'COMMON_AUTONOMO' && e.period === period,
      );
      const commonExpensesEur = this.round2(
        commonEntries
          .filter((e) => e.type === 'EXPENSE')
          .reduce((s, e) => s + e.amountGross, 0),
      );

      // Итого по Испании (Autónomo: IAE 763 + IAE 665)
      const spainTotalIncomeEur = this.round2(itIncomeEur + ecomTotalIncomeEur);
      const spainTotalExpensesEur = this.round2(
        itExpensesEur + ecomTotalExpensesCashflowEur + commonExpensesEur,
      );
      const spainNetCashflowEur = this.round2(spainTotalIncomeEur - spainTotalExpensesEur);

      // --- 3.4. Направление 3: Аренда квартир (РФ, другое юрлицо вне учета Испании) ---
      const monthRentPayments = rentData.payments.filter(
        (p) => p.period === period && p.status !== 'rejected',
      );
      const monthRentConfirmedRub = this.round2(
        monthRentPayments
          .filter((p) => p.status === 'confirmed')
          .reduce((s, p) => s + p.amountRub, 0),
      );
      const monthRentPendingRub = this.round2(
        monthRentPayments
          .filter((p) => p.status !== 'confirmed')
          .reduce((s, p) => s + p.amountRub, 0),
      );
      const rentIncomeRub = this.round2(monthRentConfirmedRub + monthRentPendingRub);

      // Расходы по коммунальным квитанциям (utility) за этот период
      const monthRentUtilities = rentData.invoices.filter(
        (inv) => inv.period === period && inv.invoiceType === 'utility',
      );
      const rentExpensesRub = this.round2(
        monthRentUtilities.reduce((s, inv) => s + inv.amountRub, 0),
      );
      const rentNetRub = this.round2(rentIncomeRub - rentExpensesRub);

      // Пересчет аренды в EUR по справочному курсу для глобального Cashflow
      const rentIncomeEur = this.round2(rentIncomeRub / eurRubRate);
      const rentExpensesEur = this.round2(rentExpensesRub / eurRubRate);
      const rentNetEur = this.round2(rentNetRub / eurRubRate);

      // --- 3.5. Глобальный сводный итог по всем 3 проектам в EUR ---
      const globalTotalIncomeEur = this.round2(spainTotalIncomeEur + rentIncomeEur);
      const globalTotalExpensesEur = this.round2(spainTotalExpensesEur + rentExpensesEur);
      const globalNetCashflowEur = this.round2(globalTotalIncomeEur - globalTotalExpensesEur);

      return {
        month: m,
        period,
        itDev: {
          incomeEur: itIncomeEur,
          expensesEur: itExpensesEur,
          netEur: itNetEur,
          invoicesCount: itEntries.filter((e) => e.type === 'INCOME').length,
        },
        ecommerce: {
          salesGrossEur: ecomSalesGrossEur,
          extraIncomeEur: ecomExtraIncomeEur,
          totalIncomeEur: ecomTotalIncomeEur,
          purchasesGrossEur: ecomPurchasesGrossEur,
          purchasesNettoEur: ecomPurchasesNettoEur,
          purchasesEcoTasaEur: ecomPurchasesEcoTasaEur,
          purchasesTaxesEur: ecomPurchasesTaxesEur,
          platformFeesEur: ecomPlatformFeesEur,
          shippingFeesEur: ecomShippingFeesEur,
          extraExpensesEur: ecomExtraExpensesEur,
          totalExpensesCashflowEur: ecomTotalExpensesCashflowEur,
          soldCogsEur: ecomSoldCogsEur,
          netCashflowEur: ecomNetCashflowEur,
          netAccrualProfitEur: ecomNetAccrualProfitEur,
          purchaseOrdersCount: monthOrders.length,
          salesOrdersCount: monthSales.length,
        },
        commonAutonomo: {
          expensesEur: commonExpensesEur,
        },
        spainAutonomoTotal: {
          incomeEur: spainTotalIncomeEur,
          expensesEur: spainTotalExpensesEur,
          netCashflowEur: spainNetCashflowEur,
        },
        rentRu: {
          incomeRub: rentIncomeRub,
          confirmedIncomeRub: monthRentConfirmedRub,
          pendingIncomeRub: monthRentPendingRub,
          expensesRub: rentExpensesRub,
          netRub: rentNetRub,
          incomeEurEquivalent: rentIncomeEur,
          expensesEurEquivalent: rentExpensesEur,
          netEurEquivalent: rentNetEur,
          paymentsCount: monthRentPayments.length,
          utilityInvoicesCount: monthRentUtilities.length,
        },
        globalConsolidated: {
          incomeEur: globalTotalIncomeEur,
          expensesEur: globalTotalExpensesEur,
          netCashflowEur: globalNetCashflowEur,
        },
      };
    });

    // 4. Считаем годовые итоги (Annual Summary) по выбранному году
    const annual = months.reduce(
      (acc, m) => {
        acc.itDev.incomeEur = this.round2(acc.itDev.incomeEur + m.itDev.incomeEur);
        acc.itDev.expensesEur = this.round2(acc.itDev.expensesEur + m.itDev.expensesEur);
        acc.itDev.netEur = this.round2(acc.itDev.netEur + m.itDev.netEur);
        acc.itDev.invoicesCount += m.itDev.invoicesCount;

        acc.ecommerce.salesGrossEur = this.round2(
          acc.ecommerce.salesGrossEur + m.ecommerce.salesGrossEur,
        );
        acc.ecommerce.totalIncomeEur = this.round2(
          acc.ecommerce.totalIncomeEur + m.ecommerce.totalIncomeEur,
        );
        acc.ecommerce.purchasesGrossEur = this.round2(
          acc.ecommerce.purchasesGrossEur + m.ecommerce.purchasesGrossEur,
        );
        acc.ecommerce.purchasesNettoEur = this.round2(
          acc.ecommerce.purchasesNettoEur + m.ecommerce.purchasesNettoEur,
        );
        acc.ecommerce.purchasesEcoTasaEur = this.round2(
          acc.ecommerce.purchasesEcoTasaEur + m.ecommerce.purchasesEcoTasaEur,
        );
        acc.ecommerce.purchasesTaxesEur = this.round2(
          acc.ecommerce.purchasesTaxesEur + m.ecommerce.purchasesTaxesEur,
        );
        acc.ecommerce.platformFeesEur = this.round2(
          acc.ecommerce.platformFeesEur + m.ecommerce.platformFeesEur,
        );
        acc.ecommerce.shippingFeesEur = this.round2(
          acc.ecommerce.shippingFeesEur + m.ecommerce.shippingFeesEur,
        );
        acc.ecommerce.extraExpensesEur = this.round2(
          acc.ecommerce.extraExpensesEur + m.ecommerce.extraExpensesEur,
        );
        acc.ecommerce.totalExpensesCashflowEur = this.round2(
          acc.ecommerce.totalExpensesCashflowEur + m.ecommerce.totalExpensesCashflowEur,
        );
        acc.ecommerce.soldCogsEur = this.round2(
          acc.ecommerce.soldCogsEur + m.ecommerce.soldCogsEur,
        );
        acc.ecommerce.netCashflowEur = this.round2(
          acc.ecommerce.netCashflowEur + m.ecommerce.netCashflowEur,
        );
        acc.ecommerce.netAccrualProfitEur = this.round2(
          acc.ecommerce.netAccrualProfitEur + m.ecommerce.netAccrualProfitEur,
        );
        acc.ecommerce.purchaseOrdersCount += m.ecommerce.purchaseOrdersCount;
        acc.ecommerce.salesOrdersCount += m.ecommerce.salesOrdersCount;

        acc.commonAutonomo.expensesEur = this.round2(
          acc.commonAutonomo.expensesEur + m.commonAutonomo.expensesEur,
        );

        acc.spainAutonomoTotal.incomeEur = this.round2(
          acc.spainAutonomoTotal.incomeEur + m.spainAutonomoTotal.incomeEur,
        );
        acc.spainAutonomoTotal.expensesEur = this.round2(
          acc.spainAutonomoTotal.expensesEur + m.spainAutonomoTotal.expensesEur,
        );
        acc.spainAutonomoTotal.netCashflowEur = this.round2(
          acc.spainAutonomoTotal.netCashflowEur + m.spainAutonomoTotal.netCashflowEur,
        );

        acc.rentRu.incomeRub = this.round2(acc.rentRu.incomeRub + m.rentRu.incomeRub);
        acc.rentRu.confirmedIncomeRub = this.round2(
          acc.rentRu.confirmedIncomeRub + m.rentRu.confirmedIncomeRub,
        );
        acc.rentRu.pendingIncomeRub = this.round2(
          acc.rentRu.pendingIncomeRub + m.rentRu.pendingIncomeRub,
        );
        acc.rentRu.expensesRub = this.round2(acc.rentRu.expensesRub + m.rentRu.expensesRub);
        acc.rentRu.netRub = this.round2(acc.rentRu.netRub + m.rentRu.netRub);
        acc.rentRu.incomeEurEquivalent = this.round2(
          acc.rentRu.incomeEurEquivalent + m.rentRu.incomeEurEquivalent,
        );
        acc.rentRu.expensesEurEquivalent = this.round2(
          acc.rentRu.expensesEurEquivalent + m.rentRu.expensesEurEquivalent,
        );
        acc.rentRu.netEurEquivalent = this.round2(
          acc.rentRu.netEurEquivalent + m.rentRu.netEurEquivalent,
        );
        acc.rentRu.paymentsCount += m.rentRu.paymentsCount;
        acc.rentRu.utilityInvoicesCount += m.rentRu.utilityInvoicesCount;

        acc.globalConsolidated.incomeEur = this.round2(
          acc.globalConsolidated.incomeEur + m.globalConsolidated.incomeEur,
        );
        acc.globalConsolidated.expensesEur = this.round2(
          acc.globalConsolidated.expensesEur + m.globalConsolidated.expensesEur,
        );
        acc.globalConsolidated.netCashflowEur = this.round2(
          acc.globalConsolidated.netCashflowEur + m.globalConsolidated.netCashflowEur,
        );

        return acc;
      },
      {
        itDev: { incomeEur: 0, expensesEur: 0, netEur: 0, invoicesCount: 0 },
        ecommerce: {
          salesGrossEur: 0,
          totalIncomeEur: 0,
          purchasesGrossEur: 0,
          purchasesNettoEur: 0,
          purchasesEcoTasaEur: 0,
          purchasesTaxesEur: 0,
          platformFeesEur: 0,
          shippingFeesEur: 0,
          extraExpensesEur: 0,
          totalExpensesCashflowEur: 0,
          soldCogsEur: 0,
          netCashflowEur: 0,
          netAccrualProfitEur: 0,
          purchaseOrdersCount: 0,
          salesOrdersCount: 0,
        },
        commonAutonomo: { expensesEur: 0 },
        spainAutonomoTotal: { incomeEur: 0, expensesEur: 0, netCashflowEur: 0 },
        rentRu: {
          incomeRub: 0,
          confirmedIncomeRub: 0,
          pendingIncomeRub: 0,
          expensesRub: 0,
          netRub: 0,
          incomeEurEquivalent: 0,
          expensesEurEquivalent: 0,
          netEurEquivalent: 0,
          paymentsCount: 0,
          utilityInvoicesCount: 0,
        },
        globalConsolidated: { incomeEur: 0, expensesEur: 0, netCashflowEur: 0 },
      },
    );

    // 5. Сводка комплаенса Taxfix по всем документам Испании (заказы закупки + записи реестра)
    const yearEntries = allEntries.filter((e) => e.period.startsWith(`${targetYear}-`));
    const pendingTaxfixEntries = yearEntries.filter(
      (e) => !e.createdInTaxfix || !e.uploadedToTaxfix || !e.paymentLinkedInTaxfix,
    );
    const pendingTaxfixOrders = ordersWithTaxfix.filter(
      (po) => po.period.startsWith(`${targetYear}-`) && !po.taxfixCompliance.isCompliant,
    );

    return {
      status: 'success',
      year: targetYear,
      eurRubRate,
      taxpayerProfile: {
        name: 'Vitalii Iasinskii',
        nif: 'ESZ1154366R',
        address: 'Ronda Albocacer 11, 12166 Els Ibarsos (Castellón), España',
        gestoria: 'Taxfix (Jorge Dorado Rubio)',
        rppEnvasesNumber: 'ENV/2026/000121685',
        activities: [
          {
            code: 'IAE 763 / CNAE 6201',
            title: 'Programadores y Analistas de Informática (IT-разработка)',
            startDate: '2026-07-01',
            taxRegime: 'Régimen General / ROI VIES Intra-EU (0% VAT) / IRPF Estimación Directa',
            monthlyInvoiceRule:
              '4 000 € в конце каждого месяца: генерация инвойса Word/PDF + обязательный выпуск электронной фактуры в Taxfix (гос. система Испании)',
          },
          {
            code: 'IAE 665 / CNAE 4791',
            title: 'Comercio Menor Por Correo o Catálogo (Amazon Wholesale & E-Commerce)',
            startDate: '2026-09-21',
            taxRegime: 'Régimen Especial Recargo de Equivalencia (21% IVA + 5.2% RE = 1.262)',
            monthlyInvoiceRule:
              'Закупки партий у дистрибьюторов, продажи Amazon, фактуры упаковки (Embalaje24) и сервисов с обязательной загрузкой и линковкой оплат в Taxfix',
          },
          {
            code: 'RENT_RU (Отдельное юрлицо)',
            title: 'Аренда жилой недвижимости (РФ)',
            startDate: '2024-01-01',
            taxRegime: 'Отдельное юридическое лицо за пределами Испании (не входит в декларации AEAT Autónomo)',
            monthlyInvoiceRule:
              'Приходы арендной платы от жильцов и расходы по квитанциям ЖКУ (микросервис accruals-accountant)',
          },
        ],
      },
      annual,
      months,
      ledgerEntries: yearEntries,
      ecommerceOrders: ordersWithTaxfix.filter((po) => po.period.startsWith(`${targetYear}-`)),
      ecommerceSales: salesOrders.filter((so) =>
        new Date(so.orderDate).toISOString().startsWith(`${targetYear}-`),
      ),
      rentService: {
        available: rentData.available,
        sourceUrl: rentData.sourceUrl,
        error: rentData.error,
        apartmentsCount: rentData.apartmentsCount,
        activeTenantsCount: rentData.activeTenantsCount,
        expectedMonthlyRentRub: rentData.expectedMonthlyRentRub,
        recentPayments: rentData.payments.slice(0, 20),
        recentUtilityInvoices: rentData.invoices.slice(0, 20),
      },
      taxfixComplianceSummary: {
        pendingLedgerEntriesCount: pendingTaxfixEntries.length,
        pendingPurchaseOrdersCount: pendingTaxfixOrders.length,
        totalPendingCount: pendingTaxfixEntries.length + pendingTaxfixOrders.length,
        pendingLedgerEntries: pendingTaxfixEntries,
        pendingPurchaseOrders: pendingTaxfixOrders.map((po) => ({
          orderId: po.id,
          orderNumber: po.orderNumber,
          orderDate: po.orderDate,
          supplierName: po.distributor?.name || 'Поставщик',
          totalGross: po.totalGross,
          taxfixCompliance: po.taxfixCompliance,
        })),
      },
    };
  }

  /**
   * Добавление новой записи в финансовый реестр Autónomo (IT-инвойс или операционная фактура расхода)
   */
  public createLedgerEntry(body: {
    segment: 'IT_DEV' | 'ECOMMERCE' | 'COMMON_AUTONOMO';
    type: FinanceRecordType;
    category?: string;
    date: string;
    invoiceNumber: string;
    counterpartyName: string;
    counterpartyTaxId?: string;
    description: string;
    amountNetto: number;
    vatRate?: number;
    irpfAmount?: number;
    amountGross?: number;
    paymentStatus?: 'PAID' | 'PENDING';
    wordPdfGenerated?: boolean;
    createdInTaxfix?: boolean;
    uploadedToTaxfix?: boolean;
    paymentLinkedInTaxfix?: boolean;
    invoiceFilePath?: string;
    paymentReceiptFilePath?: string;
    bankReference?: string;
    notes?: string;
  }): FinanceLedgerEntry {
    this.validateNoPlaceholders('segment', body?.segment);
    this.validateNoPlaceholders('type', body?.type);
    this.validateNoPlaceholders('date', body?.date);
    this.validateNoPlaceholders('invoiceNumber', body?.invoiceNumber);
    this.validateNoPlaceholders('counterpartyName', body?.counterpartyName);
    this.validateNoPlaceholders('description', body?.description);

    if (!body?.segment || !['IT_DEV', 'ECOMMERCE', 'COMMON_AUTONOMO'].includes(body.segment)) {
      throw new BadRequestException(
        'Поле segment обязательно и должно быть одним из: IT_DEV, ECOMMERCE, COMMON_AUTONOMO',
      );
    }
    if (!body?.type || !['INCOME', 'EXPENSE'].includes(body.type)) {
      throw new BadRequestException('Поле type обязательно и должно быть INCOME или EXPENSE');
    }
    if (!body?.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date.trim())) {
      throw new BadRequestException('Поле date обязательно и должно быть в формате YYYY-MM-DD');
    }
    if (!body?.invoiceNumber || !body.invoiceNumber.trim()) {
      throw new BadRequestException('Поле invoiceNumber (номер инвойса/фактуры) обязательно');
    }
    if (!body?.counterpartyName || !body.counterpartyName.trim()) {
      throw new BadRequestException('Поле counterpartyName (наименование контрагента) обязательно');
    }

    const amountNetto = Number(body.amountNetto);
    if (isNaN(amountNetto) || amountNetto < 0) {
      throw new BadRequestException('Поле amountNetto должно быть неотрицательным числом');
    }

    const vatRate = body.vatRate !== undefined ? Number(body.vatRate) : 0;
    const irpfAmount = body.irpfAmount !== undefined ? Number(body.irpfAmount) : 0;
    const vatAmount = this.round2((amountNetto * vatRate) / 100);
    const computedGross = this.round2(amountNetto + vatAmount - irpfAmount);
    const amountGross =
      body.amountGross !== undefined && !isNaN(Number(body.amountGross))
        ? this.round2(Number(body.amountGross))
        : computedGross;

    const store = this.readStore();
    const nowIso = new Date().toISOString();
    const period = body.date.trim().slice(0, 7);

    const newEntry: FinanceLedgerEntry = {
      id: `fin-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      segment: body.segment,
      type: body.type,
      category: body.category?.trim() || (body.segment === 'IT_DEV' ? 'IT_MONTHLY_INVOICE' : 'OTHER'),
      date: body.date.trim(),
      period,
      invoiceNumber: body.invoiceNumber.trim(),
      counterpartyName: body.counterpartyName.trim(),
      counterpartyTaxId: body.counterpartyTaxId?.trim(),
      description: body.description?.trim() || '',
      amountNetto: this.round2(amountNetto),
      vatRate,
      vatAmount,
      irpfAmount: this.round2(irpfAmount),
      amountGross,
      currency: 'EUR',
      paymentStatus: body.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
      wordPdfGenerated: Boolean(body.wordPdfGenerated),
      createdInTaxfix: Boolean(body.createdInTaxfix),
      uploadedToTaxfix: Boolean(body.uploadedToTaxfix),
      paymentLinkedInTaxfix: Boolean(body.paymentLinkedInTaxfix),
      invoiceFilePath: body.invoiceFilePath?.trim(),
      paymentReceiptFilePath: body.paymentReceiptFilePath?.trim(),
      bankReference: body.bankReference?.trim(),
      notes: body.notes?.trim(),
      isAutoTemplate: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    store.entries.push(newEntry);
    this.writeStore(store);
    return newEntry;
  }

  /**
   * Обновление существующей записи или материализация авто-шаблона IT-инвойса (например, отметка о выпуске в Taxfix и генерации Word/PDF)
   */
  public updateLedgerEntry(
    id: string,
    patch: Partial<{
      date: string;
      invoiceNumber: string;
      counterpartyName: string;
      counterpartyTaxId: string;
      description: string;
      amountNetto: number;
      vatRate: number;
      irpfAmount: number;
      amountGross: number;
      paymentStatus: 'PAID' | 'PENDING';
      wordPdfGenerated: boolean;
      createdInTaxfix: boolean;
      uploadedToTaxfix: boolean;
      paymentLinkedInTaxfix: boolean;
      invoiceFilePath: string;
      paymentReceiptFilePath: string;
      bankReference: string;
      notes: string;
    }>,
  ): FinanceLedgerEntry {
    this.validateNoPlaceholders('id', id);
    const store = this.readStore();
    let idx = store.entries.findIndex((e) => e.id === id);

    // Если редактируется авто-сгенерированный шаблон IT-инвойса (auto-it-YYYY-MM), материализуем его в хранилище
    if (idx === -1 && id.startsWith('auto-it-')) {
      const period = id.replace('auto-it-', '');
      const year = Number(period.slice(0, 4)) || new Date().getUTCFullYear();
      const { allEntries } = this.getMergedLedgerEntries(year);
      const template = allEntries.find((e) => e.id === id);
      if (template) {
        const materialized: FinanceLedgerEntry = {
          ...template,
          isAutoTemplate: false,
          updatedAt: new Date().toISOString(),
        };
        store.entries.push(materialized);
        idx = store.entries.length - 1;
      }
    }

    if (idx === -1) {
      throw new NotFoundException(`Финансовая запись с ID "${id}" не найдена`);
    }

    const current = store.entries[idx];
    const nextNetto =
      patch.amountNetto !== undefined ? this.round2(Number(patch.amountNetto)) : current.amountNetto;
    const nextVatRate =
      patch.vatRate !== undefined ? Number(patch.vatRate) : current.vatRate;
    const nextIrpf =
      patch.irpfAmount !== undefined ? this.round2(Number(patch.irpfAmount)) : current.irpfAmount;
    const nextVatAmount = this.round2((nextNetto * nextVatRate) / 100);
    const nextGross =
      patch.amountGross !== undefined
        ? this.round2(Number(patch.amountGross))
        : this.round2(nextNetto + nextVatAmount - nextIrpf);

    const nextDate = patch.date ? patch.date.trim() : current.date;

    const updated: FinanceLedgerEntry = {
      ...current,
      date: nextDate,
      period: nextDate.slice(0, 7),
      invoiceNumber:
        patch.invoiceNumber !== undefined ? patch.invoiceNumber.trim() : current.invoiceNumber,
      counterpartyName:
        patch.counterpartyName !== undefined
          ? patch.counterpartyName.trim()
          : current.counterpartyName,
      counterpartyTaxId:
        patch.counterpartyTaxId !== undefined
          ? patch.counterpartyTaxId.trim()
          : current.counterpartyTaxId,
      description:
        patch.description !== undefined ? patch.description.trim() : current.description,
      amountNetto: nextNetto,
      vatRate: nextVatRate,
      vatAmount: nextVatAmount,
      irpfAmount: nextIrpf,
      amountGross: nextGross,
      paymentStatus: patch.paymentStatus ?? current.paymentStatus,
      wordPdfGenerated:
        patch.wordPdfGenerated !== undefined ? Boolean(patch.wordPdfGenerated) : current.wordPdfGenerated,
      createdInTaxfix:
        patch.createdInTaxfix !== undefined ? Boolean(patch.createdInTaxfix) : current.createdInTaxfix,
      uploadedToTaxfix:
        patch.uploadedToTaxfix !== undefined
          ? Boolean(patch.uploadedToTaxfix)
          : current.uploadedToTaxfix,
      paymentLinkedInTaxfix:
        patch.paymentLinkedInTaxfix !== undefined
          ? Boolean(patch.paymentLinkedInTaxfix)
          : current.paymentLinkedInTaxfix,
      invoiceFilePath:
        patch.invoiceFilePath !== undefined ? patch.invoiceFilePath.trim() : current.invoiceFilePath,
      paymentReceiptFilePath:
        patch.paymentReceiptFilePath !== undefined
          ? patch.paymentReceiptFilePath.trim()
          : current.paymentReceiptFilePath,
      bankReference:
        patch.bankReference !== undefined ? patch.bankReference.trim() : current.bankReference,
      notes: patch.notes !== undefined ? patch.notes.trim() : current.notes,
      isAutoTemplate: false,
      updatedAt: new Date().toISOString(),
    };

    store.entries[idx] = updated;
    this.writeStore(store);
    return updated;
  }

  /**
   * Удаление пользовательской записи из финансового реестра
   */
  public deleteLedgerEntry(id: string): { deleted: boolean; id: string } {
    this.validateNoPlaceholders('id', id);
    const store = this.readStore();
    const initialLen = store.entries.length;
    store.entries = store.entries.filter((e) => e.id !== id);
    if (store.entries.length === initialLen) {
      throw new NotFoundException(`Запись "${id}" не найдена или является виртуальным шаблоном`);
    }
    this.writeStore(store);
    return { deleted: true, id };
  }

  /**
   * Обновление настроек курса валют EUR/RUB и реквизитов клиента по умолчанию для IT-инвойсов
   */
  public updateSettings(body: {
    eurRubRate?: number;
    defaultItMonthlyAmountEur?: number;
    defaultItClientName?: string;
    defaultItClientVat?: string;
    defaultItServiceDescription?: string;
  }) {
    const store = this.readStore();
    if (body.eurRubRate !== undefined) {
      const rate = Number(body.eurRubRate);
      if (isNaN(rate) || rate <= 0) {
        throw new BadRequestException('Курс eurRubRate должен быть положительным числом');
      }
      store.eurRubRate = this.round2(rate);
    }
    if (body.defaultItMonthlyAmountEur !== undefined) {
      const amt = Number(body.defaultItMonthlyAmountEur);
      if (isNaN(amt) || amt <= 0) {
        throw new BadRequestException('Сумма defaultItMonthlyAmountEur должна быть положительным числом');
      }
      store.defaultItMonthlyAmountEur = this.round2(amt);
    }
    if (body.defaultItClientName !== undefined && body.defaultItClientName.trim()) {
      store.defaultItClientName = body.defaultItClientName.trim();
    }
    if (body.defaultItClientVat !== undefined && body.defaultItClientVat.trim()) {
      store.defaultItClientVat = body.defaultItClientVat.trim();
    }
    if (body.defaultItServiceDescription !== undefined && body.defaultItServiceDescription.trim()) {
      store.defaultItServiceDescription = body.defaultItServiceDescription.trim();
    }

    this.writeStore(store);
    return {
      status: 'success',
      eurRubRate: store.eurRubRate,
      defaultItMonthlyAmountEur: store.defaultItMonthlyAmountEur,
      defaultItClientName: store.defaultItClientName,
      defaultItClientVat: store.defaultItClientVat,
      defaultItServiceDescription: store.defaultItServiceDescription,
    };
  }

  /**
   * Генерация готового документа инвойса по IT-разработке (IAE 763 / CNAE 6201) для сохранения в Word (.doc) и печати в PDF,
   * а также чек-листа данных для дублирования электронной фактуры в государственной системе Испании через Taxfix.
   */
  public generateItInvoiceDocument(idOrPeriod: string): {
    entry: FinanceLedgerEntry;
    htmlDocument: string;
    wordFileName: string;
    pdfFileName: string;
    taxfixElectronicInvoicePayload: {
      epigrafeIae: string;
      cnae: string;
      issuerName: string;
      issuerNif: string;
      issuerAddress: string;
      invoiceNumber: string;
      issueDate: string;
      clientName: string;
      clientTaxId: string;
      concept: string;
      baseImponibleEur: number;
      ivaRatePercent: number;
      ivaAmountEur: number;
      totalFacturaEur: number;
      legalNote: string;
    };
  } {
    this.validateNoPlaceholders('idOrPeriod', idOrPeriod);
    const yearMatch = idOrPeriod.match(/(\d{4})/);
    const year = yearMatch ? Number(yearMatch[1]) : new Date().getUTCFullYear();
    const { allEntries } = this.getMergedLedgerEntries(year);

    const entry = allEntries.find(
      (e) =>
        e.id === idOrPeriod ||
        (e.segment === 'IT_DEV' && e.period === idOrPeriod) ||
        e.invoiceNumber === idOrPeriod,
    );

    if (!entry) {
      throw new NotFoundException(`IT-инвойс для "${idOrPeriod}" не найден`);
    }

    const htmlDocument = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Factura ${entry.invoiceNumber} — Vitalii Iasinskii</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 40px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 24px; }
    .title { font-size: 24px; font-weight: bold; color: #1e3a8a; }
    .meta { font-size: 14px; color: #334155; }
    .parties { width: 100%; margin-bottom: 28px; border-collapse: collapse; }
    .parties td { width: 50%; vertical-align: top; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; }
    .items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .items th { background: #1e3a8a; color: #ffffff; text-align: left; padding: 10px 12px; font-size: 13px; }
    .items td { padding: 12px; border-bottom: 1px solid #cbd5e1; font-size: 14px; }
    .totals { width: 320px; margin-left: auto; border-collapse: collapse; }
    .totals td { padding: 8px 12px; font-size: 14px; }
    .totals .grand { font-size: 17px; font-weight: bold; border-top: 2px solid #0f172a; color: #1e3a8a; }
    .footer { margin-top: 40px; font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">FACTURA / INVOICE</div>
      <div class="meta">Nº de Factura: <b>${entry.invoiceNumber}</b></div>
      <div class="meta">Fecha de emisión: <b>${entry.date}</b></div>
    </div>
    <div style="text-align: right;" class="meta">
      <b>VITALII IASINSKII (AUTÓNOMO)</b><br/>
      NIF / EU VAT (ROI VIES): <b>ESZ1154366R</b><br/>
      Ronda Albocacer 11, 12166 Els Ibarsos (Castellón), España<br/>
      Actividad: IAE 763 / CNAE 6201 (Programación Informática)
    </div>
  </div>

  <table class="parties">
    <tr>
      <td>
        <b>EMISOR (Prestador del servicio):</b><br/>
        Vitalii Iasinskii<br/>
        NIF / VAT: ESZ1154366R<br/>
        Ronda Albocacer 11, 12166 Els Ibarsos, Castellón, Spain<br/>
        Email: info@viasglobal.es
      </td>
      <td>
        <b>CLIENTE (Destinatario):</b><br/>
        ${entry.counterpartyName}<br/>
        VAT / Tax ID: ${entry.counterpartyTaxId || 'B2B Client'}<br/>
        Periodo facturado: ${entry.period}
      </td>
    </tr>
  </table>

  <table class="items">
    <thead>
      <tr>
        <th>Descripción del servicio / Concepto</th>
        <th style="text-align: center;">Cantidad</th>
        <th style="text-align: right;">Precio Unitario (€)</th>
        <th style="text-align: right;">Total (€)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${entry.description}</td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right;">${entry.amountNetto.toFixed(2)} €</td>
        <td style="text-align: right;">${entry.amountNetto.toFixed(2)} €</td>
      </tr>
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td>Base Imponible (Netto):</td>
      <td style="text-align: right;"><b>${entry.amountNetto.toFixed(2)} €</b></td>
    </tr>
    <tr>
      <td>IVA (${entry.vatRate}%):</td>
      <td style="text-align: right;">${entry.vatAmount.toFixed(2)} €</td>
    </tr>
    <tr class="grand">
      <td>TOTAL FACTURA:</td>
      <td style="text-align: right;">${entry.amountGross.toFixed(2)} €</td>
    </tr>
  </table>

  <div class="footer">
    <p><b>Nota fiscal:</b> ${
      entry.vatRate === 0
        ? 'Operación no sujeta a IVA por reglas de localización / Inversión del sujeto pasivo (Art. 69 y 84 Ley 37/1992 del IVA — Registro de Operadores Intracomunitarios ROI/VIES ESZ1154366R).'
        : `IVA ${entry.vatRate}% aplicado conforme a la Ley 37/1992 del IVA.`
    }</p>
    <p>Factura registrada en el sistema de facturación electrónica (Taxfix / AEAT).</p>
  </div>
</body>
</html>`;

    return {
      entry,
      htmlDocument,
      wordFileName: `Factura_${entry.invoiceNumber}_${entry.date}.doc`,
      pdfFileName: `Factura_${entry.invoiceNumber}_${entry.date}.pdf`,
      taxfixElectronicInvoicePayload: {
        epigrafeIae: '763 (Sección Profesional)',
        cnae: '6201 / 6202 — Programadores y Analistas de Informática',
        issuerName: 'Vitalii Iasinskii',
        issuerNif: 'ESZ1154366R',
        issuerAddress: 'Ronda Albocacer 11, 12166 Els Ibarsos (Castellón)',
        invoiceNumber: entry.invoiceNumber,
        issueDate: entry.date,
        clientName: entry.counterpartyName,
        clientTaxId: entry.counterpartyTaxId || 'EU-B2B',
        concept: entry.description,
        baseImponibleEur: entry.amountNetto,
        ivaRatePercent: entry.vatRate,
        ivaAmountEur: entry.vatAmount,
        totalFacturaEur: entry.amountGross,
        legalNote:
          'Обязательно продублировать в системе электронных счетов-фактур Taxfix и прикрепить банковское зачисление после оплаты',
      },
    };
  }

  private round2(val: number): number {
    return Math.round((Number(val) || 0) * 100) / 100;
  }

  /**
   * Сводный комплаенс-контроль для автономного AI-ассистента (OpenClaw):
   * 1. Статус ежемесячной IT-фактуры (Кипр, 4 000 EUR): выпуск в Taxfix, генерация EN docx/PDF, факт оплаты на Santander.
   * 2. Статус входящих фактур от поставщиков: загрузка в Taxfix, линковка с оплатой.
   * 3. Формирование готовых напоминаний без длинных тире для Telegram-уведомлений.
   */
  public async getComplianceStatus(customDate?: string): Promise<{
    status: 'success';
    timestamp: string;
    targetPeriod: string;
    allCompliant: boolean;
    needsReminder: boolean;
    itInvoice: {
      expectedInvoiceNumber: string;
      dueDate: string;
      isDueSoonOrPassed: boolean;
      createdInTaxfix: boolean;
      docGenerated: boolean;
      paymentReceived: boolean;
      bankAccount: string;
      pendingSteps: string[];
    };
    supplierInvoices: {
      totalPendingCount: number;
      pendingTaxfixUploadCount: number;
      pendingTaxfixLinkCount: number;
      items: Array<{
        orderNumber: string;
        supplier: string;
        amountEur: number;
        hasInvoice: boolean;
        hasPaymentReceipt: boolean;
        uploadedToTaxfix: boolean;
        paymentLinkedInTaxfix: boolean;
        pendingActions: string[];
      }>;
    };
    reminders: string[];
  }> {
    const now = customDate ? new Date(customDate) : new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;
    const period = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    // Вычисляем последний день месяца и последний рабочий день
    const lastDayOfMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate();
    let lastBizDay = lastDayOfMonth;
    let checkDate = new Date(Date.UTC(currentYear, currentMonth - 1, lastBizDay));
    while (checkDate.getUTCDay() === 0 || checkDate.getUTCDay() === 6) {
      lastBizDay--;
      checkDate = new Date(Date.UTC(currentYear, currentMonth - 1, lastBizDay));
    }
    const currentDay = now.getUTCDate();
    const dueDateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(lastBizDay).padStart(2, '0')}`;
    const isDueSoonOrPassed = currentDay >= lastBizDay - 2;

    // 1. Проверяем IT-инвойс за текущий месяц
    const { allEntries } = this.getMergedLedgerEntries(currentYear);
    const itEntry = allEntries.find((e) => e.segment === 'IT_DEV' && e.period === period);

    const pendingItSteps: string[] = [];
    let itCreatedInTaxfix = false;
    let itDocGenerated = false;
    let itPaymentReceived = false;

    // Предполагаемый номер фактуры (например, F-0010-2026 для октября 2026)
    const expectedInvoiceNumber = itEntry?.invoiceNumber || `F-00${currentMonth}-2026`;

    if (!itEntry || !itEntry.createdInTaxfix) {
      pendingItSteps.push(`Создать оригинальную фактуру ${expectedInvoiceNumber} в Taxfix (https://app.taxfix.es/)`);
    } else {
      itCreatedInTaxfix = true;
    }

    if (!itEntry || !itEntry.wordPdfGenerated) {
      pendingItSteps.push(`Сгенерировать английскую версию инвойса ${expectedInvoiceNumber} (PDF/Docx) через scripts/invoice.ts`);
    } else {
      itDocGenerated = true;
    }

    if (!itEntry || itEntry.paymentStatus !== 'PAID' || !itEntry.paymentLinkedInTaxfix) {
      pendingItSteps.push(`Привязать банковскую оплату 4 000 EUR от J2T Services Ltd к фактуре в Taxfix (счет Santander ES2400496216312716122672)`);
    } else {
      itPaymentReceived = true;
    }

    // 2. Проверяем комплаенс заказов поставщиков
    const purchaseOrders = await this.prisma.purchaseOrder.findMany({
      where: {
        orderDate: {
          gte: new Date(Date.UTC(currentYear, 0, 1)),
        },
      },
      include: {
        distributor: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    const supplierPendingItems: Array<{
      orderNumber: string;
      supplier: string;
      amountEur: number;
      hasInvoice: boolean;
      hasPaymentReceipt: boolean;
      uploadedToTaxfix: boolean;
      paymentLinkedInTaxfix: boolean;
      pendingActions: string[];
    }> = [];

    for (const po of purchaseOrders) {
      const compliance = this.ordersService.computeTaxfixCompliance(po);
      if (!compliance.isCompliant) {
        supplierPendingItems.push({
          orderNumber: po.orderNumber,
          supplier: po.distributor?.name || 'Поставщик',
          amountEur: po.totalGross,
          hasInvoice: compliance.hasInvoice,
          hasPaymentReceipt: compliance.hasPaymentReceipt,
          uploadedToTaxfix: compliance.uploadedToTaxfix,
          paymentLinkedInTaxfix: compliance.paymentLinkedInTaxfix,
          pendingActions: compliance.pendingActions,
        });
      }
    }

    // 3. Формируем список текстовых напоминаний для бота (без длинных тире)
    const reminders: string[] = [];

    if (isDueSoonOrPassed && (!itCreatedInTaxfix || !itDocGenerated)) {
      reminders.push(
        `Ежемесячная фактура за разработку (${period}): до ${dueDateStr} нужно создать фактуру ${expectedInvoiceNumber} в Taxfix (https://app.taxfix.es/) и подготовить английский инвойс для клиента J2T Services Ltd.`
      );
    }

    if (itCreatedInTaxfix && !itPaymentReceived) {
      reminders.push(
        `Фактура ${expectedInvoiceNumber} (J2T Services Ltd): после поступления 4 000 EUR на счет Santander привяжи оплату в Taxfix (https://app.taxfix.es/).`
      );
    }

    if (supplierPendingItems.length > 0) {
      for (const item of supplierPendingItems.slice(0, 3)) {
        if (!item.hasInvoice) {
          reminders.push(`Заказ ${item.orderNumber} (${item.supplier}): ожидается счет-фактура (Factura) от поставщика для загрузки в Taxfix.`);
        } else if (!item.uploadedToTaxfix) {
          reminders.push(`Заказ ${item.orderNumber} (${item.supplier}): загрузи полученную фактуру в Taxfix (https://app.taxfix.es/).`);
        } else if (!item.paymentLinkedInTaxfix) {
          reminders.push(`Заказ ${item.orderNumber} (${item.supplier}): прикрепи выписку об оплате и свяжи платеж в Taxfix (https://app.taxfix.es/).`);
        }
      }
    }

    const allCompliant = pendingItSteps.length === 0 && supplierPendingItems.length === 0;
    const needsReminder = reminders.length > 0;

    return {
      status: 'success',
      timestamp: now.toISOString(),
      targetPeriod: period,
      allCompliant,
      needsReminder,
      itInvoice: {
        expectedInvoiceNumber,
        dueDate: dueDateStr,
        isDueSoonOrPassed,
        createdInTaxfix: itCreatedInTaxfix,
        docGenerated: itDocGenerated,
        paymentReceived: itPaymentReceived,
        bankAccount: 'Santander ES2400496216312716122672',
        pendingSteps: pendingItSteps,
      },
      supplierInvoices: {
        totalPendingCount: supplierPendingItems.length,
        pendingTaxfixUploadCount: supplierPendingItems.filter((i) => !i.uploadedToTaxfix).length,
        pendingTaxfixLinkCount: supplierPendingItems.filter((i) => !i.paymentLinkedInTaxfix).length,
        items: supplierPendingItems,
      },
      reminders,
    };
  }
}


