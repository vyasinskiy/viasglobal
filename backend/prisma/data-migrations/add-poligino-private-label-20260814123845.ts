import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const manufacturerName = 'Poligino';
  const brandName = 'Poligino';

  try {
    // 1. Убеждаемся, что Manufacturer существует
    const manufacturer = await prisma.manufacturer.upsert({
      where: { name: manufacturerName },
      update: {},
      create: { name: manufacturerName },
    });
    console.log(`Manufacturer upserted: ${manufacturer.name}`);

    // 2. Убеждаемся, что Brand существует
    const brand = await prisma.brand.upsert({
      where: { name: brandName },
      update: {},
      create: { name: brandName },
    });
    console.log(`Brand upserted: ${brand.name}`);

    // 3. Создаем PrivateLabel (связка Manufacturer и Brand)
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
    console.log(`PrivateLabel upserted successfully for ${manufacturer.name} - ${brand.name}`);
  } catch (error) {
    console.error('Error during data migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
