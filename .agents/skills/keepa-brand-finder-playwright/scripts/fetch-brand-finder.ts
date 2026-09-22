/**
 * Скрипт автоматизированной выгрузки каталога бренда из Keepa Product Finder через Playwright.
 * Выгружает список товаров конкретного бренда без расхода API токенов,
 * сохраняет файл в формате .xlsx и опционально сразу парсит его в базу данных.
 *
 * Использование:
 *   npx tsx fetch-brand-finder.ts <название_или_id_бренда> [--no-parse] [output.xlsx] [domainId]
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
 * Нормализация и поиск бренда в базе данных (только чтение SELECT).
 * Если передан ID бренда (число) или точное/частичное название.
 */
async function resolveBrand(input: string): Promise<{ brandName: string; brandId: number | null }> {
  const trimmed = input.trim();
  const numericId = parseInt(trimmed, 10);
  const isNumeric = !isNaN(numericId) && numericId.toString() === trimmed;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { brandName: trimmed, brandId: isNumeric ? numericId : null };
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    if (isNumeric) {
      // Ищем бренд по первичному ключу ID
      const brand = await prisma.brand.findUnique({ where: { id: numericId } });
      if (brand) {
        return { brandName: brand.name, brandId: brand.id };
      }
    }

    // Ищем бренд по названию (регистронезависимо)
    console.log(`Поиск бренда в базе данных по запросу: "${trimmed}"...`);
    const brands = await prisma.brand.findMany({
      where: {
        name: {
          contains: trimmed,
          mode: 'insensitive',
        },
      },
      take: 5,
    });

    if (brands.length === 0) {
      console.log(`Бренд "${trimmed}" не найден в локальной БД. Будет выполнен прямой поиск в Keepa.`);
      return { brandName: trimmed, brandId: null };
    }

    if (brands.length > 1) {
      console.log(`Найдено несколько совпадений в базе данных:`);
      brands.forEach((b) => console.log(`  - ${b.name} (ID: ${b.id})`));
      console.log(`Выбран наиболее релевантный: ${brands[0].name} (ID: ${brands[0].id})`);
    }

    return { brandName: brands[0].name, brandId: brands[0].id };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Определение пути к сохраненной сессии браузера Keepa.
 * Проверяет локальную папку auth навыка, общую папку keepa-seller-finder-playwright или fetch-keepa-viewer.
 */
function findStorageStatePath(): string {
  const localAuth = path.resolve(__dirname, '../auth/storage_state.json');
  const sellerAuth = path.resolve(__dirname, '../../keepa-seller-finder-playwright/auth/storage_state.json');
  const sharedAuth = path.resolve(__dirname, '../../fetch-keepa-viewer/auth/storage_state.json');

  if (fs.existsSync(localAuth)) return localAuth;
  if (fs.existsSync(sellerAuth)) return sellerAuth;
  if (fs.existsSync(sharedAuth)) return sharedAuth;

  throw new Error(
    `Файл сохраненной сессии Keepa не найден ни в:\n  1. ${localAuth}\n  2. ${sellerAuth}\n  3. ${sharedAuth}\n` +
    'Пожалуйста, выполните вход через скрипт: npx tsx save-session.ts'
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Использование:');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts <название_или_id_бренда> [--no-parse] [output.xlsx] [domainId]');
    console.log('\nПримеры:');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "NWOUIIAY"');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "NWOUIIAY" --no-parse');
    process.exit(0);
  }

  const rawBrandParam = args[0];
  const noParse = args.includes('--no-parse');
  const filteredArgs = args.filter((a) => a !== '--no-parse');

  // Определяем название и ID бренда
  const { brandName, brandId } = await resolveBrand(rawBrandParam);
  console.log(`\nЦелевой бренд: "${brandName}" ${brandId ? `(ID в БД: ${brandId})` : ''}`);

  // Формируем безопасное имя файла
  const safeBrandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const defaultOutputFile = path.resolve(
    __dirname,
    `../../../../keepa/exports/brand_${safeBrandSlug}_${Date.now()}.xlsx`
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

    // Ожидаем первичной загрузки интерфейса
    await page.waitForTimeout(4000);

    // Закрываем возможные стартовые оверлеи/уведомления
    await page.keyboard.press('Escape');

    // Поиск поля фильтра бренда (#autocomplete-brand)
    console.log(`Поиск поля фильтра бренда для: "${brandName}"...`);
    const brandInput = page.locator('#autocomplete-brand');
    await brandInput.waitFor({ state: 'visible', timeout: 15000 });
    await brandInput.scrollIntoViewIfNeeded().catch(() => {});

    // Очищаем и вводим название бренда
    await brandInput.click();
    await brandInput.fill(brandName);
    console.log(`Введено значение "${brandName}" в поле Brand.`);
    await page.waitForTimeout(1000);

    // Проверяем появление выпадающего списка автодополнения (.ui-autocomplete)
    const autocompleteList = page.locator('.ui-autocomplete:visible');
    const hasDropdown = await autocompleteList.isVisible({ timeout: 2500 }).catch(() => false);

    if (hasDropdown) {
      // Ищем точное или валидное совпадение (исключая "no match")
      const lowerBrand = brandName.toLowerCase();
      const itemMatch = page.locator(`.ui-autocomplete:visible li:not(:has-text("no match")):has-text("${lowerBrand}")`).first();

      if (await itemMatch.isVisible({ timeout: 1500 }).catch(() => false)) {
        const itemText = (await itemMatch.innerText().catch(() => '')).trim();
        console.log(`Выбран вариант из списка: "${itemText}"`);
        await itemMatch.click();
      } else {
        console.log('Подходящих вариантов в автодополнении нет, нажимаем Enter.');
        await page.keyboard.press('Escape');
        await brandInput.press('Enter');
      }
    } else {
      await brandInput.press('Enter');
    }

    await page.waitForTimeout(1000);

    // Закрываем любые всплывающие баннеры и оверлеи (#popup3, popup, modal), которые могут перехватывать клики
    await page.keyboard.press('Escape');
    await page.evaluate(() => {
      document.querySelectorAll('#popup3, .popup, [id^="popup"], .modal').forEach((el) => {
        (el as HTMLElement).style.display = 'none';
      });
    }).catch(() => {});

    // Нажимаем синюю кнопку "FIND PRODUCTS" (#filterSubmit)
    console.log('Нажатие кнопки "FIND PRODUCTS"...');
    const findButton = page.locator('#filterSubmit, button:has-text("FIND PRODUCTS"), button:has-text("Find products")').first();
    await findButton.scrollIntoViewIfNeeded().catch(() => {});
    await findButton.click({ force: true });

    console.log('Ожидание формирования результатов поиска...');

    // Обязательно переключаем лимит отображения таблицы на 5000 строк согласно правилам проекта
    console.log('Проверяем и переключаем лимит отображения таблицы на 5000 строк...');
    const rowMenuTrigger = page.locator('.tool__row .trigger, .tool__row').first();
    if (await rowMenuTrigger.isVisible({ timeout: 15000 }).catch(() => false)) {
      const currentRowsText = (await rowMenuTrigger.innerText().catch(() => '')).trim();
      if (!currentRowsText.includes('5000 rows')) {
        console.log(`Текущий лимит таблицы: "${currentRowsText}". Переключаем на 5000 rows...`);
        await rowMenuTrigger.click();
        await page.waitForTimeout(500);
        const option5000 = page.locator('#tool-row-menu li[data-value="5000"], .mdc-menu li[data-value="5000"]').first();
        if (await option5000.isVisible({ timeout: 3000 }).catch(() => false)) {
          await option5000.click();
          console.log('Успешно выбран лимит: 5000 строк!');
          await page.waitForTimeout(2500); // Ожидаем перестройки таблицы
        }
      } else {
        console.log('Лимит 5000 строк уже активен.');
      }
    } else {
      console.log('Меню выбора строк (.tool__row) не потребовало переключения (малое количество результатов).');
    }

    // Ожидание стабилизации таблицы (Анти-0 rows экспорт)
    console.log('Ожидание стабилизации данных в таблице Keepa...');
    let tableReady = false;
    for (let waitSec = 0; waitSec < 35; waitSec++) {
      await page.waitForTimeout(1000);
      const state = await page.evaluate(() => {
        const overlay = document.querySelector('.ag-overlay-loading-center, .ag-loading-panel, .ag-loading');
        const rows = document.querySelectorAll('.ag-center-cols-container .ag-row, .ag-row');
        const summary = document.querySelector('.ag-paging-row-summary-panel')?.textContent?.trim() || '';
        const r0 = document.querySelector('.ag-row[row-index="0"]');
        const r0Text = r0 ? (r0.textContent || '').trim() : '';
        const isSkeleton = /^[\s\-0–—_]+$/.test(r0Text) || r0Text.includes('- 0 - -') || r0Text.includes('-0--');
        const hasRealData = r0Text.length > 15 && !isSkeleton;
        return { summary, rowsCount: rows.length, hasOverlay: !!overlay, hasRealData, r0Snippet: r0Text.slice(0, 50) };
      });

      if (state.hasRealData && !state.hasOverlay && state.rowsCount > 0) {
        console.log(`Таблица готова: "${state.summary}" (строк в DOM: ${state.rowsCount}, первый товар: "${state.r0Snippet}")`);
        tableReady = true;
        await page.waitForTimeout(3000);
        break;
      }
    }

    if (!tableReady) {
      console.warn('Предупреждение: Таблица не подтвердила полную стабильность за 35с, пробуем продолжить.');
    }

    // Ожидаем появление кнопки "Export" в верхней панели результатов (.tool__export)
    let foundExport = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      await page.waitForTimeout(1500);

      // Закрываем и удаляем модалки и оверлеи (#popup3 и т.д.)
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        document.querySelectorAll('#popup3, .popup, [id^="popup"]:not(#table-export-dialog), .modal, .ui-widget-overlay').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      }).catch(() => {});

      const exportTrigger = page.locator('#grid-tools-finder .tool__export, .tool__export .trigger, span.tool__export').first();
      if (await exportTrigger.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('Кнопка "Export" найдена в панели таблицы!');
        await exportTrigger.scrollIntoViewIfNeeded().catch(() => {});
        await exportTrigger.click({ force: true });
        foundExport = true;
        await page.waitForTimeout(1500);
        break;
      }
    }

    if (!foundExport) {
      throw new Error(`Кнопка "Export" не появилась. Возможно, у бренда "${brandName}" нет активных товаров в выборке.`);
    }

    // Проверяем текущий процент квоты в интерфейсе Keepa
    const currentQuota = await page.evaluate(() => {
      const el = document.querySelector('#widget__bucket_quota, .bucket-quota__caption, .widget__bucket-quota');
      return el ? el.textContent?.replace(/\s+/g, ' ').trim() : null;
    });
    if (currentQuota) {
      console.log(`Текущая квота токенов Keepa: ${currentQuota}`);
    }

    // В диалоге экспорта активируем радиокнопку All active columns (#allCh-radio)
    const allColumnsRadio = page.locator('#allCh-radio');
    if (await allColumnsRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
      await allColumnsRadio.check({ force: true });
      console.log('Выбрана опция: All active columns (#allCh-radio)');
    }

    // Проверяем, нет ли блокировки из-за квоты в диалоге экспорта
    const quotaWarning = await page.evaluate(() => {
      const dialog = document.querySelector('#table-export-dialog, .ui-dialog, .modal');
      if (!dialog) return null;
      const text = dialog.textContent || '';
      const match = text.match(/(quota|tokens?|limit|insufficient|not enough|wait|refill)[^.\n]*/i);
      const hasExhausted = /exhausted|0%|no tokens|limit reached|exceeded|insufficient/i.test(text);
      return { text: match ? match[0] : null, hasExhausted };
    });

    if (quotaWarning?.hasExhausted) {
      console.error(`\n⚠️ ВНИМАНИЕ: Квота Keepa исчерпана (${currentQuota || '0%'})!`);
      console.error(`Сообщение Keepa: "${quotaWarning.text}"`);
      throw new Error(`Квота Keepa исчерпана (${currentQuota}). Необходимо подождать восстановления токенов.`);
    }

    // Ожидаем скачивание файла через Promise.all
    console.log('Подтверждаем экспорт (All active columns) и ожидаем загрузку файла Excel...');
    const dialogBtn = page.locator('#exportSubmit, button:has-text("Export"), input[value*="EXPORT"]').first();
    await dialogBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      dialogBtn.click({ force: true }),
    ]);

    // Сохраняем файл выгрузки
    fs.mkdirSync(path.dirname(targetOutputFile), { recursive: true });
    await download.saveAs(targetOutputFile);
    console.log(`\n✅ Файл выгрузки каталога бренда успешно сохранен: ${targetOutputFile}`);

    // Обновляем состояние сессии
    await context.storageState({ path: storageStatePath });

  } finally {
    // Гарантированно полностью закрываем браузер ДО фазы импорта в БД
    await browser.close();
    console.log('Браузер Playwright успешно закрыт.');
  }

  console.log(`\nВыгрузка завершена. Файл готов: ${targetOutputFile}`);
}

main().catch((err) => {
  console.error('\n❌ Ошибка выполнения:', err.message);
  process.exit(1);
});
