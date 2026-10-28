/**
 * Скрипт миграции данных: добавление дистрибьютора De Bondt B.V.
 * и привязка к нему товаров по списку EAN кодов через ProductFinder.
 *
 * Включает строгую проверку: количество найденных в БД товаров должно
 * строго совпадать с количеством переданных EAN кодов.
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Читаем URL базы данных из переменных окружения
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';

// Создаем пул подключений к базе данных
const pool = new Pool({ connectionString });
// Подключаем PrismaPg адаптер
const adapter = new PrismaPg(pool);
// Создаем инстанс клиента Prisma
const prisma = new PrismaClient({ adapter });

// Целевые EAN коды для поиска и привязки
const targetEans = [
  '8717738957798',
  '8717738977543',
  '8717738957699',
  '8717738977598',
  '8717738977581',
  '8717738977567',
  '8717738957712',
];

// Данные о дистрибьюторе
const distributorName = 'De Bondt B.V.';
const distributorWebsite = 'https://www.debondt.com';

async function main() {
  console.log(`[1/3] Поиск товаров в ProductFinder по переданным EAN кодам (${targetEans.length} шт.)...`);

  // Находим все ASIN, у которых в ProductFinder содержится хотя бы один из целевых EAN
  const foundAsins = await prisma.aSIN.findMany({
    where: {
      productFinders: {
        some: {
          productCodesEAN: {
            in: targetEans,
          },
        },
      },
    },
    include: {
      brand: true,
      productFinders: {
        where: {
          productCodesEAN: {
            in: targetEans,
          },
        },
        select: {
          productCodesEAN: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
  });

  console.log(`Найдено связанных ASIN в базе данных: ${foundAsins.length} из ${targetEans.length}`);

  // Собираем множество фактически найденных EAN кодов
  const foundEans = new Set<string>();
  for (const item of foundAsins) {
    const ean = item.productFinders[0]?.productCodesEAN || 'N/A';
    if (ean !== 'N/A') foundEans.add(ean);
    console.log(` - ASIN: ${item.code} | EAN: ${ean} | Brand: ${item.brand?.name || 'N/A'}`);
  }

  // Проверяем наличие ненайденных EAN кодов
  const missingEans = targetEans.filter((ean) => !foundEans.has(ean));

  // Строгая проверка: если количество найденных товаров не совпадает с переданными EAN
  if (missingEans.length > 0 || foundAsins.length !== targetEans.length) {
    throw new Error(
      `[ОШИБКА ВАЛИДАЦИИ] Количество найденных товаров (${foundAsins.length}) не соответствует количеству переданных EAN (${targetEans.length}).\n` +
      `Не найдены в ProductFinder следующие EAN (${missingEans.length} шт.):\n` +
      missingEans.map((ean) => ` - ${ean}`).join('\n') +
      `\nОперация прервана: дистрибьютор не сохранен, так как требуется привязка ВСЕХ указанных товаров.`
    );
  }

  console.log(`\n[2/3] Добавление / обновление дистрибьютора "${distributorName}"...`);

  // Создаем или обновляем запись дистрибьютора в таблице Distributor
  const distributor = await prisma.distributor.upsert({
    where: {
      name: distributorName,
    },
    update: {
      website: distributorWebsite,
      asins: {
        connect: foundAsins.map((a) => ({ id: a.id })),
      },
    },
    create: {
      name: distributorName,
      website: distributorWebsite,
      asins: {
        connect: foundAsins.map((a) => ({ id: a.id })),
      },
    },
    include: {
      asins: true,
    },
  });

  console.log(`\n[3/3] Готово! Дистрибьютор успешно сохранен в базе данных:`);
  console.log(` - ID: ${distributor.id}`);
  console.log(` - Название: ${distributor.name}`);
  console.log(` - Сайт: ${distributor.website}`);
  console.log(` - Всего привязано ASIN: ${distributor.asins.length}`);
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    // Корректно завершаем соединение с базой данных
    await prisma.$disconnect();
    await pool.end();
  });
