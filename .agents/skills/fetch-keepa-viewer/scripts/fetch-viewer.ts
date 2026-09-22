/**
 * Автоматическая выгрузка списка EAN через Keepa Product Viewer с использованием сохраненной сессии.
 * Аргументы командной строки:
 *   1: путь к файлу со списком EAN (или ASIN) через перенос строки
 *   2: путь, куда сохранить выгруженный .xlsx файл
 *   3 (опционально): ID маркетплейса (по умолчанию 4 = amazon.es)
 */
import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const eansFile = process.argv[2];
  const outputFile = process.argv[3];
  const domainId = process.argv[4] || '4'; // 4 = amazon.es

  if (!eansFile || !outputFile) {
    console.error('Использование: npx tsx fetch-viewer.ts <путь_к_eans.txt> <путь_к_output.xlsx> [domainId]');
    process.exit(1);
  }

  const resolvedEansPath = path.resolve(process.cwd(), eansFile);
  const resolvedOutputPath = path.resolve(process.cwd(), outputFile);
  // Поиск файла сессии в известных локациях
  const possibleAuthPaths = [
    path.resolve(__dirname, '../auth/storage_state.json'),
    path.resolve(__dirname, '../../keepa-seller-finder-playwright/auth/storage_state.json'),
    path.resolve(__dirname, '../../keepa-brand-finder-playwright/auth/storage_state.json'),
  ];
  const storageStatePath = possibleAuthPaths.find((p) => fs.existsSync(p));

  if (!storageStatePath) {
    console.error('Файл сохраненной сессии не найден ни в одной из папок:');
    possibleAuthPaths.forEach((p) => console.error(` - ${p}`));
    console.error('Сначала запустите скрипт авторизации: npx tsx save-session.ts');
    process.exit(1);
  }

  if (!fs.existsSync(resolvedEansPath)) {
    console.error(`Файл со списком EAN не найден: ${resolvedEansPath}`);
    process.exit(1);
  }

  const rawCodes = fs.readFileSync(resolvedEansPath, 'utf-8');
  const codes = rawCodes.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  console.log(`Загружено кодов для выгрузки: ${codes.length}`);

  // Запуск браузера с сохраненной сессией
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false, // Оставляем видимым, чтобы не блочился Cloudflare
  });

  const context = await browser.newContext({
    storageState: storageStatePath,
    viewport: { width: 1400, height: 900 },
    locale: 'es-ES',
    acceptDownloads: true,
  });

  const page = await context.newPage();
  console.log(`Переход в Keepa Viewer (домен ${domainId})...`);
  await page.goto(`https://keepa.com/#!viewer`, { waitUntil: 'domcontentloaded' });

  // Ждем загрузки интерфейса Keepa
  await page.waitForTimeout(3000);

  // Переключаемся на вкладку UPC / EAN / GTIN, если вставляем штрихкоды
  const isEanOrUpc = codes.some((code) => /^\d{12,14}$/.test(code));
  if (isEanOrUpc) {
    console.log('Обнаружены штрихкоды EAN/UPC. Ищем кнопку "UPC / EAN / GTIN"...');
    await page.waitForSelector('button.viewer-import__pill:has-text("UPC / EAN / GTIN")', { timeout: 15000 });
    const eanBtn = page.locator('button.viewer-import__pill:has-text("UPC / EAN / GTIN")').first();
    await eanBtn.click();
    console.log('Кликнули по вкладке UPC / EAN / GTIN, ждем обновления формы...');
    await page.waitForTimeout(1500);
  }

  // Ищем поле ввода кодов (textarea)
  console.log('Поиск поля ввода кодов...');
  await page.waitForSelector('textarea', { timeout: 15000 });
  const textarea = page.locator('textarea').first();
  await textarea.fill(codes.join('\n'));
  console.log(`Вставлено ${codes.length} кодов в поле Keepa Viewer!`);

  // Кликаем по синей кнопке загрузки списка LOAD LIST
  console.log('Кликаем синюю кнопку "LOAD LIST"...');
  const loadButton = page.locator('button.button--primary:has-text("LOAD LIST"), button:has-text("LOAD LIST")').first();
  await loadButton.click();

  console.log('Ожидание формирования таблицы с товарами...');
  
  // Ждем пока таблица товаров начнет загружаться (до 60 секунд)
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(2000);

    // Если появилось модальное окно "Search result" — закрываем его (крестик или клавиша Escape)
    const hasModal = await page.locator('text="Search result"').isVisible().catch(() => false);
    if (hasModal) {
      console.log('Обнаружено модальное окно "Search result". Нажимаем Escape для закрытия...');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
      
      // На случай если Escape не закрыл — кликаем по оранжево-красному крестику в правом верхнем углу окна
      const closeIcon = page.locator('div:has-text("Search result") i, .fa-times, .fa-times-circle, div[style*="border-radius: 50%"]').last();
      if (await closeIcon.isVisible().catch(() => false)) {
        await closeIcon.click().catch(() => {});
      }
    }

    // Проверяем наличие кнопки Export в верхнем тулбаре (рядом с "Import List", "Configure Columns")
    const exportElements = await page.locator(':is(span, div, button, a):has-text("Export")').all();
    let foundExport = null;
    for (const el of exportElements) {
      const txt = (await el.innerText().catch(() => '')).trim();
      if (txt === 'Export' && await el.isVisible().catch(() => false)) {
        foundExport = el;
        break;
      }
    }

    if (foundExport) {
      console.log('Кнопка "Export" найдена в тулбаре!');

      // Скрываем блокирующие всплывающие окна и оверлеи Keepa (#popup3 и т.д.)
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        document.querySelectorAll('#popup3, .popup, [id^="popup"]:not(#table-export-dialog), .modal, .ui-widget-overlay').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      }).catch(() => {});

      await foundExport.click({ force: true });
      await page.waitForTimeout(1500);
      break;
    }
  }

  // В диалоге экспорта активируем радиокнопку All active columns (#allCh-radio)
  const allColumnsRadio = page.locator('#allCh-radio');
  if (await allColumnsRadio.isVisible({ timeout: 5000 }).catch(() => false)) {
    await allColumnsRadio.check({ force: true });
    console.log('Выбрана опция: All active columns (#allCh-radio)');
  }

  // Ожидаем скачивание при нажатии на экспорт
  console.log('Подтверждаем экспорт файла Excel...');
  const dialogBtn = page.locator('#exportSubmit, button:has-text("EXPORT"), input[value*="EXPORT"], .button--primary:has-text("EXPORT")').first();
  await dialogBtn.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60000 }),
    dialogBtn.click({ force: true }),
  ]);

  // Сохраняем файл
  fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
  await download.saveAs(resolvedOutputPath);
  console.log(`Файл успешно сохранен: ${resolvedOutputPath}`);

  // Обновляем сессию на случай обновления токенов
  await context.storageState({ path: storageStatePath });

  await browser.close();
  console.log('Готово!');
}

main().catch((err) => {
  console.error('Ошибка в процессе выгрузки:', err);
  process.exit(1);
});
