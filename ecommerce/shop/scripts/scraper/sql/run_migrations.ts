import fs from "fs";
import path from "path";
import { Client } from "pg";
import dotenv from "dotenv";

// Загружаем конфигурацию из .env.local и .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Универсальный раннер SQL-миграций для Supabase
 * Использование: npx tsx scripts/scraper/sql/run_migrations.ts [путь_к_sql_файлу]
 */
async function runSqlMigration() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ Ошибка: В .env.local / .env не найдена переменная DATABASE_URL");
    process.exit(1);
  }

  // Определяем файл миграции: переданный в аргументах или по умолчанию add_original_images_columns.sql
  const args = process.argv.slice(2);
  const targetFile = args[0] || "scripts/scraper/sql/add_original_images_columns.sql";
  const absolutePath = path.isAbsolute(targetFile) ? targetFile : path.resolve(process.cwd(), targetFile);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Файл миграции не найден: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`🔌 Подключение к Supabase PostgreSQL...`);
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Успешное подключение к базе данных.");

    const sql = fs.readFileSync(absolutePath, "utf8");
    console.log(`📄 Применение SQL миграции из файла: ${path.basename(absolutePath)}...`);

    await client.query(sql);
    console.log(`🎉 Миграция успешно выполнена!`);

    await client.end();
  } catch (err: any) {
    console.error(`❌ Ошибка выполнения миграции:`, err.message);
    await client.end();
    process.exit(1);
  }
}

// Запуск раннера миграций
runSqlMigration();
