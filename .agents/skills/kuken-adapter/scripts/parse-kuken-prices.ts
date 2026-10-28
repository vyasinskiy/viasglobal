/**
 * Скрипт парсинга прайс-листа Kuken (Alfa Dyser) с учетом эко-тасы (TASA / RAEE).
 * 
 * Логика работы:
 * 1. Читает Excel-файл поставщика (например, viasglobal (1).xlsx).
 * 2. Нормализует заголовки (удаляет пробелы вокруг имен колонок).
 * 3. Извлекает базовую цену закупки (P.VENTA) и экологический сбор (TASA).
 * 4. Рассчитывает базу для налогообложения: effectiveNet = priceNetto + ecoTasa.
 * 5. Рассчитывает себестоимость с испанскими налогами (IVA 21% + RE 5.2% = 26.2%):
 *    costPrice = round((priceNetto + ecoTasa) * 1.262, 2).
 * 6. Сопоставляет EAN с каталогом Amazon в БД (ProductFinder / ASIN).
 * 7. Формирует промежуточный Excel-файл (staging) для проверки пользователем.
 * 
 * Использование:
 *   cd ecommerce/backend && npx tsx ../../.agents/skills/kuken-adapter/scripts/parse-kuken-prices.ts <путь_к_файлу_kuken.xlsx>
 */

import * as path from 'path';
import * as fs from 'fs';

// Директория backend для импорта установленных модулей
const backendDir = path.resolve(__dirname, '../../../../ecommerce/backend');

function requireBackendModule(moduleName: string) {
  try {
    const resolved = require.resolve(moduleName, { paths: [backendDir, process.cwd()] });
    return require(resolved);
  } catch {
    return require(moduleName);
  }
}

const { Pool } = requireBackendModule('pg');
const xlsx = requireBackendModule('xlsx');
const dotenv = requireBackendModule('dotenv');

// Загружаем переменные окружения
dotenv.config({ path: path.join(backendDir, '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Испанский налоговый коэффициент: 21% IVA + 5.2% Recargo de Equivalencia
const SPAIN_TAX_COEFFICIENT = 1.262;

export interface KukenItem {
  code: string;
  ean: string;
  title: string;
  brand: string;
  priceNetto: number;
  ecoTasa: number;
  effectiveNet: number;
  costPrice: number;
  oldCostPrice: number;
  unitsPerBox: number;
  minBoxOrder: number;
  asin?: string | null;
  buyBoxPrice?: number | null;
  salesRank?: number | null;
  isInDatabase: boolean;
}

/**
 * Очистка и валидация строки EAN штрихкода
 */
export function cleanEan(val: any): string | null {
  if (!val) return null;
  const str = String(val).trim().replace(/\D/g, '');
  if (str.length >= 8 && str.length <= 14) {
    return str;
  }
  return null;
}

/**
 * Парсер строк прайс-листа Kuken
 */
export async function parseKukenExcel(filePath: string): Promise<KukenItem[]> {
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1 });

  if (rawRows.length === 0) {
    throw new Error('Файл прайс-листа пуст.');
  }

  // Определяем, есть ли строка заголовков
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const row = rawRows[i];
    if (
      row &&
      row.some(
        (cell: any) =>
          typeof cell === 'string' &&
          (cell.trim().toUpperCase().includes('VENTA') ||
            cell.trim().toUpperCase().includes('EAN') ||
            cell.trim().toUpperCase().includes('TASA'))
      )
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const items: KukenItem[] = [];

  if (headerRowIndex >= 0) {
    // Режим с заголовками колонок (как в viasglobal (1).xlsx)
    const headerRow = rawRows[headerRowIndex].map((c: any) =>
      typeof c === 'string' ? c.trim().toUpperCase() : ''
    );

    const colCode = headerRow.findIndex((h) => h === 'CODE' || h === 'REFERENCIA' || h === 'REF');
    const colTitle = headerRow.findIndex((h) => h.includes('DESCRIPCION') || h.includes('ARTICULO') || h.includes('TITLE'));
    const colPrice = headerRow.findIndex((h) => h.includes('VENTA') || h.includes('PRECIO') || h === 'NETTO');
    const colTasa = headerRow.findIndex((h) => h.includes('TASA') || h.includes('ECOTASA') || h.includes('RAEE'));
    const colCaja = headerRow.findIndex((h) => h === 'CAJA' || h.includes('BOX') || h.includes('UNIDADES'));
    const colMarca = headerRow.findIndex((h) => h === 'MARCA' || h === 'BRAND');
    const colEan = headerRow.findIndex((h) => h.includes('EAN'));

    for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length === 0) continue;

      const rawEan = colEan >= 0 ? row[colEan] : null;
      const ean = cleanEan(rawEan);
      if (!ean) continue;

      const rawPrice = colPrice >= 0 ? parseFloat(String(row[colPrice]).replace(',', '.')) : 0;
      if (isNaN(rawPrice) || rawPrice <= 0) continue;

      const rawTasa = colTasa >= 0 ? parseFloat(String(row[colTasa]).replace(',', '.')) : 0;
      const ecoTasa = !isNaN(rawTasa) && rawTasa > 0 ? Math.round(rawTasa * 100) / 100 : 0;

      const rawCaja = colCaja >= 0 ? parseInt(String(row[colCaja]), 10) : 1;
      const unitsPerBox = !isNaN(rawCaja) && rawCaja > 0 ? rawCaja : 1;

      const code = colCode >= 0 ? String(row[colCode] || '').trim() : '';
      const title = colTitle >= 0 ? String(row[colTitle] || '').trim() : '';
      const brand = colMarca >= 0 ? String(row[colMarca] || 'KUKEN').trim().toUpperCase() : 'KUKEN';

      const priceNetto = Math.round(rawPrice * 100) / 100;
      const effectiveNet = Math.round((priceNetto + ecoTasa) * 100) / 100;
      const costPrice = Math.round(effectiveNet * SPAIN_TAX_COEFFICIENT * 100) / 100;
      const oldCostPrice = Math.round(priceNetto * SPAIN_TAX_COEFFICIENT * 100) / 100;

      items.push({
        code,
        ean,
        title,
        brand,
        priceNetto,
        ecoTasa,
        effectiveNet,
        costPrice,
        oldCostPrice,
        unitsPerBox,
        minBoxOrder: unitsPerBox,
        isInDatabase: false,
      });
    }
  } else {
    // Позиционный режим без строки заголовков (исторический viasglobal.xlsx)
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (!row || row.length < 8) continue;

      const ean = cleanEan(row[7]);
      if (!ean) continue;

      const rawPrice = parseFloat(String(row[3]).replace(',', '.'));
      if (isNaN(rawPrice) || rawPrice <= 0) continue;

      // В историческом файле колонка 4 содержала 0.65 (эко-таса)
      const rawTasa = parseFloat(String(row[4]).replace(',', '.'));
      const ecoTasa = !isNaN(rawTasa) && rawTasa > 0 ? Math.round(rawTasa * 100) / 100 : 0;

      const rawCaja = parseInt(String(row[5]), 10);
      const unitsPerBox = !isNaN(rawCaja) && rawCaja > 0 ? rawCaja : 1;

      const code = String(row[1] || '').trim();
      const title = String(row[2] || '').trim();
      const brand = String(row[6] || 'KUKEN').trim().toUpperCase();

      const priceNetto = Math.round(rawPrice * 100) / 100;
      const effectiveNet = Math.round((priceNetto + ecoTasa) * 100) / 100;
      const costPrice = Math.round(effectiveNet * SPAIN_TAX_COEFFICIENT * 100) / 100;
      const oldCostPrice = Math.round(priceNetto * SPAIN_TAX_COEFFICIENT * 100) / 100;

      items.push({
        code,
        ean,
        title,
        brand,
        priceNetto,
        ecoTasa,
        effectiveNet,
        costPrice,
        oldCostPrice,
        unitsPerBox,
        minBoxOrder: unitsPerBox,
        isInDatabase: false,
      });
    }
  }

  // Обогащаем данными из базы данных (поиск ASIN, BuyBox, BSR)
  for (const item of items) {
    try {
      const dbRes = await pool.query(
        `SELECT a.code as asin, pf."buyBoxCurrent", pf."salesRankCurrent"
         FROM "ProductFinder" pf 
         JOIN "ASIN" a ON pf."asinId" = a.id 
         WHERE pf."productCodesEAN" LIKE $1 
         ORDER BY pf."createdAt" DESC 
         LIMIT 1`,
        [`%${item.ean}%`]
      );

      if (dbRes.rows.length > 0) {
        const found = dbRes.rows[0];
        item.asin = found.asin;
        item.buyBoxPrice = found.buyBoxCurrent ? parseFloat(found.buyBoxCurrent) : null;
        item.salesRank = found.salesRankCurrent ? parseInt(found.salesRankCurrent, 10) : null;
        item.isInDatabase = true;
      }
    } catch {
      // Игнорируем временные сетевые сбои выборки
    }
  }

  return items;
}

async function main() {
  const filePathArg = process.argv[2];

  if (!filePathArg) {
    console.error('Ошибка: укажите путь к файлу прайс-листа Kuken.');
    console.error('Пример: cd ecommerce/backend && npx tsx ../../.agents/skills/kuken-adapter/scripts/parse-kuken-prices.ts ../contractors/kuken/viasglobal\\ \\(1\\).xlsx');
    process.exit(1);
  }

  const resolvedPath = path.resolve(process.cwd(), filePathArg);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Файл не найден: ${resolvedPath}`);
  }

  console.log(`\n=============================================================`);
  console.log(`📦 Обработка прайс-листа Kuken: ${resolvedPath}`);
  console.log(`=============================================================\n`);

  const items = await parseKukenExcel(resolvedPath);
  console.log(`Всего распознано позиций: ${items.length}`);

  const matchedCount = items.filter((i) => i.isInDatabase).length;
  const unmatchedCount = items.length - matchedCount;

  console.log(`- Сопоставлено с каталогом Amazon в БД: ${matchedCount}`);
  console.log(`- Новинки (отсутствуют в каталоге): ${unmatchedCount}\n`);

  // Формируем промежуточный Excel файл
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportsDir = path.resolve(__dirname, '../../../../ecommerce/contractors/kuken/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const stagingFilePath = path.join(reportsDir, `kuken_staging_prices_${timestamp}.xlsx`);

  const exportRows = items.map((item, idx) => ({
    '№': idx + 1,
    'Артикул': item.code,
    'EAN': item.ean,
    'ASIN': item.asin || '---',
    'В базе': item.isInDatabase ? 'Да' : 'Нет (Новинка)',
    'Наименование': item.title,
    'Цена Netto (€)': item.priceNetto,
    'Эко-таса (€)': item.ecoTasa,
    'Чистая база с тасой (€)': item.effectiveNet,
    'Себестоимость RE 26.2% (€)': item.costPrice,
    'Старая себестоимость (€)': item.oldCostPrice,
    'Разница с тасой (€)': Math.round((item.costPrice - item.oldCostPrice) * 100) / 100,
    'Штук в коробке (Caja)': item.unitsPerBox,
    'Мин. заказ (Caja)': item.minBoxOrder,
    'Amazon BuyBox (€)': item.buyBoxPrice || '---',
    'BSR': item.salesRank || '---',
  }));

  const outWb = xlsx.utils.book_new();
  const outWs = xlsx.utils.json_to_sheet(exportRows);
  xlsx.utils.book_append_sheet(outWb, outWs, 'Kuken Staging');
  xlsx.writeFile(outWb, stagingFilePath);

  console.log(`✅ Промежуточный файл с ценами успешно сформирован:`);
  console.log(`📄 ${stagingFilePath}\n`);

  console.log(`📋 Сводная таблица позиций:`);
  console.table(
    items.map((i) => ({
      Артикул: i.code,
      EAN: i.ean,
      ASIN: i.asin || '---',
      Netto: `${i.priceNetto.toFixed(2)} €`,
      Tasa: `${i.ecoTasa.toFixed(2)} €`,
      'Cost с тасой': `${i.costPrice.toFixed(2)} €`,
      'Cost старый': `${i.oldCostPrice.toFixed(2)} €`,
      BuyBox: i.buyBoxPrice ? `${i.buyBoxPrice.toFixed(2)} €` : '---',
    }))
  );

  console.log(`\n💡 Сделайте проверку промежуточного файла перед импортом.`);
  console.log(`Для загрузки подтвержденных цен запустите:`);
  console.log(`npx tsx ../.agents/skills/kuken-adapter/scripts/import-kuken-to-db.ts "${stagingFilePath}"`);
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('Ошибка:', err);
      process.exit(1);
    })
    .finally(async () => {
      await pool.end();
    });
}
