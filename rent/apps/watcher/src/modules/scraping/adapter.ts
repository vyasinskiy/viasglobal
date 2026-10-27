import fs from 'node:fs';
// Импортируем строгие типы Playwright без использования any
import type { Browser, BrowserContext, Page } from 'playwright';
import { config } from '../../config';
import type { AccrualSnapshot, ApartmentSnapshot, AccountSnapshot, InvoiceSnapshot, ScanResult } from '../../types';

/**
 * Ошибка, выбрасываемая при обнаружении истекшей или недействительной сессии авторизации
 */
export class ExpiredSessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpiredSessionError';
  }
}

/**
 * Ошибка, выбрасываемая при отсутствии файла квитанции на сервере (HTTP 404).
 * Для инвойсов за текущий или последний месяц это является ожидаемым поведением,
 * так как управляющие компании формируют PDF квитанции с задержкой.
 */
export class InvoiceNotFoundError extends Error {
  constructor(public readonly status: number = 404, message?: string) {
    super(message || `Failed to download invoice: ${status}`);
    this.name = 'InvoiceNotFoundError';
  }
}

/**
 * Проверяет, требуется ли авторизация на портале kvartplata.online.
 * Проверка учитывает редиректы на промо-лендинг, наличие кнопок входа
 * и предотвращает ложноположительные срабатывания от маркетинговых текстов.
 *
 * @param currentUrl Текущий URL страницы после навигации
 * @param bodyText Текстовое содержимое страницы (body)
 * @returns true, если сессия отсутствует или истекла и требуется вход
 */
export function checkIsLoginRequired(currentUrl: string, bodyText: string): boolean {
  const urlLower = (currentUrl || '').toLowerCase();

  // 1. Проверяем URL: если произошел редирект на промо-корень сайта или страницу входа
  const isPersonalCabinetHost =
    urlLower.includes('/new-web/') ||
    urlLower.includes('xn--j1ab') || // лк.квартплата.онлайн
    urlLower.includes('xn--new--o5df') || // new-лк.квартплата.онлайн
    urlLower.includes('lk.kvartplata.online') ||
    /\/\d+/.test(urlLower); // путь с ID Л/С, например /378621

  const isExplicitLoginUrl =
    urlLower.includes('/login') ||
    urlLower.includes('/auth') ||
    urlLower === 'https://xn--80aaaf3bi1ahsd.xn--80asehdb/' ||
    urlLower === 'https://kvartplata.online/' ||
    urlLower === 'http://xn--80aaaf3bi1ahsd.xn--80asehdb/' ||
    urlLower === 'http://kvartplata.online/';

  if (!isPersonalCabinetHost || isExplicitLoginUrl) {
    // Пользователь был перенаправлен за пределы личного кабинета — требуется авторизация
    return true;
  }

  const textLower = (bodyText || '').toLowerCase();

  // 2. Проверяем наличие явных ключевых слов, требующих входа (кнопка "Войти", форма авторизации, капча)
  const hasSessionRequiredKeyword = config.sessionRequiredKeywords.some((keyword) => {
    const k = keyword.trim().toLowerCase();
    if (!k) return false;
    return textLower.includes(k);
  });

  if (hasSessionRequiredKeyword) {
    // На странице присутствуют элементы авторизации или капчи
    return true;
  }

  // 3. Проверяем наличие ключевых слов готовности личного кабинета (например, "Начисления", "Лицевой счет", "Баланс", "Помещения", "Счётчики")
  const defaultSignals = [
    'начисления',
    'квитанция',
    'лицевой счет',
    'личный кабинет',
    'помещения',
    'баланс',
    'лицевые счета',
    'счётчики',
    'счетчики',
    'платежи',
    'заявки',
    'магазин',
    'главная',
    'выйти'
  ];
  const allSignals = [...config.accountReadyTextList.map((x) => x.trim().toLowerCase()), ...defaultSignals];
  const hasReadySignal = allSignals.some((keyword) => {
    if (!keyword) return false;
    return textLower.includes(keyword);
  });

  if (!hasReadySignal) {
    // На странице нет признаков данных кабинета — страница не готова к парсингу
    return true;
  }

  // Страница находится внутри личного кабинета, не содержит элементов входа и содержит данные кабинета
  return false;
}

export class KvartplataAdapter {
  async bootstrap(): Promise<void> {
    const { chromium } = await import('playwright');
    const browser = config.BROWSER_WS_ENDPOINT
      ? await chromium.connectOverCDP(config.BROWSER_WS_ENDPOINT)
      : await chromium.launch({ headless: false });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    if (config.BROWSER_WS_ENDPOINT) {
      console.log('--- REMOTE BROWSER DETECTED ---');
      console.log('1. Open your browser and go to: http://localhost:3001');
      console.log('2. You will see the remote browser screen there.');
    }

    await page.goto(config.LOGIN_URL, { waitUntil: 'domcontentloaded' });
    console.log(`Open page: ${config.LOGIN_URL}`);
    console.log('Log in manually, solve captcha manually if it appears, then press Enter here to save the session.');

    await waitForEnter();
    await page.waitForTimeout(config.WAIT_AFTER_LOGIN_MS);

    if (await this.isLoginRequired(page)) {
      await browser.close();
      throw new Error('Login still appears required. Session state was not saved.');
    }

    await context.storageState({ path: config.storageStatePath });
    await browser.close();
  }

  async scan(
    filters: { apartmentExternalIds?: string[]; log?: (message: string) => void } = {}
  ): Promise<ScanResult> {
    const { chromium } = await import('playwright');
    
    // Браузер строго типизирован без использования any
    let browser: Browser | null = null;
    let context: BrowserContext;
    
    if (config.BROWSER_PROFILE_PATH && !config.BROWSER_WS_ENDPOINT) {
      // Удаляем остаточные замки Chromium, чтобы Playwright не создавал пустой временный профиль
      cleanProfileSingletonLocks(config.BROWSER_PROFILE_PATH);
      context = await chromium.launchPersistentContext(config.BROWSER_PROFILE_PATH, {
        headless: config.HEADLESS,
        acceptDownloads: true
      });
      browser = null;
    } else {
      browser = config.BROWSER_WS_ENDPOINT
        ? await chromium.connectOverCDP(config.BROWSER_WS_ENDPOINT)
        : await chromium.launch({ headless: config.HEADLESS });
      
      context = await browser.newContext({
        storageState: fs.existsSync(config.storageStatePath) ? config.storageStatePath : undefined,
        acceptDownloads: true
      });
    }

    const page = await context.newPage();
    const log = filters.log ?? (() => undefined);

    try {
      await page.goto(config.ACCOUNT_PAGE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(Math.max(config.WAIT_AFTER_NAV_MS, 3000));

      if (await this.isLoginRequired(page)) {
        const errorDesc = 'SessionExpired: Сохраненная сессия отсутствует или истекла (обнаружен редирект или форма авторизации).';
        return {
          apartments: [],
          accounts: [],
          accruals: [],
          invoices: [],
          needsLogin: true,
          degraded: false,
          message: 'Saved session is missing or expired; manual bootstrap is required.',
          error: errorDesc,
          errors: [errorDesc]
        };
      }

      const warnings: string[] = [];
      let apartmentPayload: unknown = null;
      try {
        // Запрашиваем список квартир через внутренний API портала
        apartmentPayload = await this.fetchJson(page, config.endpoints.apartments);
      } catch (error) {
        // Если API вернул HTML или ошибку авторизации — прерываем сканирование и запрашиваем логин
        if (error instanceof ExpiredSessionError) {
          log(`Обнаружена истекшая сессия при запросе квартир: ${error.message}`);
          return {
            apartments: [],
            accounts: [],
            accruals: [],
            invoices: [],
            needsLogin: true,
            degraded: false,
            message: 'Сессия авторизации истекла (API вернул HTML вместо JSON). Требуется повторный вход в личный кабинет.',
            error: error.message,
            errors: [error.message]
          };
        }
        const errText = error instanceof Error ? error.message : String(error);
        warnings.push(errText);
        return {
          apartments: [],
          accounts: [],
          accruals: [],
          invoices: [],
          needsLogin: false,
          degraded: true,
          message: warnings.join(' '),
          error: errText,
          errors: warnings
        };
      }
      const rawApartments = apartmentPayload ? extractApartments(apartmentPayload) : [];
      log(`Apartments discovered from /new-web/apartments: ${rawApartments.length}`);

      const selectedApartments = filters.apartmentExternalIds?.length
        ? rawApartments.filter((item) => filters.apartmentExternalIds?.includes(item.externalId))
        : rawApartments;
      log(`Apartments selected for scan: ${selectedApartments.length}`);

      const apartments: ApartmentSnapshot[] = [];
      const accountSnapshots: AccountSnapshot[] = [];
      const accruals: AccrualSnapshot[] = [];
      const invoices: InvoiceSnapshot[] = [];

      for (const apartment of selectedApartments) {
        try {
          apartments.push(apartment);
          log(`Apartment found: ${formatApartment(apartment)}`);
          
          const infoPayload = await this.fetchJson(page, config.endpoints.apartmentInfo, {}, { apartmentId: apartment.externalId });
          const accounts = extractAccounts(apartment, infoPayload);
          log(`Accounts found for apartment ${apartment.externalId}: ${accounts.length}`);

          for (const account of accounts) {
            accountSnapshots.push(account);
            log(`Scanning account ${account.externalId} for apartment ${apartment.externalId}`);

            const accrualPayload = await this.fetchJson(page, config.endpoints.accruals, { accountId: account.externalId });
            const accountAccruals = extractAccruals(account, accrualPayload);
            accruals.push(...accountAccruals);
            log(`Accrual periods found for account ${account.externalId}: ${accountAccruals.length}`);

            for (const accrual of accountAccruals) {
                const invoiceUrl = new URL(config.endpoints.invoice, config.API_BASE_URL);
                invoiceUrl.searchParams.set('AccountId', account.externalId);
                invoiceUrl.searchParams.set('PeriodId', accrual.periodId);
                
                // Try to extract numeric amount from the accrual's raw data
                const accrualData = JSON.parse(accrual.rawJson || '{}').accrual || {};
                const amount = pickNumber(accrualData, ['amountToPay', 'AmountToPay', 'accruedAmount', 'AccruedAmount', 'amount', 'Amount', 'sum', 'Sum', 'value']);

                invoices.push({
                    accountExternalId: account.externalId,
                    periodLabel: accrual.periodLabel,
                    periodId: accrual.periodId,
                    amount,
                    invoiceUrl: invoiceUrl.toString(),
                    utilitiesUrl: undefined,
                    available: true,
                    uploadedToStorage: false,
                    rawJson: JSON.stringify({
                        accountId: account.externalId,
                        apartmentExternalId: apartment.externalId,
                        periodId: accrual.periodId,
                        invoiceUrl: invoiceUrl.toString(),
                        amount
                    })
                });
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          warnings.push(`Apartment ${apartment.externalId}: ${errorMessage}`);
          log(`Apartment ${apartment.externalId} failed: ${errorMessage}`);
        }
      }

      // Автоматически сохраняем подтвержденную сессию в storage-state.json для надежности
      try {
        await context.storageState({ path: config.storageStatePath });
        log('Снимок сессии Playwright успешно сохранен в storage-state.json');
      } catch (saveErr) {
        log(`Не удалось сохранить storageState: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
      }

      return {
        apartments: dedupe(apartments, (item) => item.externalId),
        accounts: dedupe(accountSnapshots, (item) => item.externalId),
        accruals: dedupe(accruals, (item) => `${item.accountExternalId}_${item.periodId}`),
        invoices: dedupe(invoices, (item) => `${item.accountExternalId}_${item.periodId}`),
        needsLogin: false,
        degraded: warnings.length > 0,
        message: warnings.length
          ? `Scanned ${selectedApartments.length} apartment(s), ${accountSnapshots.length} account(s). Warnings: ${warnings.join(' ')}`
          : `Scanned ${selectedApartments.length} apartment(s), ${accountSnapshots.length} account(s).`,
        error: warnings.length > 0 ? warnings.join('; ') : undefined,
        errors: warnings.length > 0 ? warnings : undefined
      };
    } finally {
      if (browser) {
        await browser.close();
      } else if (context) {
        await context.close();
      }
    }
  }

  async downloadInvoice(url: string): Promise<Buffer> {
    const { chromium } = await import('playwright');
    // Браузер строго типизирован без использования any
    let browser: Browser | null = null;
    let context: BrowserContext;

    if (config.BROWSER_PROFILE_PATH && !config.BROWSER_WS_ENDPOINT) {
      // Удаляем остаточные замки Chromium перед открытием сессии скачивания
      cleanProfileSingletonLocks(config.BROWSER_PROFILE_PATH);
      context = await chromium.launchPersistentContext(config.BROWSER_PROFILE_PATH, {
        headless: config.HEADLESS,
        acceptDownloads: true
      });
    } else {
      browser = config.BROWSER_WS_ENDPOINT
        ? await chromium.connectOverCDP(config.BROWSER_WS_ENDPOINT)
        : await chromium.launch({ headless: config.HEADLESS });
      
      context = await browser.newContext({
        storageState: fs.existsSync(config.storageStatePath) ? config.storageStatePath : undefined,
        acceptDownloads: true
      });
    }

    const page = await context.newPage();
    try {
      const response = await page.request.get(url, {
        headers: { accept: 'application/pdf, application/octet-stream, */*' }
      });
      if (!response.ok()) {
        if (response.status() === 404) {
          throw new InvoiceNotFoundError(404, `Failed to download invoice: 404`);
        }
        throw new Error(`Failed to download invoice: ${response.status()}`);
      }
      return await response.body();
    } finally {
      if (browser) {
        await browser.close();
      } else {
        await context.close();
      }
    }
  }

  private async fetchJson(
    page: Page,
    endpoint: string,
    params: Record<string, string> = {},
    pathParams: Record<string, string> = {}
  ): Promise<unknown> {
    // Формируем полный URL с учетом подстановки параметров пути
    const url = new URL(applyPathParams(endpoint, pathParams), config.API_BASE_URL);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    // Выполняем сетевой запрос из контекста страницы Playwright с куками сессии
    const response = await page.request.get(url.toString(), {
      headers: { accept: 'application/json, text/plain, */*' }
    });

    if (!response.ok()) {
      // Статусы 401 и 403 свидетельствуют об истекшей сессии
      if (response.status() === 401 || response.status() === 403) {
        throw new ExpiredSessionError(`Kvartplata API ${endpoint} вернул статус ${response.status()}. Сессия авторизации истекла.`);
      }
      throw new Error(`Kvartplata API ${endpoint} failed with ${response.status()}`);
    }

    const text = await response.text();
    const trimmed = text.trim().toLowerCase();

    // Проверяем, не вернул ли сервер HTML-документ вместо ожидаемого JSON (например, редирект на SPA лендинг)
    if (trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.includes('<body')) {
      throw new ExpiredSessionError(`Kvartplata API ${endpoint} вернул HTML-разметку вместо JSON. Сессия авторизации истекла.`);
    }

    try {
      // Парсим JSON ответ
      return JSON.parse(text);
    } catch (parseError) {
      throw new Error(`Не удалось распарсить JSON из ответа API ${endpoint}: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  }

  public async isLoginRequired(page: Page): Promise<boolean> {
    // Извлекаем текущий URL страницы после навигации и возможных редиректов
    const currentUrl = page.url();
    // Извлекаем текстовое содержимое страницы для анализа ключевых слов
    const bodyText = (await page.textContent('body')) ?? '';
    // Выполняем проверку необходимости авторизации
    return checkIsLoginRequired(currentUrl, bodyText);
  }
}

async function waitForEnter(): Promise<void> {
  await new Promise<void>((resolve) => {
    process.stdin.resume();
    process.stdin.once('data', () => resolve());
  });
}

export function extractApartments(payload: unknown): ApartmentSnapshot[] {
  const rows = collectObjects(payload);
  const results: ApartmentSnapshot[] = [];

  for (const row of rows) {
    const externalId = pickString(row, ['id', 'Id', 'apartmentId', 'apartment_id']);
    if (!externalId) continue;

    results.push({
      externalId,
      address: pickString(row, ['address', 'Address', 'fullAddress', 'houseAddress']),
      organization: pickString(row, ['organization', 'Organization', 'company', 'managementCompany']),
      rawJson: JSON.stringify(row)
    });
  }

  return dedupe(results, (item) => item.externalId);
}

export function extractAccounts(apartment: ApartmentSnapshot, payload: unknown): AccountSnapshot[] {
  const accounts = findObjectsAtKeys(payload, ['accounts', 'Accounts']);
  const rows = accounts.length ? accounts : collectObjects(payload);
  const extracted: AccountSnapshot[] = [];

  for (const row of rows) {
    const accountId = pickString(row, ['id', 'Id', 'accountId', 'account_id', 'ls', 'personalAccount']);
    if (!accountId) continue;
    extracted.push({
      externalId: accountId,
      apartmentExternalId: apartment.externalId,
      accountNumber: pickString(row, ['number', 'Number', 'accountNumber', 'AccountNumber', 'ls', 'personalAccount']) ?? accountId,
      accountLabel: pickString(row, ['serviceName', 'ServiceName', 'organizationName', 'OrganizationName', 'name', 'Name', 'caption', 'Caption', 'title', 'Title']),
      balance: pickNumber(row, ['balance', 'Balance', 'debt', 'Debt', 'value', 'Value']),
      rawJson: JSON.stringify({ apartment, account: row })
    });
  }

  return dedupe(extracted, (item) => item.externalId);
}

export function extractAccruals(account: AccountSnapshot, payload: unknown): AccrualSnapshot[] {
  const rows = findObjectsAtKeys(payload, ['accruals', 'Accruals']);
  const sourceRows = rows.length ? rows : collectObjects(payload);

  return dedupe(sourceRows
    .map((row) => {
      const periodId = pickString(row, ['periodId', 'PeriodId', 'period', 'Period', 'month', 'Month']);
      const periodLabel = pickString(row, ['name', 'Name', 'caption', 'Caption', 'periodLabel', 'PeriodLabel']) ?? periodId ?? 'unknown';

      const initialBalance = pickString(row, ['initialBalance', 'InitialBalance']);
      const accruedAmount = pickString(row, ['accruedAmount', 'AccruedAmount', 'amount', 'Amount', 'sum', 'Sum', 'value']);
      const fine = pickString(row, ['fine', 'Fine']);
      const amountToPay = pickString(row, ['amountToPay', 'AmountToPay']);
      const paidAmount = pickString(row, ['paidAmount', 'PaidAmount']);
      const hasInvoice = pickString(row, ['hasInvoice', 'HasInvoice']);
      const buttonInvoice = pickString((row.button && typeof row.button === 'object' ? row.button : {}) as Record<string, unknown>, ['invoice']);
      const buttonPay = pickString((row.button && typeof row.button === 'object' ? row.button : {}) as Record<string, unknown>, ['pay']);
      const buttonToPay = pickString((row.button && typeof row.button === 'object' ? row.button : {}) as Record<string, unknown>, ['toPay']);
      const buttonMessage = pickString((row.button && typeof row.button === 'object' ? row.button : {}) as Record<string, unknown>, ['message', 'Message']);

      const amountText = [
        initialBalance ? `initialBalance=${initialBalance}` : null,
        accruedAmount ? `accruedAmount=${accruedAmount}` : null,
        fine ? `fine=${fine}` : null,
        amountToPay ? `amountToPay=${amountToPay}` : null,
        paidAmount ? `paidAmount=${paidAmount}` : null
      ].filter(Boolean).join(', ');

      const statusText = [
        hasInvoice ? `hasInvoice=${hasInvoice}` : null,
        buttonInvoice ? `button.invoice=${buttonInvoice}` : null,
        buttonPay ? `button.pay=${buttonPay}` : null,
        buttonToPay ? `button.toPay=${buttonToPay}` : null,
        buttonMessage ? `button.message=${buttonMessage}` : null
      ].filter(Boolean).join(', ');

      const finalPeriodId = periodId ?? periodLabel;

      return {
        accountExternalId: account.externalId,
        periodLabel,
        periodId: finalPeriodId,
        amountText: amountText || undefined,
        statusText: statusText || undefined,
        sourceUrl: undefined,
        rawJson: JSON.stringify({ account, accrual: row })
      };
    })
    .filter((item) => item.periodLabel !== 'unknown' || item.amountText || item.statusText), (item) => `${item.accountExternalId}_${item.periodId}`);
}

function collectObjects(payload: unknown): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  visit(payload);
  return results;

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      if (Object.values(record).some((entry) => ['string', 'number', 'boolean'].includes(typeof entry))) {
        results.push(record);
      }
      for (const nested of Object.values(record)) visit(nested);
    }
  }
}

function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return undefined;
}

function pickNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = parseFloat(value.replace(',', '.').replace(/\s/g, ''));
      if (!isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

function findObjectsAtKeys(payload: unknown, keys: string[]): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  visit(payload);
  return results;

  function visit(value: unknown): void {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    if (!value || typeof value !== 'object') return;

    const record = value as Record<string, unknown>;
    for (const key of keys) {
      const nested = record[key];
      if (Array.isArray(nested)) {
        for (const item of nested) {
          if (item && typeof item === 'object') results.push(item as Record<string, unknown>);
        }
      }
    }

    for (const nested of Object.values(record)) visit(nested);
  }
}

function applyPathParams(endpoint: string, params: Record<string, string>): string {
  let value = endpoint;
  for (const [key, paramValue] of Object.entries(params)) {
    value = value.replaceAll(`{${key}}`, encodeURIComponent(paramValue));
  }
  return value;
}

function dedupe<T>(items: T[], getKey: (item: T) => string): T[] {
  const map = new Map<string, T>();
  for (const item of items) map.set(getKey(item), item);
  return [...map.values()];
}

function formatApartment(apartment: ApartmentSnapshot): string {
  return [apartment.externalId, apartment.address, apartment.organization].filter(Boolean).join(' | ');
}

/**
 * Очищает остаточные симлинки SingletonLock, SingletonSocket, SingletonCookie в профиле Chromium.
 * Это предотвращает создание временных изолированных профилей Playwright при запуске.
 */
function cleanProfileSingletonLocks(profilePath: string): void {
  try {
    if (!profilePath || !fs.existsSync(profilePath)) return;
    const entries = fs.readdirSync(profilePath);
    for (const entry of entries) {
      if (entry.startsWith('Singleton')) {
        const fullPath = `${profilePath}/${entry}`;
        try {
          fs.unlinkSync(fullPath);
        } catch {
          // Игнорируем ошибки удаления симлинка
        }
      }
    }
  } catch {
    // Игнорируем ошибки доступа
  }
}

/**
 * Извлекает год и месяц из строки периода (periodId или periodLabel).
 * Поддерживает форматы:
 * - '202610' (YYYYMM)
 * - '2026-10' (YYYY-MM)
 * - '10.2026' (MM.YYYY)
 * - 'Октябрь 2026', 'Май 2026', 'October 2026', 'May 2026'
 */
export function parsePeriodYearMonth(period: string | undefined | null): { year: number; month: number } | null {
  if (!period || typeof period !== 'string') return null;
  const str = period.trim();

  // Формат YYYYMM (например, '202610')
  const yyyymmMatch = str.match(/^(\d{4})(\d{2})$/);
  if (yyyymmMatch) {
    const year = Number(yyyymmMatch[1]);
    const month = Number(yyyymmMatch[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }

  // Формат YYYY-MM или YYYY/MM или YYYY.MM
  const yyyyMmSepMatch = str.match(/^(\d{4})[-/. ](\d{1,2})$/);
  if (yyyyMmSepMatch) {
    const year = Number(yyyyMmSepMatch[1]);
    const month = Number(yyyyMmSepMatch[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }

  // Формат MM.YYYY или MM/YYYY
  const mmYyyyMatch = str.match(/^(\d{1,2})[-/. ](\d{4})$/);
  if (mmYyyyMatch) {
    const month = Number(mmYyyyMatch[1]);
    const year = Number(mmYyyyMatch[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }

  // Текстовые названия месяцев на русском и английском
  const monthNames: Record<string, number> = {
    январь: 1, янв: 1, january: 1, jan: 1,
    февраль: 2, фев: 2, february: 2, feb: 2,
    март: 3, мар: 3, march: 3, mar: 3,
    апрель: 4, апр: 4, april: 4, apr: 4,
    май: 5, may: 5,
    июнь: 6, июн: 6, june: 6, jun: 6,
    июль: 7, июл: 7, july: 7, jul: 7,
    август: 8, авг: 8, august: 8, aug: 8,
    сентябрь: 9, сен: 9, september: 9, sep: 9,
    октябрь: 10, окт: 10, october: 10, oct: 10,
    ноябрь: 11, ноя: 11, november: 11, nov: 11,
    декабрь: 12, дек: 12, december: 12, dec: 12,
  };

  const lower = str.toLowerCase();
  for (const [name, m] of Object.entries(monthNames)) {
    if (lower.includes(name)) {
      const yearMatch = str.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        return { year: Number(yearMatch[1]), month: m };
      }
    }
  }

  // Очистка от всех нецифровых символов, если осталось 6 цифр (например, '2026-10')
  const cleanDigits = str.replace(/\D/g, '');
  if (cleanDigits.length === 6) {
    const year = Number(cleanDigits.slice(0, 4));
    const month = Number(cleanDigits.slice(4, 6));
    if (year >= 2000 && month >= 1 && month <= 12) {
      return { year, month };
    }
  }

  return null;
}

/**
 * Определяет, является ли ошибка 404 при скачивании инвойса ожидаемой.
 * Ошибка 404 ожидаема для инвойсов за текущий расчетный месяц или за последний
 * завершившийся месяц (если это самый свежий период по лицевому счету),
 * поскольку управляющие компании и портал ЖКХ выставляют начисления раньше,
 * чем генерируют и прикрепляют PDF файлы квитанций.
 *
 * @param invoice Снимок инвойса, вызвавшего ошибку
 * @param allInvoices Все инвойсы из текущей сессии сканирования (для проверки максимального периода лицевого счета)
 * @param now Опорная дата для проверки (по умолчанию текущая дата)
 * @returns true, если ошибка 404 для данного периода ожидаема и не должна вызывать алерт
 */
export function isExpectedPendingInvoice(
  invoice: InvoiceSnapshot,
  allInvoices: InvoiceSnapshot[] = [],
  now: Date = new Date()
): boolean {
  // Пытаемся извлечь год и месяц из periodId или periodLabel
  const parsed = parsePeriodYearMonth(invoice.periodId) || parsePeriodYearMonth(invoice.periodLabel);

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const nowMonths = currentYear * 12 + currentMonth;

  if (parsed) {
    const periodMonths = parsed.year * 12 + parsed.month;
    const diffMonths = nowMonths - periodMonths;

    // 1. Текущий месяц или будущий период (diffMonths <= 0):
    // Квитанции текущего месяца никогда не готовы до окончания расчетного периода.
    if (diffMonths <= 0) {
      return true;
    }

    // 2. Предыдущий месяц (diffMonths === 1, например октябрь в начале ноября):
    // В первой половине месяца квитанции за прошлый месяц могут еще не быть опубликованы УК.
    // Проверяем, что для данного лицевого счета это самый свежий период в выгрузке.
    if (diffMonths === 1) {
      const accountInvoices = allInvoices.filter(i => i.accountExternalId === invoice.accountExternalId);
      const hasNewerPeriod = accountInvoices.some(other => {
        const otherParsed = parsePeriodYearMonth(other.periodId) || parsePeriodYearMonth(other.periodLabel);
        return otherParsed && (otherParsed.year * 12 + otherParsed.month) > periodMonths;
      });
      if (!hasNewerPeriod) {
        return true;
      }
    }

    // Периоды двухмесячной давности и старше (diffMonths > 1) должны быть уже загружены
    return false;
  }

  // Запасной вариант при невозможности разобрать формат даты:
  // Если инвойс содержит текущий год и является лексикографически максимальным для данного счета
  const accountInvoices = allInvoices.filter(i => i.accountExternalId === invoice.accountExternalId);
  const isLatestLexicographically = accountInvoices.every(other => other.periodId <= invoice.periodId);
  const containsCurrentYear = invoice.periodId?.includes(String(currentYear)) || invoice.periodLabel?.includes(String(currentYear));

  return isLatestLexicographically && containsCurrentYear;
}

