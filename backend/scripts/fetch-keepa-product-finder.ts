import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем переменные окружения из .env файла
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Основная функция запуска выгрузки через Keepa Product Finder
 */
async function main() {
  const arg = process.argv[2];

  if (!arg) {
    console.log('Использование:');
    console.log('  npx tsx scripts/fetch-keepa-product-finder.ts <categoryId>  - Запуск поиска для конкретной категории');
    console.log('  npx tsx scripts/fetch-keepa-product-finder.ts --all          - Запуск поиска для всех активных категорий из БД');
    console.log('  npx tsx scripts/fetch-keepa-product-finder.ts --list         - Показать список разрешенных категорий из БД');
    console.log('\nПример:');
    console.log('  npx tsx scripts/fetch-keepa-product-finder.ts 599391031');
    process.exit(0);
  }

  const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3001';

  try {
    // Режим просмотра списка категорий
    if (arg === '--list') {
      console.log('\nЗапрашиваем список разрешенных категорий из бэкенда...');
      const response = await fetch(`${backendBaseUrl}/keepa/allowed-categories`);

      if (!response.ok) {
        throw new Error(`Ошибка сервера (${response.status}): ${await response.text()}`);
      }

      const categories = await response.json();
      console.log('\nСписок разрешенных категорий (Белый список):');
      console.table(categories);
      return;
    }

    // Режим запуска по всем категориям
    if (arg === '--all') {
      console.log('\nЗапуск Keepa Product Finder по ВСЕМ активным категориям из БД...');
      const response = await fetch(`${backendBaseUrl}/keepa/product-finder/all`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`Ошибка сервера (${response.status}): ${await response.text()}`);
      }

      const results = await response.json();
      console.log('\nРезультаты обработки:');
      console.log(JSON.stringify(results, null, 2));
      return;
    }

    // Режим запуска по конкретной категории (передан categoryId)
    const categoryId = arg;
    console.log(`\nЗапуск Keepa Product Finder для категории ${categoryId}...`);
    const response = await fetch(`${backendBaseUrl}/keepa/product-finder/category/${categoryId}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Ошибка сервера (${response.status}): ${await response.text()}`);
    }

    const result = await response.json();
    console.log('\nРезультат поиска:');
    console.log(`- Категория: ${categoryId}`);
    console.log(`- Всего найдено товаров: ${result.totalResults}`);
    console.log(`- Получено ASIN: ${result.asins?.length || 0}`);
    console.log(`- Добавлено в очередь WholesaleAsinQueue: ${result.queued || 0}`);

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\nОшибка: Не удалось подключиться к бэкенду на ' + backendBaseUrl);
      console.error('Пожалуйста, убедитесь, что бэкенд запущен (npm run start:dev).');
    } else {
      console.error('\nПроизошла ошибка при выполнении:', error.message);
    }
    process.exit(1);
  }
}

// Запуск скрипта
main();
