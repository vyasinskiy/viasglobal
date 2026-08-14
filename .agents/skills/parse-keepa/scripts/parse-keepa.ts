import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Использование: cd backend && npx tsx ../.agents/skills/parse-keepa/scripts/parse-keepa.ts <путь_к_файлу.xlsx>');
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), inputFile);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Файл не найден: ${resolvedPath}`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log(`Читаем файл: ${resolvedPath}...`);
    const workbook = xlsx.readFile(resolvedPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rows = xlsx.utils.sheet_to_json(sheet) as any[];
    console.log(`Найдено строк: ${rows.length}`);

    const uniqueAsins = new Set<string>();
    const uniqueBrands = new Set<string>();
    const uniqueManufacturers = new Set<string>();

    for (const row of rows) {
      const asin = row['ASIN'];
      const brand = row['Brand'];
      const manufacturer = row['Manufacturer'];

      if (asin && typeof asin === 'string') uniqueAsins.add(asin.trim());
      if (brand && typeof brand === 'string') uniqueBrands.add(brand.trim());
      if (manufacturer && typeof manufacturer === 'string') uniqueManufacturers.add(manufacturer.trim());
    }

    console.log(`\nУникальных ASIN: ${uniqueAsins.size}`);
    console.log(`Уникальных Брендов: ${uniqueBrands.size}`);
    console.log(`Уникальных Производителей: ${uniqueManufacturers.size}`);
    console.log('\nДобавляем новые записи в базу данных...');

    // 1. Добавляем Бренды
    let newBrandsCount = 0;
    for (const brand of uniqueBrands) {
      if (!brand) continue;
      const existing = await prisma.brand.findUnique({ where: { name: brand } });
      if (!existing) {
        await prisma.brand.create({ data: { name: brand } });
        newBrandsCount++;
      }
    }

    // 2. Добавляем Производителей
    let newManufacturersCount = 0;
    for (const manufacturer of uniqueManufacturers) {
      if (!manufacturer) continue;
      const existing = await prisma.manufacturer.findUnique({ where: { name: manufacturer } });
      if (!existing) {
        await prisma.manufacturer.create({ data: { name: manufacturer } });
        newManufacturersCount++;
      }
    }

    // 3. Добавляем ASIN-ы и связываем их с брендом и производителем
    let newAsinsCount = 0;
    for (const row of rows) {
      const asinCode = row['ASIN']?.toString().trim();
      if (!asinCode) continue;

      const brandName = row['Brand']?.toString().trim();
      const manufacturerName = row['Manufacturer']?.toString().trim();

      const existingAsin = await prisma.aSIN.findUnique({ where: { code: asinCode } });
      
      if (!existingAsin) {
        // Находим id бренда и производителя
        let brandId = null;
        let manufacturerId = null;

        if (brandName) {
          const b = await prisma.brand.findUnique({ where: { name: brandName } });
          if (b) brandId = b.id;
        }

        if (manufacturerName) {
          const m = await prisma.manufacturer.findUnique({ where: { name: manufacturerName } });
          if (m) manufacturerId = m.id;
        }

        await prisma.aSIN.create({
          data: {
            code: asinCode,
            brandId: brandId,
            manufacturerId: manufacturerId
          }
        });
        newAsinsCount++;
      }
    }

    console.log('\n--- ИТОГИ ---');
    console.log(`Новых Брендов добавлено: ${newBrandsCount}`);
    console.log(`Новых Производителей добавлено: ${newManufacturersCount}`);
    console.log(`Новых ASIN добавлено: ${newAsinsCount}`);

  } catch (error: any) {
    console.error(`Произошла ошибка: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
