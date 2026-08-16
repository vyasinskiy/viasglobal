import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const manufacturerName = 'ANRO';
  const brandName = 'ANRO';

  try {
    const manufacturer = await prisma.manufacturer.findUnique({
      where: { name: manufacturerName }
    });
    if (!manufacturer) {
      throw new Error(`Manufacturer '${manufacturerName}' not found in the database.`);
    }

    const brand = await prisma.brand.findUnique({
      where: { name: brandName }
    });
    if (!brand) {
      throw new Error(`Brand '${brandName}' not found in the database.`);
    }

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
