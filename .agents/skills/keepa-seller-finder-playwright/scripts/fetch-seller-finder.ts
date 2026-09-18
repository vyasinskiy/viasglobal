/**
 * Скрипт автоматизированной выгрузки каталога продавца из Keepa Product Finder через Playwright.
 * Выгружает список товаров конкретного продавца без расхода API токенов,
 * сохраняет файл в формате .xlsx и опционально сразу парсит его в базу данных.
 *
 * Использование:
 *   npx tsx fetch-seller-finder.ts <sellerId_или_имя> [--no-parse] [output.xlsx] [domainId]
 */
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const backendDir = path.resolve(__dirname, '../../../../backend');

// Функция безопасного подключения модулей из папки backend/node_modules
function requireBackendModule(moduleName: string) {
  try {
    const resolved = require.resolve(moduleName, { paths: [backendDir, process.cwd()] });
    return require(resolved);
  } catch (err: any) {
    return require(moduleName);
  }
}

const { chromium } = requireBackendModule('playwright');
const { PrismaClient } = requireBackendModule('@prisma/client');
const { Pool } = requireBackendModule('pg');
const { PrismaPg } = requireBackendModule('@prisma/adapter-pg');
const dotenv = requireBackendModule('dotenv');

// Загружаем конфигурацию из .env бэкенда
dotenv.config({ path: path.join(backendDir, '.env') });

/**
 * Функция поиска Seller ID в базе данных по имени продавца (если аргумент не похож на ID).
 * Запросы только на чтение (SELECT), соответствующие правилам проекта.
 */
async function resolveSellerId(input: string): Promise<{ sellerId: string; sellerName: string | null }> {
  const trimmed = input.trim();
  
  // Если строка похожа на Amazon Seller ID (13-14 латинских букв и цифр, например A1O61CEYQ8IRTV)
  const isDirectId = /^[A-Z0-9]{12,16}$/.test(trimmed);

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    if (isDirectId) return { sellerId: trimmed, sellerName: null };
    throw new Error('DATABASE_URL не определен в окружении, невозможно найти продавца по имени.');
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    if (isDirectId) {
      // Проверяем, существует ли продавец с таким ID
      const seller = await prisma.seller.findUnique({ where: { id: trimmed } });
      return { sellerId: trimmed, sellerName: seller?.name || null };
    }

    // Ищем продавца по имени (регистронезависимо)
    console.log(`Поиск Seller ID в базе данных по запросу: "${trimmed}"...`);
    const sellers = await prisma.seller.findMany({
      where: {
        name: {
          contains: trimmed,
          mode: 'insensitive',
        },
      },
      take: 5,
    });

    if (sellers.length === 0) {
      throw new Error(`Продавец с именем "${trimmed}" не найден в базе данных. Укажите точный Seller ID.`);
    }

    if (sellers.length > 1) {
      console.log(`Найдено несколько совпадений:`);
      sellers.forEach((s) => console.log(`  - ${s.name} (ID: ${s.id})`));
      console.log(`Выбран первый: ${sellers[0].name} (${sellers[0].id})`);
    }

    return { sellerId: sellers[0].id, sellerName: sellers[0].name };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Определение пути к сохраненной сессии браузера Keepa.
 * Проверяет локальную папку auth навыка, а затем общую папку fetch-keepa-viewer.
 */
function findStorageStatePath(): string {
  const localAuth = path.resolve(__dirname, '../auth/storage_state.json');
  const sharedAuth = path.resolve(__dirname, '../../fetch-keepa-viewer/auth/storage_state.json');

  if (fs.existsSync(localAuth)) {
    return localAuth;
  }
  if (fs.existsSync(sharedAuth)) {
    return sharedAuth;
  }

  throw new Error(
    `Файл сохраненной сессии Keepa не найден ни в:\n  1. ${localAuth}\n  2. ${sharedAuth}\n` +
    'Пожалуйста, выполните вход через скрипт: npx tsx save-session.ts'
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Использование:');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/fetch-seller-finder.ts <sellerId_или_имя> [--no-parse] [output.xlsx] [domainId]');
    console.log('\nПримеры:');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/fetch-seller-finder.ts A1O61CEYQ8IRTV');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/fetch-seller-finder.ts "Theonoi"');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/fetch-seller-finder.ts A1O61CEYQ8IRTV --no-parse');
    process.exit(0);
  }

  const rawSellerParam = args[0];
  const noParse = args.includes('--no-parse');
  const filteredArgs = args.filter((a) => a !== '--no-parse');

  // Определяем Seller ID (из переданного ID или через БД)
  const { sellerId, sellerName } = await resolveSellerId(rawSellerParam);
  console.log(`\nЦелевой продавец: ${sellerName ? `"${sellerName}" ` : ''}(ID: ${sellerId})`);

  // Путь для сохранения файла
  const defaultOutputFile = path.resolve(
    __dirname,
    `../../../../keepa/exports/seller_${sellerId}_${Date.now()}.xlsx`
  );
  const targetOutputFile = filteredArgs[1]
    ? path.resolve(process.cwd(), filteredArgs[1])
    : defaultOutputFile;

  const domainId = filteredArgs[2] || '4'; // 4 = amazon.es
  const storageStatePath = findStorageStatePath();
  console.log(`Используется файл сессии: ${storageStatePath}`);

  // Запуск браузера с сохраненной сессией
  console.log('Запуск браузера Chrome для перехода в Keepa Product Finder...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false, // Оставляем видимым, чтобы не блокироваться Cloudflare / WAF
  });

  const context = await browser.newContext({
    storageState: storageStatePath,
    viewport: { width: 1440, height: 900 },
    locale: 'es-ES',
    acceptDownloads: true,
  });

  const page = await context.newPage();

  try {
    console.log(`Открываем Keepa Product Finder (https://keepa.com/#!finder, domainId: ${domainId})...`);
    await page.goto('https://keepa.com/#!finder', { waitUntil: 'domcontentloaded' });

    // Ожидаем прогрузки интерфейса Keepa
    await page.waitForTimeout(3000);

    // Закрываем возможные стартовые оверлеи/уведомления клавишей Escape
    await page.keyboard.press('Escape');

    // Поиск фильтра продавца в Keepa Product Finder:
    // Раздел "Buy Box Seller" содержит радиокнопку "Seller IDs:" и поле ввода ID продавца.
    console.log(`Поиск поля ввода продавца для ID: ${sellerId}...`);

    // Кликаем по радиокнопке "Seller IDs:" в секции Buy Box Seller
    const buyBoxRadio = page.locator('label[for="dynamicAnyOf-buyBoxSellerIdHistory-radio"]');
    if (await buyBoxRadio.isVisible({ timeout: 10000 }).catch(() => false)) {
      await buyBoxRadio.scrollIntoViewIfNeeded().catch(() => {});
      await buyBoxRadio.click();
      await page.waitForTimeout(500);
    }

    // Текстовое поле для ввода Seller ID
    const sellerInput = page.locator('#dynamicAnyOfDetail-buyBoxSellerIdHistory');
    if (await sellerInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sellerInput.fill(sellerId);
      console.log(`Seller ID "${sellerId}" успешно введен в фильтр Buy Box Seller!`);
    } else {
      // Запасной вариант: поле "Seller IDs" (all offers)
      const generalSellerInput = page.locator('#textArray-sellerIds');
      if (await generalSellerInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await generalSellerInput.fill(sellerId);
        console.log(`Seller ID "${sellerId}" введен в общий фильтр Seller IDs!`);
      } else {
        throw new Error('Не удалось обнаружить поле ввода продавца в Keepa Product Finder');
      }
    }

    await page.waitForTimeout(1000);

    // Нажимаем синюю кнопку "FIND PRODUCTS" (#filterSubmit)
    console.log('Нажатие кнопки "FIND PRODUCTS"...');
    const findButton = page.locator('#filterSubmit, button:has-text("FIND PRODUCTS"), button:has-text("Find products")').first();
    await findButton.scrollIntoViewIfNeeded().catch(() => {});
    await findButton.click();

    console.log('Ожидание формирования результатов поиска...');

    // Устанавливаем фильтр отображения на 5000 строк (максимум для одной страницы Keepa Finder),
    // чтобы экспорт гарантированно содержал до 5000 товаров, а не стандартные 100
    console.log('Проверяем и переключаем лимит отображения таблицы на 5000 строк...');
    const rowMenuTrigger = page.locator('.tool__row .trigger, .tool__row').first();
    if (await rowMenuTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
      const currentRowsText = (await rowMenuTrigger.innerText().catch(() => '')).trim();
      if (!currentRowsText.includes('5000 rows')) {
        console.log(`Текущий лимит таблицы: "${currentRowsText}". Переключаем на 5000 rows...`);
        await rowMenuTrigger.click();
        await page.waitForTimeout(500);
        const option5000 = page.locator('#tool-row-menu li[data-value="5000"], .mdc-menu li[data-value="5000"]').first();
        if (await option5000.isVisible({ timeout: 3000 }).catch(() => false)) {
          await option5000.click();
          console.log('Успешно выбран лимит: 5000 строк!');
          await page.waitForTimeout(2000); // Даем таблице время перестроиться
        }
      } else {
        console.log('Лимит 5000 строк уже активен.');
      }
    }

    // Ожидаем появление кнопки "Export" в верхней панели результатов (.tool__export)
    let foundExport = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      await page.waitForTimeout(2000);

      // Закрываем модалки, если появились
      if (await page.locator('text="Search result"').isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
      }

      // Проверяем тулбарную кнопку .tool__export
      const exportTrigger = page.locator('.tool__export, span.tool__export, span.trigger:has-text("Export")').first();
      if (await exportTrigger.isVisible().catch(() => false)) {
        console.log('Кнопка "Export" найдена в панели таблицы!');
        await exportTrigger.click();
        foundExport = true;
        await page.waitForTimeout(1500);
        break;
      }
    }

    if (!foundExport) {
      throw new Error('Кнопка "Export" не появилась. Возможно, у данного продавца нет активных товаров в выборке.');
    }

    // Ожидаем скачивание файла
    console.log('Подтверждаем экспорт (5000 строк) и ожидаем загрузку файла Excel...');
    const downloadPromise = page.waitForEvent('download', { timeout: 60000 });

    // В диалоге экспорта нажимаем кнопку "Export" (#exportSubmit)
    const dialogBtn = page.locator('#exportSubmit, button:has-text("Export"), input[value*="EXPORT"]').first();
    if (await dialogBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dialogBtn.click();
    }

    const download = await downloadPromise;

    // Сохраняем файл выгрузки
    fs.mkdirSync(path.dirname(targetOutputFile), { recursive: true });
    await download.saveAs(targetOutputFile);
    console.log(`\n Файл выгрузки успешно сохранен: ${targetOutputFile}`);

    // Обновляем сессию при необходимости
    await context.storageState({ path: storageStatePath });

  } finally {
    await browser.close();
  }

  // Если флаг --no-parse не передан, сразу запускаем скрипт парсинга в БД
  if (!noParse) {
    console.log('\n=============================================================');
    console.log('Запуск автоматического сохранения выгрузки в базу данных...');
    console.log('=============================================================\n');

    const parseScriptPath = path.join(backendDir, 'scripts/parse-keepa.ts');
    try {
      // Запуск парсера через tsx в директории backend
      execSync(`npx tsx "${parseScriptPath}" "${targetOutputFile}"`, {
        cwd: backendDir,
        stdio: 'inherit',
        env: process.env,
      });
      console.log('\n Данные продавца успешно сохранены в базе данных!');
    } catch (parseErr: any) {
      console.error('\n Ошибка при парсинге файла в БД:', parseErr.message);
      process.exit(1);
    }
  } else {
    console.log('\nФлаг --no-parse активен. Парсинг в базу данных пропущен.');
    console.log(`Для ручного парсинга запустите:`);
    console.log(`  cd backend && npx tsx scripts/parse-keepa.ts "${targetOutputFile}"`);
  }
}

main().catch((err) => {
  console.error('\n❌ Ошибка выполнения:', err.message);
  process.exit(1);
});
