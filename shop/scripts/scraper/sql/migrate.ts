import fs from "fs";
import path from "path";
import { Client } from "pg";
import dotenv from "dotenv";

// Загружаем переменные из .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Скрипт применения схемы базы данных Supabase (schema.sql)
 */
async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("❌ Ошибка: В .env.local не найдена переменная DATABASE_URL");
    process.exit(1);
  }

  console.log("🔌 Подключение к PostgreSQL Supabase...");
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✅ Подключение к базе данных успешно установлено.");

    const schemaPath = path.resolve(__dirname, "schema.sql");
    const sqlContent = fs.readFileSync(schemaPath, "utf8");

    console.log("📄 Применение SQL-схемы (таблицы: parsing_runs, products, product_sources, parsing_logs)...");
    await client.query(sqlContent);

    console.log("🎉 Схема успешно применена!");

    // Проверяем список созданных таблиц
    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    console.log("📋 Созданные таблицы в схеме public:", res.rows.map((r) => r.table_name));

    await client.end();
  } catch (err: any) {
    console.error("❌ Ошибка при выполнении миграции:", err.message);
    await client.end();
    process.exit(1);
  }
}

runMigration();
