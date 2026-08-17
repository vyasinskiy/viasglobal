import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function cleanString(str: string | undefined | null): string | null {
  if (!str) return null;
  return str.toString().replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '').trim();
}

async function cleanModel(
  modelName: 'brand' | 'manufacturer',
  relationField: 'brandId' | 'manufacturerId'
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = await (prisma[modelName] as any).findMany();
  
  for (const item of items) {
    const cleanName = cleanString(item.name);
    
    // If it has invisible chars or leading/trailing spaces
    if (cleanName && cleanName !== item.name) {
      console.log(`Cleaning ${modelName}: "${item.name}" -> "${cleanName}"`);
      
      // Check if clean version already exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingClean = await (prisma[modelName] as any).findUnique({ where: { name: cleanName } });
      
      if (existingClean) {
        // Merge: Update ASINs to point to the existing clean item
        await prisma.aSIN.updateMany({
          where: { [relationField]: item.id },
          data: { [relationField]: existingClean.id }
        });
        
        // Delete the dirty item (unless it's used in PrivateLabel, but let's hope it's not)
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (prisma[modelName] as any).delete({ where: { id: item.id } });
          console.log(`Merged and deleted dirty ${modelName} ${item.id}`);
        } catch (e) {
          console.log(`Could not delete dirty ${modelName} ${item.id} (might be referenced elsewhere)`);
        }
      } else {
        // Just rename
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma[modelName] as any).update({
          where: { id: item.id },
          data: { name: cleanName }
        });
        console.log(`Renamed ${modelName} ${item.id} to ${cleanName}`);
      }
    }
  }
}

async function cleanSellers() {
  const sellers = await prisma.seller.findMany();
  for (const seller of sellers) {
    const cleanName = cleanString(seller.name);
    if (cleanName && cleanName !== seller.name) {
      console.log(`Cleaning Seller name: "${seller.name}" -> "${cleanName}"`);
      await prisma.seller.update({
        where: { id: seller.id },
        data: { name: cleanName }
      });
    }
  }
}

async function cleanProductFinders() {
  const finders = await prisma.productFinder.findMany({
    where: {
      buyBoxSeller: { not: null }
    }
  });
  
  for (const finder of finders) {
    const cleanSeller = cleanString(finder.buyBoxSeller);
    if (cleanSeller && cleanSeller !== finder.buyBoxSeller) {
      console.log(`Cleaning ProductFinder ${finder.id} buyBoxSeller: "${finder.buyBoxSeller}" -> "${cleanSeller}"`);
      await prisma.productFinder.update({
        where: { id: finder.id },
        data: { buyBoxSeller: cleanSeller }
      });
    }
  }
}

async function main() {
  console.log('Cleaning Brands...');
  await cleanModel('brand', 'brandId');
  
  console.log('Cleaning Manufacturers...');
  await cleanModel('manufacturer', 'manufacturerId');
  
  console.log('Cleaning Sellers...');
  await cleanSellers();
  
  console.log('Cleaning ProductFinders...');
  await cleanProductFinders();
  
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
