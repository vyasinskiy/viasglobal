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
 * Нормализация и поиск бренда или производителя в базе данных (только чтение SELECT).
 * Если передан ID (число) или точное/частичное название.
 */
async function resolveEntity(
  input: string,
  isManufacturer: boolean
): Promise<{ entityName: string; entityId: number | null }> {
  const trimmed = input.trim();
  const numericId = parseInt(trimmed, 10);
  const isNumeric = !isNaN(numericId) && numericId.toString() === trimmed;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return { entityName: trimmed, entityId: isNumeric ? numericId : null };
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const entityType = isManufacturer ? 'производителя' : 'бренда';

  try {
    if (isNumeric) {
      if (isManufacturer) {
        const m = await prisma.manufacturer.findUnique({
          where: { id: numericId },
          select: { id: true, name: true },
        });
        if (m) return { entityName: m.name, entityId: m.id };
      } else {
        const brand = await prisma.brand.findUnique({
          where: { id: numericId },
          select: { id: true, name: true },
        });
        if (brand) return { entityName: brand.name, entityId: brand.id };
      }
    }

    console.log(`Поиск ${entityType} в базе данных по запросу: "${trimmed}"...`);
    if (isManufacturer) {
      const records = await prisma.manufacturer.findMany({
        where: { name: { contains: trimmed, mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 5,
      });
      if (records.length === 0) {
        console.log(`Производитель "${trimmed}" не найден в локальной БД. Будет выполнен прямой поиск в Keepa.`);
        return { entityName: trimmed, entityId: null };
      }
      return { entityName: records[0].name, entityId: records[0].id };
    } else {
      const brands = await prisma.brand.findMany({
        where: { name: { contains: trimmed, mode: 'insensitive' } },
        select: { id: true, name: true },
        take: 5,
      });
      if (brands.length === 0) {
        console.log(`Бренд "${trimmed}" не найден в локальной БД. Будет выполнен прямой поиск в Keepa.`);
        return { entityName: trimmed, entityId: null };
      }
      return { entityName: brands[0].name, entityId: brands[0].id };
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
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
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts <название_или_id> [--manufacturer] [--regex] [--no-parse] [output.xlsx] [domainId]');
    console.log('\nПараметры:');
    console.log('  --manufacturer, -m   Искать по полю Manufacturer вместо Brand');
    console.log('  --regex, -r          Использовать режим регулярных выражений (префикс regex:)');
    console.log('  --no-parse           Не запускать автоматический парсинг после выгрузки');
    console.log('\nПримеры:');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "NWOUIIAY"');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "COFAN" --manufacturer');
    console.log('  cd backend && npx tsx ../.agents/skills/keepa-brand-finder-playwright/scripts/fetch-brand-finder.ts "ALFA DYSER.*" --manufacturer --regex');
    process.exit(0);
  }

  const isManufacturer = args.includes('--manufacturer') || args.includes('-m');
  const isRegex = args.includes('--regex') || args.includes('-r');
  const noParse = args.includes('--no-parse');
  const filteredArgs = args.filter((a) => a !== '--no-parse' && a !== '--manufacturer' && a !== '-m' && a !== '--regex' && a !== '-r');

  const rawEntityParam = filteredArgs[0];

  // Определяем название и ID сущности (бренда или производителя)
  const { entityName, entityId } = await resolveEntity(rawEntityParam, isManufacturer);
  const entityLabel = isManufacturer ? 'производитель' : 'бренд';
  console.log(`\nЦелевой ${entityLabel}: "${entityName}" ${entityId ? `(ID в БД: ${entityId})` : ''} ${isRegex ? '[Режим RegEx]' : ''}`);

  // Формируем безопасное имя файла
  const safeSlug = entityName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const prefix = isManufacturer ? 'manufacturer' : 'brand';
  const defaultOutputFile = path.resolve(
    __dirname,
    `../../../../keepa/exports/${prefix}_${safeSlug}_${Date.now()}.xlsx`
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

    // Определяем целевой инпут: Brand (#autocomplete-brand) или Manufacturer (#autocomplete-manufacturer)
    const inputSelector = isManufacturer ? '#autocomplete-manufacturer' : '#autocomplete-brand';
    const fieldName = isManufacturer ? 'Manufacturer' : 'Brand';

    console.log(`Поиск поля фильтра ${fieldName} для: "${entityName}"...`);
    const targetInput = page.locator(inputSelector);
    await targetInput.waitFor({ state: 'visible', timeout: 15000 });
    await targetInput.scrollIntoViewIfNeeded().catch(() => {});

    // Если включен режим RegEx (или запрос уже содержит regex:)
    if (isRegex || entityName.startsWith('regex:')) {
      const regexQuery = entityName.startsWith('regex:') ? entityName : `regex:${entityName}`;
      console.log(`Применяем регулярное выражение: "${regexQuery}" в поле ${fieldName}...`);
      await targetInput.click();
      await targetInput.fill(regexQuery);
      await page.waitForTimeout(1000);
      // В Keepa для фиксации regex нажимаем Enter
      await targetInput.press('Enter');
      console.log(`RegEx фильтр "${regexQuery}" успешно зафиксирован в Keepa.`);
    } else {
      // Стандартный режим ввода (с поддержкой выбора всех вариантов и множественных тегов)
      await targetInput.click();
      await targetInput.fill(entityName);
      console.log(`Введено значение "${entityName}" в поле ${fieldName}.`);
      await page.waitForTimeout(1500);

      // Проверяем появление выпадающего списка автодополнения (.ui-autocomplete)
      const autocompleteList = page.locator('.ui-autocomplete:visible');
      const hasDropdown = await autocompleteList.isVisible({ timeout: 2500 }).catch(() => false);

      if (hasDropdown) {
        // 1. Проверяем наличие опции "Select all" (Keepa предлагает выбрать сразу ВСЕ вариации, например COFAN + COFAN (COFB0))
        const selectAllItem = page.locator('.ui-autocomplete:visible li.ui-item-select-all, .ui-autocomplete:visible li:has-text("Select all")').first();
        const hasSelectAll = await selectAllItem.isVisible({ timeout: 1500 }).catch(() => false);

        if (hasSelectAll) {
          console.log('Найдена опция "Select all" в автодополнении Keepa! Выбираем ВСЕ вариации для исключения потерь товаров...');
          await selectAllItem.click();
        } else {
          // 2. Если "Select all" нет, проверяем подходящие варианты (исключая "no match")
          const lowerQuery = entityName.toLowerCase();
          const itemMatch = page.locator(`.ui-autocomplete:visible li:not(:has-text("no match")):has-text("${lowerQuery}")`).first();

          if (await itemMatch.isVisible({ timeout: 1500 }).catch(() => false)) {
            const itemText = (await itemMatch.innerText().catch(() => '')).trim();
            console.log(`Выбран вариант из списка: "${itemText}"`);
            await itemMatch.click();
          } else {
            console.log('Подходящих вариантов в автодополнении нет, нажимаем Enter (поиск по точному тексту).');
            await targetInput.press('Enter');
          }
        }
      } else {
        console.log('Автодополнение не появилось, нажимаем Enter.');
        await targetInput.press('Enter');
      }
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
    await page.waitForFunction(() => {
      const summary = document.querySelector('.ag-paging-row-summary-panel')?.textContent?.trim();
      return !!summary && summary.includes('of');
    }, { timeout: 45000 }).catch(() => {});

    // Устанавливаем фильтр отображения на 5000 строк (максимум для одной страницы Keepa Finder),
    // чтобы экспорт гарантированно содержал полный каталог до 5000 товаров, а не стандартные 100
    console.log('Проверяем и переключаем лимит отображения таблицы на 5000 строк...');
    const currentLimit = await page.evaluate(() => {
      const trigger = document.querySelector('#grid-tools-finder .tool__row, .tool__row') as HTMLElement;
      if (!trigger) return '';
      // Берем только первую строку текста (например "100 rows"), игнорируя пункты выпадающего списка в DOM
      const rawText = trigger.innerText || trigger.textContent || '';
      return rawText.split(/[\n\r]+/)[0].trim();
    });

    console.log(`Текущий активный лимит таблицы: "${currentLimit}".`);

    if (!currentLimit.startsWith('5000')) {
      console.log(`Переключаем лимит таблицы на 5000 строк через DOM-клик...`);
      await page.evaluate(() => {
        const trigger = document.querySelector('#grid-tools-finder .tool__row, .tool__row') as HTMLElement;
        if (trigger) trigger.click();
      });
      await page.waitForTimeout(1000);

      const switched = await page.evaluate(() => {
        const option = (document.querySelector('li.ctl-menu__item[data-value="5000"]') ||
                        document.querySelector('li[data-value="5000"]') ||
                        document.querySelector('#tool-row-menu li[data-value="5000"]')) as HTMLElement;
        if (option) {
          option.click();
          return true;
        }
        return false;
      });

      if (switched) {
        console.log('Успешно кликнута опция: 5000 строк!');
      } else {
        console.warn('Опция 5000 строк не найдена в выпадающем меню.');
      }
    } else {
      console.log('Лимит 5000 строк уже активен.');
    }

    // Ожидание стабилизации таблицы (отслеживаем индикатор прогресса Keepa и заполнение ag-row)
    console.log('Ожидание стабилизации данных в таблице Keepa...');
    let tableReady = false;
    for (let waitSec = 0; waitSec < 60; waitSec++) {
      await page.waitForTimeout(1000);
      const state = await page.evaluate(() => {
        const rows = document.querySelectorAll('.ag-center-cols-container .ag-row').length;
        const summary = document.querySelector('.ag-paging-row-summary-panel')?.textContent?.trim() || '';
        const pageDescr = document.querySelector('.ag-paging-page-summary-panel')?.textContent?.trim() || '';
        const bodyText = document.body.innerText;
        const progressMatch = bodyText.match(/(\d+\s*%\s*\n*\s*\d+\s*\/\s*\d+)/);

        // Проверяем общее число товаров из summary (например "1 to 100 of 1,783" -> total = 1783)
        const totalMatch = summary.match(/of\s+([\d,]+)/i);
        const totalCount = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) : 0;
        const isStill100 = totalCount > 100 && (summary.startsWith('1 to 100 of') || summary.startsWith('1 - 100 of'));

        return {
          rows,
          summary,
          pageDescr,
          progress: progressMatch ? progressMatch[0].replace(/\s+/g, ' ') : null,
          totalCount,
          isStill100,
        };
      });

      if (waitSec % 5 === 0 || state.progress) {
        console.log(`[Секунда ${waitSec + 1}] Строк: ${state.rows}, Summary: "${state.summary}", Прогресс: "${state.progress || 'готов'}"`);
      }

      // Таблица готова, если есть строки в DOM, нет индикатора прогресса, страница не Page 0 и применился лимит 5000 (не висит старый срез 100 строк)
      if (state.rows > 0 && !state.progress && state.pageDescr && !state.pageDescr.includes('Page 0') && !state.isStill100) {
        console.log(`Таблица готова: "${state.summary}" (строк в DOM: ${state.rows})`);
        tableReady = true;
        await page.waitForTimeout(2000);
        break;
      }
    }

    if (!tableReady) {
      console.warn('Предупреждение: Таблица не подтвердила полную стабильность за 60с, пробуем продолжить.');
    }

    // Ожидаем появление кнопки "Export" в верхней панели результатов (.tool__export)
    let foundExport = false;
    for (let attempt = 0; attempt < 25; attempt++) {
      await page.waitForTimeout(1000);

      const exportTrigger = page.locator('#grid-tools-finder .tool__export, .tool__export .trigger, span.tool__export, .tool__export').first();
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
      throw new Error(`Кнопка "Export" не появилась. Возможно, у ${entityLabel} "${entityName}" нет активных товаров в выборке.`);
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

  // Проверка подозрительного равенства размера выборки лимиту пагинации (100 или 5000 строк)
  const xlsxModule = requireBackendModule('xlsx');
  const workbook = xlsxModule.readFile(targetOutputFile, { sheetRows: 5005 });
  const firstSheetName = workbook.SheetNames[0];
  const sheetData = xlsxModule.utils.sheet_to_json(workbook.Sheets[firstSheetName]);
  const itemsCount = sheetData.length;

  console.log(`\nПроверка размера выгрузки: найдено ${itemsCount} товаров.`);
  if (itemsCount === 100) {
    console.warn('\n⚠️ ВНИМАНИЕ: Количество товаров в выгрузке ровно 100!');
    console.warn('Это подозрительно и указывает на техническую ошибку: лимит пагинации таблицы не переключился на 5000 строк, и выгрузилась только первая страница.');
  } else if (itemsCount === 5000) {
    console.warn('\n⚠️ ВНИМАНИЕ: Количество товаров в выгрузке достигло максимального потолка Keepa (5000 строк)!');
    console.warn('Каталог бренда превышает лимит одной выборки. Для полного охвата рекомендуется разбивка по диапазонам BSR.');
  }

  // Автоматический парсинг в базу данных, если не указан флаг --no-parse
  if (!noParse) {
    console.log('\n=============================================================');
    console.log('Запуск автоматического сохранения выгрузки в базу данных...');
    console.log('=============================================================\n');

    const parseScriptPath = path.join(backendDir, 'scripts/parse-keepa.ts');
    try {
      execSync(`npx tsx "${parseScriptPath}" "${targetOutputFile}"`, {
        cwd: backendDir,
        stdio: 'inherit',
        env: process.env,
      });
      console.log('\n Данные каталога бренда успешно сохранены в базе данных!');
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
