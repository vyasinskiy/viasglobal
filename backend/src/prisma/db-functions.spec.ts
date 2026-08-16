import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

describe('DB Function: get_asin_filter_reason', () => {
  const PREFIX = 'TEST_DB_FUNC_';

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Helper to call the DB function inside a transaction
  const getFilterReason = async (asinId: number, tx: any): Promise<string> => {
    const result = await tx.$queryRaw<{ reason: string }[]>`
      SELECT public.get_asin_filter_reason(${asinId}) as reason
    `;
    return result[0]?.reason;
  };

  it('should return PRIVATE_LABEL if ASIN belongs to a private label', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const brand = await tx.brand.create({ data: { name: `${PREFIX}BRAND_PL` } });
        const seller = await tx.seller.create({ data: { id: `${PREFIX}SELLER_PL`, name: 'Test Seller' } });
        
        await tx.privateLabel.create({
          data: {
            brandId: brand.id,
            sellerId: seller.id
          }
        });

        const asin = await tx.aSIN.create({
          data: {
            code: `${PREFIX}ASIN_PL`,
            brandId: brand.id
          }
        });

        // Function relies on snapshot for the current seller
        await tx.asinSnapshot.create({
          data: {
            asinId: asin.id,
            buyBoxSeller: `Test Seller (100%) / ${PREFIX}SELLER_PL`,
            sellerId: seller.id,
            sellerPercentage: 100
          }
        });

        const reason = await getFilterReason(asin.id, tx);
        expect(reason).toBe('PRIVATE_LABEL');

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('should return NO_BUYBOX_DATA if there are no snapshots', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const asin = await tx.aSIN.create({
          data: {
            code: `${PREFIX}ASIN_NO_DATA`
          }
        });

        const reason = await getFilterReason(asin.id, tx);
        expect(reason).toBe('NO_BUYBOX_DATA');

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('should return BUYBOX_MATCH_BRAND if seller partially matches brand', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const brand = await tx.brand.create({ data: { name: `${PREFIX}MySuperBrand` } });
        const asin = await tx.aSIN.create({
          data: {
            code: `${PREFIX}ASIN_BRAND_MATCH`,
            brandId: brand.id
          }
        });

        await tx.asinSnapshot.create({
          data: {
            asinId: asin.id,
            buyBoxSeller: `Store of ${PREFIX}MySuperBrand LLC`
          }
        });

        const reason = await getFilterReason(asin.id, tx);
        expect(reason).toBe('BUYBOX_MATCH_BRAND');

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('should return BUYBOX_MATCH_MANUFACTURER if seller partially matches manufacturer', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const manufacturer = await tx.manufacturer.create({ data: { name: `${PREFIX}CoolManuf` } });
        const asin = await tx.aSIN.create({
          data: {
            code: `${PREFIX}ASIN_MANUF_MATCH`,
            manufacturerId: manufacturer.id
          }
        });

        await tx.asinSnapshot.create({
          data: {
            asinId: asin.id,
            buyBoxSeller: `Official ${PREFIX}CoolManuf Dealer`
          }
        });

        const reason = await getFilterReason(asin.id, tx);
        expect(reason).toBe('BUYBOX_MATCH_MANUFACTURER');

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('should return null if seller does not match brand or manufacturer', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const brand = await tx.brand.create({ data: { name: `${PREFIX}RandomBrand` } });
        const manufacturer = await tx.manufacturer.create({ data: { name: `${PREFIX}RandomManuf` } });
        const asin = await tx.aSIN.create({
          data: {
            code: `${PREFIX}ASIN_OK`,
            brandId: brand.id,
            manufacturerId: manufacturer.id
          }
        });

        await tx.asinSnapshot.create({
          data: {
            asinId: asin.id,
            buyBoxSeller: 'Completely Unrelated Seller'
          }
        });

        const reason = await getFilterReason(asin.id, tx);
        expect(reason).toBeNull();

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('should return DOMINANT_SELLER if seller has 100% on ASIN and dominates >80% of brand ASINs', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const brand = await tx.brand.create({ data: { name: `${PREFIX}DomBrand` } });
        const manufacturer = await tx.manufacturer.create({ data: { name: `${PREFIX}DomManuf` } });
        
        const domSeller = await tx.seller.create({ data: { id: `${PREFIX}DOM123`, name: 'DominantStore' } });
        const otherSeller = await tx.seller.create({ data: { id: `${PREFIX}OTHER123`, name: 'OtherStore' } });

        // Create 10 ASINs for this Brand+Manuf combo
        const asins = [];
        for (let i = 0; i < 10; i++) {
          asins.push(await tx.aSIN.create({
            data: {
              code: `${PREFIX}ASIN_DOM_${i}`,
              brandId: brand.id,
              manufacturerId: manufacturer.id
            }
          }));
        }

        // Give the first 9 ASINs to the dominant seller (90% dominance)
        for (let i = 0; i < 9; i++) {
          await tx.asinSnapshot.create({
            data: {
              asinId: asins[i].id,
              buyBoxSeller: `DominantStore (100%) / ${PREFIX}DOM123`,
              sellerId: domSeller.id,
              sellerPercentage: 100
            }
          });
        }

        // Give the last ASIN to someone else
        await tx.asinSnapshot.create({
          data: {
            asinId: asins[9].id,
            buyBoxSeller: `OtherStore (100%) / ${PREFIX}OTHER123`,
            sellerId: otherSeller.id,
            sellerPercentage: 100
          }
        });

        // Test an ASIN held by the dominant seller
        const reason = await getFilterReason(asins[0].id, tx);
        expect(reason).toBe('DOMINANT_SELLER');

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('should return null for real data (DUJUIKE / Pulchlla) existing in the database', async () => {
    // Find the real ASIN for Pulchlla in DUJUIKE
    const asin = await prisma.aSIN.findFirst({
      where: {
        brand: { name: 'DUJUIKE' },
        snapshots: {
          some: {
            buyBoxSeller: { contains: 'Pulchlla' }
          }
        }
      }
    });

    if (!asin) {
      console.warn('Real DUJUIKE data not found in DB. Skipping test.');
      return;
    }

    // Call the function directly on the real database without a transaction
    const reason = await getFilterReason(asin.id, prisma);
    expect(reason).toBeNull();
  });
});
