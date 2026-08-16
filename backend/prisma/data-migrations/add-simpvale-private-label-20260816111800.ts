import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const manufacturerName = 'SIMPVALE';
  const brandName = 'SIMPVALE';

  // Ищем производителя по имени
  const manufacturer = await prisma.manufacturer.findUnique({
    where: { name: manufacturerName },
  });
  if (!manufacturer) {
    throw new Error(`Manufacturer "${manufacturerName}" not found`);
  }

  // Ищем бренд по имени
  const brand = await prisma.brand.findUnique({
    where: { name: brandName },
  });
  if (!brand) {
    throw new Error(`Brand "${brandName}" not found`);
  }

  // Выполняем upsert для PrivateLabel, используя составной ключ brandId_manufacturerId
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

  console.log(`Private label for ${manufacturerName} and ${brandName} has been upserted successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
