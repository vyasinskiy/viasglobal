import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Подключение к базе данных с использованием pg адаптера
const connectionString = process.env.DATABASE_URL || 'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const manufacturerName = 'shop_decoking';
  const brandName = 'DecoKing';

  // 1. Убеждаемся, что производитель существует или создаем его
  const manufacturer = await prisma.manufacturer.upsert({
    where: { name: manufacturerName },
    update: {},
    create: { name: manufacturerName },
  });

  // 2. Убеждаемся, что бренд существует или создаем его
  const brand = await prisma.brand.upsert({
    where: { name: brandName },
    update: {},
    create: { name: brandName },
  });

  // 3. Создаем связку (private label), если её ещё нет
  const privateLabel = await prisma.privateLabel.upsert({
    where: {
      brandId_manufacturerId: {
        manufacturerId: manufacturer.id,
        brandId: brand.id,
      },
    },
    update: {},
    create: {
      manufacturerId: manufacturer.id,
      brandId: brand.id,
    },
  });

  console.log('Успешно создана/обновлена связка Private Label:');
  console.log(`Производитель: ${manufacturer.name} (ID: ${manufacturer.id})`);
  console.log(`Бренд: ${brand.name} (ID: ${brand.id})`);
  console.log(`Private Label ID: ${privateLabel.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
