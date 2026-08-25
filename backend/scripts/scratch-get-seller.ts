import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  const seller = await prisma.seller.findFirst({
    where: { name: { contains: 'Craftelier', mode: 'insensitive' } }
  });
  console.log('Craftelier ID:', seller?.sellerId || 'Not found');
  process.exit(0);
}
run();
