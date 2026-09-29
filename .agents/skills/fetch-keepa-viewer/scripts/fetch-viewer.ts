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

/**
 * Извлекает EAN-коды из текста диалога Keepa о ненайденных товарах.
 * Keepa показывает диалог с текстом вроде:
 * "The following codes could not be found: 8412688065790, 8412688486472..."
 */
function extractEansFromDialog(dialogText: string): string[] {
  const eans: string[] = [];
  // Ищем все 12-14 значные числа в тексте
  const matches = dialogText.match(/\b\d{12,14}\b/g);
  if (matches) {
    for (const m of matches) {
      eans.push(m);
    }
  }
  return eans;
}

/**
 * Закрывает блокирующие диалоги Keepa (ненайденные EAN, Search result).
 * Возвращает список извлеченных EAN из диалога "ненайденные коды", если такой был.
 */
async function closeBlockingDialogs(page: any): Promise<string[]> {
  const notFoundEans: string[] = [];

  const result = await page.evaluate(() => {
    const dialogs = Array.from(document.querySelectorAll('.ui-dialog, .modal, [role="dialog"]'));
    let foundEansText = '';
    let closed = false;

    for (const dialog of dialogs) {
      const text = dialog.textContent || '';

      // Диалог с ненайденными кодами: "could not be found", "not found", "failed to load"
      if (
        text.includes('could not be found') ||
        text.includes('not found') ||
        text.includes('failed to load') ||
        text.includes('Search result')
      ) {
        foundEansText = text;

        // Закрываем диалог: ищем кнопку OK, Close, крестик
        const closeBtn = dialog.querySelector(
          'button, input[type="button"], i, img, [class*="close"], [class*="times"], .ui-dialog-titlebar-close'
        ) as HTMLElement;
        if (closeBtn) {
          closeBtn.click();
        } else {
          // Последняя надежда — удалить DOM-элемент
          dialog.remove();
        }
        closed = true;
      }
    }

    return { closed, text: foundEansText };
  });

  if (result.closed && result.text) {
    const eans = extractEansFromDialog(result.text);
    if (eans.length > 0) {
      console.log(`Обнаружен диалог с ${eans.length} ненайденными EAN кодами, диалог закрыт.`);
      notFoundEans.push(...eans);
    } else {
      console.log('Блокирующий диалог обнаружен и закрыт (EAN не извлечены из текста).');
    }
  }

  return notFoundEans;
}

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

  // Все ненайденные EAN, собранные на разных этапах
  const allNotFoundEans: Set<string> = new Set();

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
  let exportClicked = false;
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(2000);

    // Закрываем блокирующие диалоги (ненайденные EAN, Search result)
    const notFoundEans = await closeBlockingDialogs(page);
    notFoundEans.forEach((ean) => allNotFoundEans.add(ean));

    // Проверяем наличие кнопки Export в верхнем тулбаре
    const isExportVisible = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('span, div, button, a'));
      const btn = els.find(e => e.textContent?.trim() === 'Export' && !e.textContent.includes('Configure'));
      return !!btn;
    });

    if (isExportVisible) {
      console.log('Кнопка "Export" найдена в тулбаре!');

      // Скрываем блокирующие всплывающие окна и оверлеи Keepa (#popup3 и т.д.)
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        document.querySelectorAll('#popup3, .popup, [id^="popup"]:not(#table-export-dialog), .ui-widget-overlay').forEach((el) => {
          (el as HTMLElement).style.display = 'none';
        });
      }).catch(() => {});

      // Ждем завершения спиннеров/загрузки таблицы (ag-overlay-loading-center)
      await page.waitForSelector('.ag-overlay-loading-center', { state: 'detached', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);

      // Закрываем диалоги, которые могли появиться во время загрузки
      const lateEans = await closeBlockingDialogs(page);
      lateEans.forEach((ean) => allNotFoundEans.add(ean));

      console.log('Кликаем по кнопке Export в тулбаре через DOM...');
      await page.evaluate(() => {
        const els = Array.from(document.querySelectorAll('span, div, button, a'));
        const btn = els.find(e => e.textContent?.trim() === 'Export' && !e.textContent.includes('Configure'));
        if (btn) {
          (btn as HTMLElement).click();
        }
      });
      await page.waitForTimeout(3000);

      // После клика по Export мог появиться диалог с ненайденными EAN поверх диалога экспорта
      const postExportEans = await closeBlockingDialogs(page);
      postExportEans.forEach((ean) => allNotFoundEans.add(ean));

      // Проверяем, открылся ли диалог экспорта (#table-export-dialog или #allCh-radio)
      const dialogVisible = await page.locator('#allCh-radio, #table-export-dialog, #exportSubmit').first().isVisible({ timeout: 5000 }).catch(() => false);
      if (dialogVisible) {
        console.log('Диалог экспорта успешно открылся!');
        exportClicked = true;
        break;
      } else {
        console.log('Диалог еще не открылся, пробуем повторный клик через Playwright...');
        // Еще раз чистим диалоги перед повторным кликом
        const retryEans = await closeBlockingDialogs(page);
        retryEans.forEach((ean) => allNotFoundEans.add(ean));

        const exportTrigger = page.locator(':is(span, div, button, a):text-is("Export")').first();
        if (await exportTrigger.isVisible().catch(() => false)) {
          await exportTrigger.click({ force: true });
        }
        await page.waitForTimeout(3000);

        // Проверяем снова
        const retryDialogVisible = await page.locator('#allCh-radio, #table-export-dialog, #exportSubmit').first().isVisible({ timeout: 5000 }).catch(() => false);
        if (retryDialogVisible) {
          console.log('Диалог экспорта успешно открылся (со второй попытки)!');
          exportClicked = true;
        }
        break;
      }
    }
  }

  if (!exportClicked) {
    console.error('Не удалось открыть диалог экспорта.');
    const errScreenshot = path.resolve(process.cwd(), 'temp_export_timeout.png');
    await page.screenshot({ path: errScreenshot, fullPage: true }).catch(() => {});
    await browser.close();
    process.exit(1);
  }

  // Проверяем процент квоты токенов Keepa
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

  // Проверяем предупреждения о нехватке токенов в диалоге экспорта
  const dialogWarning = await page.evaluate(() => {
    const dialog = document.querySelector('#table-export-dialog, .ui-dialog, .modal');
    if (!dialog) return null;
    return dialog.textContent?.replace(/\s+/g, ' ').trim() || '';
  });
  if (dialogWarning) {
    console.log(`Содержимое диалога экспорта: "${dialogWarning.slice(0, 150)}..."`);
  }

  // Финальная чистка диалогов перед нажатием EXPORT
  const finalEans = await closeBlockingDialogs(page);
  finalEans.forEach((ean) => allNotFoundEans.add(ean));

  // Ожидаем скачивание при нажатии на экспорт
  console.log('Подтверждаем экспорт файла Excel...');

  // Поиск кнопки экспорта в диалоге через все возможные селекторы
  let exportBtnClicked = false;
  const clickExportBtn = async () => {
    // Способ 1: Playwright локаторы с force click
    const selectors = [
      '#exportSubmit',
      'button:has-text("EXPORT")',
      'input[value*="EXPORT"]',
      '.button--primary:has-text("EXPORT")',
      'button:has-text("Export")',
      'button:has-text("export")',
      '[type="submit"]',
    ];
    for (const sel of selectors) {
      try {
        const btn = page.locator(sel).first();
        if (await btn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Найдена кнопка экспорта: ${sel}`);
          await btn.click({ force: true });
          exportBtnClicked = true;
          return;
        }
      } catch {}
    }

    // Способ 2: JavaScript поиск по тексту внутри диалога экспорта (#table-export-dialog)
    const jsClicked = await page.evaluate(() => {
      // Ищем ТОЛЬКО в диалоге экспорта, не в других модалках
      const exportDialog = document.querySelector('#table-export-dialog');
      if (!exportDialog) return false;
      const allButtons = exportDialog.querySelectorAll('button, input[type="submit"], input[type="button"], a.button');
      for (const btn of allButtons) {
        const text = (btn.textContent || '').toLowerCase();
        const value = ((btn as HTMLInputElement).value || '').toLowerCase();
        if (text.includes('export') || value.includes('export')) {
          (btn as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    if (jsClicked) {
      console.log('Кнопка экспорта найдена и нажата через JavaScript в диалоге экспорта');
      exportBtnClicked = true;
      return;
    }

    // Способ 3: последняя попытка — ищем любой submit/primary button именно в #table-export-dialog
    const fallbackClicked = await page.evaluate(() => {
      const exportDialog = document.querySelector('#table-export-dialog');
      if (!exportDialog) return false;
      const submitBtns = exportDialog.querySelectorAll('button[type="submit"], input[type="submit"], .button--primary, button.primary, .btn-primary');
      for (const btn of submitBtns) {
        (btn as HTMLElement).click();
        return true;
      }
      // Последняя надежда — любой button в exportDialog
      const anyBtn = exportDialog.querySelector('button, input[type="button"]');
      if (anyBtn) {
        (anyBtn as HTMLElement).click();
        return true;
      }
      return false;
    });
    if (fallbackClicked) console.log('Экспорт запущен через fallback (submit/primary кнопка в диалоге экспорта)');
  };

  await clickExportBtn();

  if (!exportBtnClicked) {
    const errScreenshot = path.resolve(process.cwd(), 'temp_export_timeout.png');
    await page.screenshot({ path: errScreenshot, fullPage: true }).catch(() => {});
    console.error(`Скриншот ошибки сохранен в: ${errScreenshot}`);
    throw new Error('Не удалось найти кнопку экспорта в диалоге');
  }

  try {
    const download = await page.waitForEvent('download', { timeout: 90000 });

    // Сохраняем файл
    fs.mkdirSync(path.dirname(resolvedOutputPath), { recursive: true });
    await download.saveAs(resolvedOutputPath);
    console.log(`Файл успешно сохранен: ${resolvedOutputPath}`);

    // Обновляем сессию на случай обновления токенов
    await context.storageState({ path: storageStatePath });
  } catch (err: any) {
    const errScreenshot = path.resolve(process.cwd(), 'temp_export_timeout.png');
    await page.screenshot({ path: errScreenshot, fullPage: true }).catch(() => {});
    console.error(`Скриншот ошибки сохранен в: ${errScreenshot}`);
    throw err;
  } finally {
    await browser.close();
  }

  // Сохраняем ненайденные EAN в файл рядом с выгрузкой
  if (allNotFoundEans.size > 0) {
    const notFoundPath = resolvedOutputPath.replace(/\.xlsx$/i, '_not_found_eans.txt');
    fs.writeFileSync(notFoundPath, Array.from(allNotFoundEans).join('\n'), 'utf-8');
    console.log(`Ненайденные EAN (${allNotFoundEans.size} шт.) сохранены в: ${notFoundPath}`);
    console.log('Эти товары отсутствуют на Amazon и являются кандидатами на создание новых карточек.');
  }

  console.log('Готово!');
}

main().catch((err) => {
  console.error('Ошибка в процессе выгрузки:', err);
  process.exit(1);
});