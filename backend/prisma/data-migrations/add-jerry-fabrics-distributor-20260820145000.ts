/**
 * Скрипт миграции данных: добавление дистрибьютора Jerry Fabrics s.r.o.
 * и привязка к нему выбранных товаров (4 шт.) по списку EAN кодов через ProductFinder.
 *
 * Включает строгую проверку: количество найденных в БД товаров должно
 * строго совпадать с количеством переданных позиций.
 */

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Читаем URL базы данных из переменных окружения
const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';

// Создаем пул подключений к базе данных PostgreSQL
const pool = new Pool({ connectionString });
// Подключаем PrismaPg адаптер для работы с пулом
const adapter = new PrismaPg(pool);
// Создаем экземпляр клиента Prisma
const prisma = new PrismaClient({ adapter });

// Целевые EAN коды для выбранных ASIN (B08H14P6VG, B0CFH95MC2, B0CW6FMW5M, B0DPVRQLV3)
const targetEans = [
  '8592753025765', // B08H14P6VG (Disney El Rey León)
  '8592753033302', // B0CFH95MC2 (Minnie Mouse)
  '8592753035344', // B0CW6FMW5M (Frozen 3 Elsa)
  '8592753039137', // B0DPVRQLV3 (Bluey Bingo)
];

// Данные о дистрибьюторе
const distributorName = 'Jerry Fabrics s.r.o.';
const distributorWebsite = 'https://www.jfabrics.cz';

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

  // Создаем или обновляем запись дистрибьютора в таблице Distributor и связываем с ASIN
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
