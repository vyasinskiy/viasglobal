import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // 1. Находим Manufacturer
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { name: 'U10' },
    });
    if (!manufacturer) {
      throw new Error("Manufacturer 'U10' not found in database.");
    }
    console.log('Manufacturer found:', manufacturer);

    // 2. Находим Brand
    const brand = await prisma.brand.findUnique({
      where: { name: "Douceur d'Intérieur" },
    });
    if (!brand) {
      throw new Error("Brand 'Douceur d\\'Intérieur' not found in database.");
    }
    console.log('Brand found:', brand);

    // 3. Создаем или обновляем PrivateLabel
    const privateLabel = await prisma.privateLabel.upsert({
      where: {
        brandId_manufacturerId: {
          brandId: brand.id,
          manufacturerId: manufacturer.id,
        },
      },
      update: {},
      create: {
        brandId: brand.id,
        manufacturerId: manufacturer.id,
      },
    });
    console.log('Private Label Created/Updated:', privateLabel);

  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
