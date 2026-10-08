import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const defaultWebUrl = 'https://xn--j1ab.xn--80aaaf3bi1ahsd.xn--80asehdb/';
const defaultApiBaseUrl = 'https://xn--j1ab.xn--80aaaf3bi1ahsd.xn--80asehdb';
const defaultLoginUrl = 'https://xn--80aaaf3bi1ahsd.xn--80asehdb/login';

const schema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4500),
  APP_URL: z.string().url().default(defaultWebUrl),
  LOGIN_URL: z.string().url().default(defaultLoginUrl),
  ACCOUNT_PAGE_URL: z.string().optional().default(`${defaultWebUrl}`),
  API_BASE_URL: z.string().url().default(defaultApiBaseUrl),
  API_APARTMENTS_PATH: z.string().default(`${defaultApiBaseUrl}/new-web/apartments`),
  API_APARTMENT_INFO_PATH: z.string().default('/new-web/apartments/{apartmentId}/info'),
  API_ACCRUALS_PATH: z.string().default('/new-web/accruals'),
  API_INVOICE_PATH: z.string().default('/new-web/accruals/invoice'),
  DATA_DIR: z.string().default('./data'),
  STORAGE_STATE_PATH: z.string().default('./data/storage-state.json'),
  DATABASE_URL: z.string().min(1).default('postgresql://postgres:postgres@localhost:5432/kvartplata_watcher?schema=public'),
  BROWSER_WS_ENDPOINT: z.string().optional(),
  BROWSER_PROFILE_PATH: z.string().optional(),
  BROWSER_PUBLIC_URL: z.string().url().default('https://browser.viasglobal.es'),
  DOCKER_SOCKET_PATH: z.string().default('/var/run/docker.sock'),
  VISUAL_BROWSER_CONTAINER: z.string().default('accruals-visual-browser'),
  HEADLESS: z.coerce.boolean().default(true),
  WAIT_AFTER_LOGIN_MS: z.coerce.number().default(3000),
  WAIT_AFTER_NAV_MS: z.coerce.number().default(1500),
  SESSION_REQUIRED_KEYWORDS: z.string().default('войти,авторизация,captcha,капча'),
  ACCOUNT_READY_TEXT: z.string().default('Начисления,Квитанция,Лицевой счет,Личный кабинет,Помещения,Баланс,Лицевые счета'),
  DOWNLOAD_RECEIPTS: z.coerce.boolean().default(false),
  RECEIPT_DOWNLOAD_DIR: z.string().default('./data/receipts'),
  RABBITMQ_URL: z.string().default('amqp://localhost:5672'),
  QUEUE_NAME: z.string().default('accruals_notifications'),
  ACCOUNTANT_QUEUE: z.string().default('accountant_queue'),
  WATCHER_QUEUE: z.string().default('watcher_queue'),
  ACCOUNTANT_API_URL: z.string().url().default('http://localhost:3005'),
  SCRAPE_CRON: z.string().default('0 9 * * *'), // 9:00 AM every day
  TZ: z.string().default('Europe/Madrid')
});

const raw = schema.parse(process.env);

// If we are inside Docker, force set the path to browsers
// used in the official Playwright image (/ms-playwright)
if (process.env.IS_DOCKER === 'true') {
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/ms-playwright';
}

const rootDir = process.cwd();
const resolvePath = (value: string) => path.resolve(rootDir, value);

export const config = {
  ...raw,
  rootDir,
  dataDir: resolvePath(raw.DATA_DIR),
  storageStatePath: resolvePath(raw.STORAGE_STATE_PATH),
  receiptDownloadDir: resolvePath(raw.RECEIPT_DOWNLOAD_DIR),
  sessionRequiredKeywords: splitCsv(raw.SESSION_REQUIRED_KEYWORDS).map((x) => x.toLowerCase()),
  accountReadyTextList: splitCsv(raw.ACCOUNT_READY_TEXT),
  endpoints: {
    apartments: raw.API_APARTMENTS_PATH,
    apartmentInfo: raw.API_APARTMENT_INFO_PATH,
    accruals: raw.API_ACCRUALS_PATH,
    invoice: raw.API_INVOICE_PATH
  }
};

for (const dir of [config.dataDir, path.dirname(config.storageStatePath), config.receiptDownloadDir]) {
  fs.mkdirSync(dir, { recursive: true });
}

function splitCsv(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}
