/**
 * Скрипт для получения EAN-кодов по списку ASIN из базы данных (AsinView).
 * Используется скиллом create-welcome-letter.
 *
 * Пример вызова:
 * npx tsx .agents/skills/create-welcome-letter/scripts/get-eans-by-asins.ts B0CW6FMW5M B0CFH95MC2 B0DPVRQLV3 B08H14P6VG
 */

import { createRequire } from 'module';
import * as path from 'path';
import * as fs from 'fs';

// Резолвим модуль 'pg' из backend/node_modules
const backendPackageJson = path.resolve(__dirname, '../../../../backend/package.json');
const backendRequire = createRequire(backendPackageJson);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Pool } = backendRequire('pg');

// Читаем DATABASE_URL из backend/.env при наличии
let envDatabaseUrl: string | undefined;
const envPath = path.resolve(__dirname, '../../../../backend/.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (match && match[1]) {
    envDatabaseUrl = match[1];
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  envDatabaseUrl ||
  'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';

const pool = new Pool({ connectionString });

interface AsinViewRow {
  asin: string;
  ean: string | null;
  brand: string | null;
}

async function main() {
  // Получаем аргументы командной строки
  const rawArgs = process.argv.slice(2);

  if (rawArgs.length === 0) {
    console.error(JSON.stringify({ error: 'Не переданы ASIN для поиска' }));
    process.exit(1);
  }

  // Очищаем и разбиваем входные строки (поддерживаем разделение запятыми, пробелами и переносами строк)
  const asins: string[] = [];
  for (const arg of rawArgs) {
    const parts = arg
      .split(/[\s,]+/)
      .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
      .filter((s) => s.length > 0);
    asins.push(...parts);
  }

  // Убираем дубликаты
  const uniqueAsins = Array.from(new Set(asins));

  try {
    // Выполняем SQL запрос к представлению AsinView
    const query = `
      SELECT asin, ean, brand
      FROM "AsinView"
      WHERE asin = ANY($1::text[])
    `;
    const { rows } = await pool.query<AsinViewRow>(query, [uniqueAsins]);

    // Формируем результирующий список в порядке переданных ASIN
    const resultMap = new Map<string, AsinViewRow>();
    for (const row of rows) {
      resultMap.set(row.asin, row);
    }

    const results = uniqueAsins.map((asin) => {
      const found = resultMap.get(asin);
      return {
        asin,
        ean: found?.ean || null,
        brand: found?.brand || null,
        found: !!found && !!found.ean,
      };
    });

    // Выводим результат в формате JSON
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      })
    );
    process.exit(1);
  } finally {
    // Корректно закрываем пул соединений
    await pool.end();
  }
}

main();
