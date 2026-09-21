/**
 * Скрипт автоматизированной выгрузки товаров категории из Keepa Product Finder через Playwright.
 * Выгружает список товаров категории без расхода API токенов,
 * поддерживает выгрузку по 5000 строк с переходом по страницам пагинации,
 * сохраняет страницы в отдельные файлы с суффиксом _pageN.xlsx и опционально импортирует их в базу данных,
 * рассчитывая точный прирост записей до и после импорта.
 *
 * Использование:
 *   cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts <название_или_id_категории> [--pages N] [--no-parse] [domainId]
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
 * Определение категории в базе данных (только чтение SELECT).
 * Ищет в таблице KeepaAllowedCategory по categoryId или названию.
 */
async function resolveCategory(input: string): Promise<{ categoryName: string; categoryId: string | null }> {
  const trimmed = input.trim();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { categoryName: trimmed, categoryId: null };
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    // 1. Поиск по точному categoryId
    const byId = await prisma.keepaAllowedCategory.findUnique({
      where: { categoryId: trimmed },
    });
    if (byId) {
      return { categoryName: byId.name, categoryId: byId.categoryId };
    }

    // 2. Поиск по названию (регистронезависимо)
    const byName = await prisma.keepaAllowedCategory.findFirst({
      where: {
        name: {
          contains: trimmed,
          mode: 'insensitive',
        },
      },
    });

    if (byName) {
      return { categoryName: byName.name, categoryId: byName.categoryId };
    }

    console.log(`Категория "${trimmed}" не найдена в таблице KeepaAllowedCategory. Поиск будет выполнен по переданному тексту.`);
    return { categoryName: trimmed, categoryId: null };
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

/**
 * Получение текущего количества строк в основных таблицах базы данных (только SELECT).
 */
async function getDatabaseCounts(): Promise<{
  asins: number;
  brands: number;
  manufacturers: number;
  exports: number;
}> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { asins: 0, brands: 0, manufacturers: 0, exports: 0 };
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const [asins, brands, manufacturers, exports] = await Promise.all([
      prisma.aSIN.count(),
      prisma.brand.count(),
      prisma.manufacturer.count(),
      prisma.keepaExport.count(),
    ]);

    return { asins, brands, manufacturers, exports };
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

/**
 * Определение пути к сохраненной сессии браузера Keepa.
 */
function findStorageStatePath(): string {
  const localAuth = path.resolve(__dirname, '../auth/storage_state.json');
  const brandAuth = path.resolve(__dirname, '../../keepa-brand-finder-playwright/auth/storage_state.json');
  const sellerAuth = path.resolve(__dirname, '../../keepa-seller-finder-playwright/auth/storage_state.json');
  const sharedAuth = path.resolve(__dirname, '../../fetch-keepa-viewer/auth/storage_state.json');

  if (fs.existsSync(localAuth)) return localAuth;
  if (fs.existsSync(brandAuth)) return brandAuth;
  if (fs.existsSync(sellerAuth)) return sellerAuth;
  if (fs.existsSync(sharedAuth)) return sharedAuth;

  throw new Error(
    `Файл сохраненной сессии Keepa не найден ни в одном из стандартных путей.\n` +
    'Пожалуйста, выполните вход через скрипт: cd backend && npx tsx ../.agents/skills/keepa-seller-finder-playwright/scripts/save-session.ts'
  );
}

async function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0 || rawArgs.includes('--help') || rawArgs.includes('-h')) {
    console.log('Использование:');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts <категория_или_id> [--pages N] [--no-parse] [domainId]');
    console.log('\nПараметры:');
    console.log('  --pages N     Количество страниц по 5000 строк для выгрузки (по умолчанию: 2, то есть до 10 000 товаров)');
    console.log('  --no-parse    Только скачать файлы Excel, не импортировать в базу данных');
    console.log('\nПримеры:');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts "Jardín"');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts "Jardín" --pages 2');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-category-finder-playwright/scripts/fetch-category-finder.ts 1571259031 --no-parse');
    process.exit(0);
  }

  // Парсинг аргументов
  let maxPages = 2; // По умолчанию выгружаем 2 страницы по 5000 = 10 000 товаров
  const pagesIdx = rawArgs.indexOf('--pages');
  if (pagesIdx !== -1 && rawArgs[pagesIdx + 1]) {
    maxPages = parseInt(rawArgs[pagesIdx + 1], 10) || 2;
  }

  const noParse = rawArgs.includes('--no-parse');
  const filteredArgs = rawArgs.filter((a, idx) => a !== '--no-parse' && a !== '--pages' && rawArgs[idx - 1] !== '--pages');

  const rawParam = filteredArgs[0];
  const domainId = filteredArgs[1] || '4'; // 4 = amazon.es

  // Определяем название и ID категории
  const { categoryName, categoryId } = await resolveCategory(rawParam);
  console.log(`\nЦелевая категория: "${categoryName}" ${categoryId ? `(ID в БД: ${categoryId})` : ''}`);
  console.log(`Запланировано страниц для выгрузки: ${maxPages} (по 5000 строк на страницу)`);

  const safeSlug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const timestamp = Date.now();
  const exportDir = path.resolve(__dirname, '../../../../keepa/exports');
  fs.mkdirSync(exportDir, { recursive: true });

  const storageStatePath = findStorageStatePath();
  console.log(`Используется файл сессии: ${storageStatePath}`);

  // Фиксируем исходное состояние БД перед началом импорта
  let initialCounts = { asins: 0, brands: 0, manufacturers: 0, exports: 0 };
  if (!noParse) {
    initialCounts = await getDatabaseCounts();
    console.log('\n--- ИСХОДНОЕ СОСТОЯНИЕ БАЗЫ ДАННЫХ ДО ИМПОРТА ---');
    console.log(`Всего ASIN в базе:          ${initialCounts.asins}`);
    console.log(`Всего Брендов:              ${initialCounts.brands}`);
    console.log(`Всего Производителей:       ${initialCounts.manufacturers}`);
    console.log(`Всего Записей KeepaExport:  ${initialCounts.exports}`);
    console.log('--------------------------------------------------\n');
  }

  // Запуск браузера Chrome
  console.log('Запуск браузера Chrome для перехода в Keepa Product Finder...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false, // Всегда non-headless для обхода Cloudflare
  });

  const context = await browser.newContext({
    storageState: storageStatePath,
    viewport: { width: 1440, height: 900 },
    locale: 'es-ES',
    acceptDownloads: true,
  });

  const page = await context.newPage();
  const savedFiles: string[] = [];

  try {
    console.log(`Открываем Keepa Product Finder (https://keepa.com/#!finder, domainId: ${domainId})...`);
    await page.goto('https://keepa.com/#!finder', { waitUntil: 'domcontentloaded' });

    // Ожидаем первичной загрузки интерфейса
    await page.waitForTimeout(4000);
    await page.keyboard.press('Escape');

    // Поиск поля фильтра Root category (#autocomplete-rootCategory)
    console.log(`Поиск поля фильтра корневой категории для: "${categoryName}"...`);
    const categoryInput = page.locator('#autocomplete-rootCategory');
    await categoryInput.waitFor({ state: 'visible', timeout: 15000 });
    await categoryInput.scrollIntoViewIfNeeded().catch(() => {});

    // Очищаем и вводим название категории
    await categoryInput.click();
    await categoryInput.fill(categoryName);
    console.log(`Введено значение "${categoryName}" в поле Root category.`);
    await page.waitForTimeout(1000);

    // Проверяем появление выпадающего списка автодополнения (.ui-autocomplete)
    const autocompleteList = page.locator('.ui-autocomplete:visible');
    const hasDropdown = await autocompleteList.isVisible({ timeout: 2500 }).catch(() => false);

    if (hasDropdown) {
      const lowerCat = categoryName.toLowerCase();
      const itemMatch = page.locator(`.ui-autocomplete:visible li:not(:has-text("no match")):not(:has-text("Select all")):has-text("${lowerCat}")`).first();

      if (await itemMatch.isVisible({ timeout: 1500 }).catch(() => false)) {
        const itemText = (await itemMatch.innerText().catch(() => '')).trim();
        console.log(`Выбран вариант из списка: "${itemText}"`);
        await itemMatch.click();
      } else {
        console.log('Точного варианта в автодополнении нет, нажимаем Enter.');
        await page.keyboard.press('Escape');
        await categoryInput.press('Enter');
      }
    } else {
      await categoryInput.press('Enter');
    }

    await page.waitForTimeout(1000);

    // Определяем диапазоны Sales Rank: всегда делим на 2 части (1-25 000 и 25 001-50 000),
    // чтобы обойти лимит Keepa 10 000 строк и забрать 100% товаров категории без потерь
    const rankRanges = [
      { name: 'rank1_10k', label: 'Часть 1: Sales Rank 1 - 10 000', from: '1', to: '10000' },
      { name: 'rank10k_25k', label: 'Часть 2: Sales Rank 10 001 - 25 000', from: '10001', to: '25000' },
      { name: 'rank25k_50k', label: 'Часть 3: Sales Rank 25 001 - 50 000', from: '25001', to: '50000' },
    ];

    for (const rankRange of rankRanges) {
      console.log(`\n=============================================================`);
      console.log(`🚀 СТАРТ ВЫГРУЗКИ: ${rankRange.label}`);
      console.log(`=============================================================`);

      // 1. Переходим в Keepa Product Finder для чистого состояния фильтров
      console.log(`Открываем форму поиска Keepa Product Finder...`);
      await page.goto('https://keepa.com/#!finder', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000);
      await page.keyboard.press('Escape');

      // 2. Ввод категории
      console.log(`Выбор категории: "${categoryName}"...`);
      const categoryInput = page.locator('#autocomplete-rootCategory');
      await categoryInput.waitFor({ state: 'visible', timeout: 20000 });
      await categoryInput.click();
      await categoryInput.fill(categoryName);
      await page.waitForTimeout(1000);

      const autocompleteList = page.locator('.ui-autocomplete:visible');
      const hasDropdown = await autocompleteList.isVisible({ timeout: 2500 }).catch(() => false);
      if (hasDropdown) {
        const lowerCat = categoryName.toLowerCase();
        const itemMatch = page.locator(`.ui-autocomplete:visible li:not(:has-text("no match")):not(:has-text("Select all")):has-text("${lowerCat}")`).first();
        if (await itemMatch.isVisible({ timeout: 1500 }).catch(() => false)) {
          const itemText = (await itemMatch.innerText().catch(() => '')).trim();
          console.log(`Выбран вариант из списка: "${itemText}"`);
          await itemMatch.click();
        } else {
          await page.keyboard.press('Escape');
          await categoryInput.press('Enter');
        }
      } else {
        await categoryInput.press('Enter');
      }

      await page.waitForTimeout(1000);

      // 3. Установка оптовых фильтров
      console.log(`Применяем фильтр Sales Rank: ${rankRange.from} - ${rankRange.to}...`);
      const salesRankFrom = page.locator('#numberFrom-SALES_current');
      if (await salesRankFrom.isVisible({ timeout: 3000 }).catch(() => false)) {
        await salesRankFrom.fill(rankRange.from);
        await page.locator('#numberTo-SALES_current').fill(rankRange.to);
      }

      console.log('Применяем фильтр Buy Box Price: 15 - 100 €...');
      const buyBoxFrom = page.locator('#numberFrom-BUY_BOX_SHIPPING_current');
      if (await buyBoxFrom.isVisible({ timeout: 3000 }).catch(() => false)) {
        await buyBoxFrom.fill('15');
        await page.locator('#numberTo-BUY_BOX_SHIPPING_current').fill('100');
      }

      console.log('Применяем фильтр New Offer Count: 3 - 15...');
      const countNewFrom = page.locator('#numberFrom-COUNT_NEW_current');
      if (await countNewFrom.isVisible({ timeout: 3000 }).catch(() => false)) {
        await countNewFrom.fill('3');
        await page.locator('#numberTo-COUNT_NEW_current').fill('15');
      }

      await page.waitForTimeout(1500);

      // Закрываем оверлеи
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        document.querySelectorAll('#popup3, .popup, [id^="popup"], .modal').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      }).catch(() => {});

      // 4. Клик по кнопке поиска
      console.log('Нажатие кнопки "FIND PRODUCTS"...');
      await page.evaluate(() => {
        const btn = document.querySelector('#filterSubmit') as HTMLElement;
        if (btn) btn.click();
      });

      console.log('Ожидание перехода к таблице результатов поиска...');
      await page.waitForFunction(() => {
        return window.location.hash.includes('finder/') || !!document.querySelector('#grid-tools-finder, .tool__row');
      }, { timeout: 35000 });

      await page.waitForTimeout(3000);

      // 5. Ожидаем появления первичных строк данных в таблице
      console.log('Ожидаем появления строк результатов в таблице...');
      await page.waitForSelector('.ag-center-cols-container .ag-row', { timeout: 35000 });

      // Закрываем любые всплывающие баннеры и оверлеи (#popup3, popup) перед кликом на тулбар
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        document.querySelectorAll('#popup3, .popup, [id^="popup"], .modal, .ui-widget-overlay').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      }).catch(() => {});

      // 6. Переключаем режим на 5000 строк
      console.log('Открываем меню строк и переключаем режим на 5000 строк...');
      const rowMenuTrigger = page.locator('.tool__row .trigger, .tool__row').first();
      await rowMenuTrigger.click({ force: true });
      await page.waitForTimeout(500);
      await page.locator('#tool-row-menu li[data-value="5000"], .mdc-menu li[data-value="5000"]').first().click({ force: true });

      // Ожидаем стабилизации и загрузки строк
      console.log('Ожидание стабилизации и заполнения 5000 строк реальными данными...');
      let tableReady = false;
      for (let waitSec = 0; waitSec < 35; waitSec++) {
        await page.waitForTimeout(1000);
        const state = await page.evaluate(() => {
          const summary = document.querySelector('.ag-paging-row-summary-panel')?.textContent?.trim();
          const rows = document.querySelectorAll('.ag-center-cols-container .ag-row');
          const overlay = document.querySelector('.ag-overlay-loading-center, .loading, .busy');
          const r0 = rows[0] as HTMLElement;
          const r0Text = r0 ? r0.innerText.replace(/\s+/g, ' ').trim() : '';
          const isSkeleton = /^[\s\-0–—_]+$/.test(r0Text) || r0Text.includes('- 0 - -') || r0Text.includes('-0--');
          const hasRealData = r0Text.length > 15 && !isSkeleton;

          return { summary, rowsCount: rows.length, hasOverlay: !!overlay, hasRealData, r0Snippet: r0Text.slice(0, 50) };
        });

        if (state.hasRealData && !state.hasOverlay && state.rowsCount > 0) {
          console.log(`Таблица ${rankRange.name} готова: "${state.summary}" (секунда ${waitSec + 1}, товар: "${state.r0Snippet}")`);
          tableReady = true;
          await page.waitForTimeout(3000);
          break;
        }
      }

      if (!tableReady) {
        console.warn('Предупреждение: Таблица не подтвердила статус готовности за 35с, продолжаем с текущим состоянием.');
      }

      // 7. Пагинация по страницам текущего диапазона (максимум 2 страницы по 5000 строк)
      for (let currentPage = 1; currentPage <= maxPages; currentPage++) {
        const pageSummary = await page.locator('.ag-paging-row-summary-panel').innerText().catch(() => `Страница ${currentPage}`);
        console.log(`\n[${rankRange.name}] Страница ${currentPage}: ${pageSummary}`);

        // Кликаем по кнопке Export
        let exportClicked = false;
        for (let attempt = 0; attempt < 15; attempt++) {
          await page.waitForTimeout(1000);
          await page.keyboard.press('Escape');

          const exportTrigger = page.locator('#grid-tools-finder .tool__export, .tool__export .trigger, span.tool__export').first();
          if (await exportTrigger.isVisible({ timeout: 1000 }).catch(() => false)) {
            await exportTrigger.scrollIntoViewIfNeeded().catch(() => {});
            await exportTrigger.click({ force: true });
            exportClicked = true;
            await page.waitForTimeout(1500);
            break;
          }
        }

        if (!exportClicked) {
          console.error(`Кнопка Export не найдена на странице ${currentPage} диапазона ${rankRange.name}. Пропускаем.`);
          break;
        }

        // 1. Проверяем текущий процент квоты в тулбаре Keepa
        const currentQuota = await page.evaluate(() => {
          const el = document.querySelector('#widget__bucket_quota, .bucket-quota__caption, .widget__bucket-quota');
          return el ? el.textContent?.replace(/\s+/g, ' ').trim() : null;
        });
        if (currentQuota) {
          console.log(`Текущая квота Keepa: ${currentQuota}`);
        }

        // 2. В диалоге экспорта активируем радиокнопку All active columns
        const allColumnsRadio = page.locator('#allCh-radio');
        if (await allColumnsRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
          await allColumnsRadio.check({ force: true });
        }

        // 3. Проверяем, нет ли предупреждения о нехватке квоты внутри самого диалогового окна экспорта
        const quotaWarning = await page.evaluate(() => {
          const dialog = document.querySelector('#table-export-dialog, .ui-dialog, .modal');
          if (!dialog) return null;
          const text = dialog.textContent || '';
          const match = text.match(/(quota|tokens?|limit|insufficient|not enough|wait|refill)[^.\n]*/i);
          // Если на кнопке или рядом написано о нехватке токенов
          const hasExhausted = /exhausted|0%|no tokens|limit reached|exceeded|insufficient/i.test(text);
          return { text: match ? match[0] : null, hasExhausted };
        });

        if (quotaWarning?.hasExhausted) {
          console.error(`\n⚠️ ВНИМАНИЕ: Квота Keepa исчерпана (${currentQuota || '0%'})!`);
          console.error(`Сообщение Keepa: "${quotaWarning.text}"`);
          console.error(`Дальнейший экспорт невозможен. Необходимо подождать восстановления квоты (квота пополняется поминутно).\n`);
          throw new Error(`Квота Keepa исчерпана (${currentQuota}). Необходимо подождать восстановления токенов.`);
        }

        // 4. Нажимаем кнопку Export в модальном окне и ожидаем скачивание через Promise.all
        const dialogBtn = page.locator('#exportSubmit, button:has-text("Export"), input[value*="EXPORT"]').first();
        await dialogBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
        
        console.log(`Подтверждаем экспорт (${rankRange.name}, стр. ${currentPage})...`);
        try {
          const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 60000 }),
            dialogBtn.click({ force: true }),
          ]);

          const pageFileName = path.join(
            exportDir,
            `category_${safeSlug}_${timestamp}_${rankRange.name}_page${currentPage}.xlsx`
          );

          await download.saveAs(pageFileName);
          savedFiles.push(pageFileName);
          console.log(`✅ Файл сохранен: ${pageFileName}`);
          await page.waitForTimeout(2000);
        } catch (downloadErr: any) {
          // Проверяем, не закрылся ли диалог из-за нехватки квоты
          const latestQuota = await page.evaluate(() => {
            const el = document.querySelector('#widget__bucket_quota, .bucket-quota__caption, .widget__bucket-quota');
            return el ? el.textContent?.replace(/\s+/g, ' ').trim() : 'неизвестно';
          }).catch(() => 'неизвестно');

          console.error(`\n⚠️ Ошибка при скачивании файла: ${downloadErr.message}`);
          console.error(`Текущая квота Keepa: ${latestQuota}`);
          console.error(`Если квота упала до нуля или заблокирована, Keepa отклоняет экспорт. Необходимо подождать несколько минут для пополнения пула токенов.`);
          throw new Error(`Экспорт отклонен Keepa. Текущая квота: ${latestQuota}. Пожалуйста, подождите восстановления квоты.`);
        }

        // Проверяем возможность перехода на следующую страницу (кнопка Next)
        if (currentPage < maxPages) {
          const nextButton = page.locator('div[ref="btNext"], .ag-paging-button[ref="btNext"]');
          const isNextDisabled = await nextButton.evaluate((el) => el.classList.contains('ag-disabled')).catch(() => true);

          if (isNextDisabled) {
            console.log(`Кнопка Next отключена. Достигнут конец результатов диапазона ${rankRange.name}.`);
            break;
          }

          // Запоминаем текст первой строки текущей страницы перед кликом Next
          const prevFirstRowText = await page.evaluate(() => {
            const r0 = document.querySelector('.ag-center-cols-container .ag-row') as HTMLElement;
            return r0 ? r0.innerText.replace(/\s+/g, ' ').trim() : '';
          });

          console.log(`Переход на страницу ${currentPage + 1} (${rankRange.name})...`);
          await nextButton.click();

          // Ожидаем заполнения новыми товарами
          let pageLoaded = false;
          for (let waitSec = 0; waitSec < 35; waitSec++) {
            await page.waitForTimeout(1000);
            const nextState = await page.evaluate((prevText) => {
              const summary = document.querySelector('.ag-paging-row-summary-panel')?.textContent?.trim();
              const rows = document.querySelectorAll('.ag-center-cols-container .ag-row');
              const overlay = document.querySelector('.ag-overlay-loading-center, .loading, .busy');
              const r0 = rows[0] as HTMLElement;
              const r0Text = r0 ? r0.innerText.replace(/\s+/g, ' ').trim() : '';
              const isSkeleton = /^[\s\-0–—_]+$/.test(r0Text) || r0Text.includes('- 0 - -') || r0Text.includes('-0--');
              const hasRealData = r0Text.length > 15 && !isSkeleton && r0Text !== prevText;

              return {
                summary,
                rowsCount: rows.length,
                hasOverlay: !!overlay,
                r0Snippet: r0Text.slice(0, 60),
                hasRealData,
                isSkeleton,
              };
            }, prevFirstRowText);

            if (nextState.hasRealData && !nextState.hasOverlay && nextState.rowsCount > 0) {
              console.log(`Страница ${currentPage + 1} успешно загружена: "${nextState.summary}" (секунда ${waitSec + 1}, товар: "${nextState.r0Snippet}")`);
              pageLoaded = true;
              await page.waitForTimeout(5000); // Обязательная пауза 5с для стабилизации буфера AG-Grid
              break;
            } else {
              if (waitSec % 5 === 0) {
                console.log(`[Ожидание данных стр. ${currentPage + 1}] Секунда ${waitSec + 1}: skeleton=${nextState.isSkeleton}, overlay=${nextState.hasOverlay}`);
              }
            }
          }

          if (!pageLoaded) {
            console.warn(`Внимание: Страница ${currentPage + 1} диапазона ${rankRange.name} не подтвердила готовность за 35с, выдерживаем паузу 5с.`);
            await page.waitForTimeout(5000);
          }
        }
      }
    }

    // Обновляем состояние сессии
    await context.storageState({ path: storageStatePath });

  } finally {
    await browser.close();
  }

  console.log(`\nВсего выгружено файлов: ${savedFiles.length}`);

  // Если флаг --no-parse не передан, последовательно парсим все сохраненные файлы в БД
  if (!noParse && savedFiles.length > 0) {
    console.log('\n=============================================================');
    console.log('Запуск автоматического импорта всех выгруженных страниц в базу данных...');
    console.log('=============================================================\n');

    const parseScriptPath = path.join(backendDir, 'scripts/parse-keepa.ts');
    for (let i = 0; i < savedFiles.length; i++) {
      const filePath = savedFiles[i];
      console.log(`\n[Импорт ${i + 1}/${savedFiles.length}] Обработка файла: ${filePath}...`);
      try {
        execSync(`npx tsx "${parseScriptPath}" "${filePath}"`, {
          cwd: backendDir,
          stdio: 'inherit',
          env: process.env,
        });
      } catch (parseErr: any) {
        console.error(`Ошибка при парсинге файла ${filePath}:`, parseErr.message);
      }
    }

    // Вычисляем итоговое состояние базы данных и прирост записей
    const finalCounts = await getDatabaseCounts();
    const diffAsins = finalCounts.asins - initialCounts.asins;
    const diffBrands = finalCounts.brands - initialCounts.brands;
    const diffManufacturers = finalCounts.manufacturers - initialCounts.manufacturers;
    const diffExports = finalCounts.exports - initialCounts.exports;

    console.log('\n=============================================================');
    console.log('📊 ИТОГОВЫЙ ОТЧЕТ ОБ ИМПОРТЕ В БАЗУ ДАННЫХ (СРАВНЕНИЕ ДО И ПОСЛЕ)');
    console.log('=============================================================');
    console.log(`• Новых ASIN добавлено:        +${diffAsins} (было: ${initialCounts.asins} → стало: ${finalCounts.asins})`);
    console.log(`• Новых Брендов добавлено:     +${diffBrands} (было: ${initialCounts.brands} → стало: ${finalCounts.brands})`);
    console.log(`• Новых Производителей:        +${diffManufacturers} (было: ${initialCounts.manufacturers} → стало: ${finalCounts.manufacturers})`);
    console.log(`• Создано записей KeepaExport: +${diffExports} (было: ${initialCounts.exports} → стало: ${finalCounts.exports})`);
    console.log('=============================================================\n');
  } else if (noParse) {
    console.log('\nФлаг --no-parse активен. Импорт в базу данных пропущен.');
    console.log('Выгруженные файлы:');
    savedFiles.forEach((f) => console.log(`  - ${f}`));
  }
}

main().catch((err) => {
  console.error('\n❌ Ошибка выполнения:', err.message);
  process.exit(1);
});
