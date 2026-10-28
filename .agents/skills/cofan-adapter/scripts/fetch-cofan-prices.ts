/**
 * Скрипт сбора оптовых цен Cofan по списку EAN/ASIN и формирования промежуточного Excel файла.
 * 
 * Использование:
 *   npx tsx fetch-cofan-prices.ts [путь_к_файлу_с_EAN_или_Keepa.xlsx]
 */
import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const backendDir = path.resolve(__dirname, '../../../../ecommerce/backend');

function requireBackendModule(moduleName: string) {
  try {
    const resolved = require.resolve(moduleName, { paths: [backendDir, process.cwd()] });
    return require(resolved);
  } catch (err: any) {
    return require(moduleName);
  }
}

const xlsx = requireBackendModule('xlsx');

const storageStatePath = path.resolve(__dirname, '../../../../ecommerce/contractors/COFAN/auth/storage_state.json');
const reportsDir = path.resolve(__dirname, '../../../../ecommerce/contractors/COFAN/reports');

// Коэффициент испанского налога (Recargo de Equivalencia = 21% IVA + 5.2% RE)
const SPAIN_TAX_COEFFICIENT = 1.262;

interface CofanItemResult {
  ean: string;
  asin?: string;
  referencia: string | null;
  title: string;
  priceNetto: number | null;
  costPrice: number | null;
  pvp: number | null;
  unitsPerBox: number;
  minBoxOrder: number;
  stock: string;
  buyBoxPrice?: number | null;
  bsr?: number | null;
  cofanUrl: string;
}

/**
 * Точный поиск строки товара по целевому EAN в таблице #tablaReferencia
 */
async function fetchCofanDataByExactEan(page: Page, targetEan: string): Promise<{
  referencia: string | null;
  pvp: number | null;
  priceNetto: number | null;
  unitsPerBox: number;
  minBoxOrder: number;
  stock: string;
  url: string;
} | null> {
  const searchUrl = `https://www.cofan.es/es/buscar/?name=${encodeURIComponent(targetEan)}`;
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(600);

    let currentUrl = page.url();

    if (!currentUrl.includes('/detalle-producto/')) {
      const box = await page.$('.box-productos');
      if (box) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }),
          box.click()
        ]);
        currentUrl = page.url();
      } else {
        return null;
      }
    }

    const rowInfo = await page.evaluate((targetEanStr) => {
      // Ищем строки в таблицах референций Cofan
      const rows = Array.from(document.querySelectorAll('#tablaReferencia tr, .tabla-referencias tr'))
        .filter(r => r.querySelectorAll('td').length >= 4);

      let matchedRow = rows.find(r => (r.textContent || '').includes(targetEanStr));
      if (!matchedRow && rows.length > 0) {
        matchedRow = rows[0];
      }
      if (!matchedRow) return null;

      const cells = Array.from(matchedRow.querySelectorAll('td')).map(td => (td.innerText || td.textContent || '').trim());

      return {
        cells,
        rowInner: (matchedRow as HTMLElement).innerText.trim().replace(/\t+/g, ' | ')
      };
    }, targetEan);

    if (!rowInfo || rowInfo.cells.length < 4) return null;

    // В B2B структуре Cofan:
    // cells[0]: артикул (Referencia)
    // cells[1]: артикул + EAN + описание
    // cells[2]: EMBALAJE (unitsPerBox)
    // cells[3]: ENVASE MÍNIMO (minBoxOrder)
    // cells[4]: PVP/ud.
    // cells[5]: PRECIO NETO (чистая оптовая цена)
    const refMatch = (rowInfo.cells[0] || '').match(/\b\d{7,9}\b/) || (rowInfo.cells[1] || '').match(/\b\d{7,9}\b/);
    const referencia = refMatch ? refMatch[0] : null;

    let unitsPerBox = 1;
    let minBoxOrder = 1;
    let pvp: number | null = null;
    let priceNetto: number | null = null;

    if (rowInfo.cells.length >= 6) {
      const parsedEmbalaje = parseInt(rowInfo.cells[2].replace(/\D/g, ''), 10);
      if (!isNaN(parsedEmbalaje) && parsedEmbalaje > 0) {
        unitsPerBox = parsedEmbalaje;
      }

      const parsedEnvase = parseInt(rowInfo.cells[3].replace(/\D/g, ''), 10);
      if (!isNaN(parsedEnvase) && parsedEnvase > 0) {
        minBoxOrder = parsedEnvase;
      }

      const parsedPvp = parseFloat(rowInfo.cells[4].replace('€', '').replace(',', '.').trim());
      if (!isNaN(parsedPvp) && parsedPvp > 0) {
        pvp = parsedPvp;
      }

      const parsedNeto = parseFloat(rowInfo.cells[5].replace('€', '').replace(',', '.').trim());
      if (!isNaN(parsedNeto) && parsedNeto > 0) {
        priceNetto = parsedNeto;
      }
    }

    // Если цены не распарсились по ячейкам, используем поиск по регулярным выражениям
    if (!priceNetto || !pvp) {
      const parts = rowInfo.rowInner.split(' | ');
      for (const part of parts) {
        const euroMatches = part.match(/([\d.,]+)\s*€/g);
        if (euroMatches && euroMatches.length >= 2) {
          if (!pvp) pvp = parseFloat(euroMatches[0].replace('€', '').replace(',', '.').trim()) || null;
          if (!priceNetto) priceNetto = parseFloat(euroMatches[1].replace('€', '').replace(',', '.').trim()) || null;
          break;
        } else if (euroMatches && euroMatches.length === 1) {
          const num = parseFloat(euroMatches[0].replace('€', '').replace(',', '.').trim());
          if (!pvp) pvp = num;
          else if (!priceNetto) priceNetto = num;
        }
      }
    }

    const stockText = await page.evaluate(() => {
      const dispEl = document.querySelector('[class*="disponible"], .stock, #stock');
      return dispEl ? dispEl.textContent?.trim() : 'DISPONIBLE';
    });

    return {
      referencia,
      pvp,
      priceNetto,
      unitsPerBox,
      minBoxOrder,
      stock: stockText || 'DISPONIBLE',
      url: currentUrl,
    };
  } catch (err: any) {
    return null;
  }
}

async function main() {
  const inputFileArg = process.argv[2];
  let targetFile = inputFileArg;

  if (!targetFile) {
    // Ищем самую свежую выгрузку Cofan в ecommerce/keepa/exports/
    const exportsDir = path.resolve(__dirname, '../../../../ecommerce/keepa/exports');
    if (fs.existsSync(exportsDir)) {
      const files = fs.readdirSync(exportsDir).filter(f => f.includes('cofan') && f.endsWith('.xlsx'));
      if (files.length > 0) {
        files.sort().reverse();
        targetFile = path.join(exportsDir, files[0]);
      }
    }
  }

  if (!targetFile || !fs.existsSync(targetFile)) {
    throw new Error('Файл входных данных не найден! Укажите путь к выгрузке Keepa или файлу со списком EAN.');
  }

  console.log(`\nВходной файл: ${targetFile}`);

  if (!fs.existsSync(storageStatePath)) {
    throw new Error(`Файл сессии Cofan не найден в: ${storageStatePath}\nСначала запустите: save-session.ts`);
  }

  const wb = xlsx.readFile(targetFile);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);

  // Фильтруем товары с EAN
  const targetItems: { ean: string; asin?: string; title: string; buyBoxPrice?: number; bsr?: number }[] = [];

  for (const r of rows) {
    const rawEan = (r['Product Codes: EAN'] || r['EAN'] || r['ean'] || '').toString().split(',')[0].trim();
    if (rawEan.length >= 8) {
      targetItems.push({
        ean: rawEan,
        asin: r['ASIN'] || r['asin'],
        title: (r['Title'] || r['title'] || r['Наименование'] || '').trim(),
        buyBoxPrice: parseFloat(r['Buy Box: Current'] || r['buyBoxPrice']) || null,
        bsr: parseInt(r['Sales Rank: Current'] || r['salesRank'], 10) || null,
      });
    }
  }

  console.log(`Найдено позиций с EAN для запроса цен: ${targetItems.length}`);

  fs.mkdirSync(reportsDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({
    storageState: storageStatePath,
    viewport: { width: 1400, height: 900 },
    locale: 'es-ES',
  });
  const page = await context.newPage();

  const results: CofanItemResult[] = [];

  for (let i = 0; i < targetItems.length; i++) {
    const item = targetItems[i];
    console.log(`[${i + 1}/${targetItems.length}] Запрос Cofan: EAN ${item.ean} (${item.asin || ''})...`);

    const cofanData = await fetchCofanDataByExactEan(page, item.ean);

    if (cofanData && cofanData.priceNetto) {
      const costPrice = Math.round(cofanData.priceNetto * SPAIN_TAX_COEFFICIENT * 100) / 100;

      results.push({
        ean: item.ean,
        asin: item.asin,
        referencia: cofanData.referencia,
        title: item.title,
        priceNetto: cofanData.priceNetto,
        costPrice,
        pvp: cofanData.pvp,
        unitsPerBox: cofanData.unitsPerBox,
        minBoxOrder: cofanData.minBoxOrder,
        stock: cofanData.stock,
        buyBoxPrice: item.buyBoxPrice,
        bsr: item.bsr,
        cofanUrl: cofanData.url,
      });

      console.log(`  -> Найдено: Ref ${cofanData.referencia} | Netto: ${cofanData.priceNetto}€ | Себестоимость: ${costPrice}€ | Embalaje: ${cofanData.unitsPerBox} шт. | Мин. заказ: ${cofanData.minBoxOrder} кор.`);
    } else {
      console.log(`  -> Не найден на портале Cofan`);
    }

    await page.waitForTimeout(250);
  }

  await browser.close();

  // Формируем промежуточный Excel файл (Staging)
  const timestamp = Date.now();
  const stagingExcelFile = path.join(reportsDir, `cofan_staging_prices_${timestamp}.xlsx`);

  const excelRows = results.map((r, idx) => ({
    '№': idx + 1,
    'EAN': r.ean,
    'ASIN': r.asin || '',
    'Артикул Cofan': r.referencia || '',
    'Наименование': r.title,
    'BSR': r.bsr || '',
    'Закупка Neto (€)': r.priceNetto,
    'Себестоимость с R.E. 26.2% (€)': r.costPrice,
    'Каталожный PVP (€)': r.pvp || '',
    'Штук в коробке (Embalaje)': r.unitsPerBox,
    'Мин. заказ коробок (Envase)': r.minBoxOrder,
    'Цена Amazon BuyBox (€)': r.buyBoxPrice || '',
    'Наличие на складе': r.stock,
    'Ссылка Cofan': r.cofanUrl,
  }));

  const ws = xlsx.utils.json_to_sheet(excelRows);
  const wbOut = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbOut, ws, 'Staging Prices');
  xlsx.writeFile(wbOut, stagingExcelFile);

  console.log(`\n=============================================================`);
  console.log(`✅ Промежуточный файл с ценами успешно сформирован:`);
  console.log(`📁 ${stagingExcelFile}`);
  console.log(`📊 Всего успешно распознано товаров: ${results.length} из ${targetItems.length}`);
  console.log(`=============================================================\n`);
  console.log('Пожалуйста, проверьте файл перед подтверждением импорта в базу данных.');
}

main().catch(console.error);
