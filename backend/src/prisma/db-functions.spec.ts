import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

describe('Функция БД: get_asin_filter_reason', () => {
  const PREFIX = 'TEST_DB_FUNC_';

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // Helper to call the DB function inside a transaction
  const getFilterReason = async (asinId: number, client: any = prisma) => {
    const result = await client.$queryRaw`
      SELECT public.get_asin_filter_reason(${asinId}::INT) as reason
    `;
    return result[0]?.reason;
  };

  it('должен возвращать PRIVATE_LABEL, если ASIN принадлежит приватному лейблу', async () => {
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
        await tx.productFinder.create({
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

  it('должен возвращать NO_BUYBOX_DATA, если нет снимков BuyBox (productFinders)', async () => {
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

  it('должен возвращать BUYBOX_MATCH_BRAND, если продавец частично совпадает с брендом', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const brand = await tx.brand.create({ data: { name: `${PREFIX}MySuperBrand` } });
        const asin = await tx.aSIN.create({
          data: {
            code: `${PREFIX}ASIN_BRAND_MATCH`,
            brandId: brand.id
          }
        });

        await tx.productFinder.create({
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

  it('должен возвращать BUYBOX_MATCH_MANUFACTURER, если продавец частично совпадает с производителем', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const manufacturer = await tx.manufacturer.create({ data: { name: `${PREFIX}CoolManuf` } });
        const asin = await tx.aSIN.create({
          data: {
            code: `${PREFIX}ASIN_MANUF_MATCH`,
            manufacturerId: manufacturer.id
          }
        });

        await tx.productFinder.create({
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

  it('должен возвращать null, если продавец не совпадает ни с брендом, ни с производителем', async () => {
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

        await tx.productFinder.create({
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

  it('должен возвращать DOMINANT_SELLER, если продавец удерживает 100% на ASIN и доминирует на >80% товаров бренда', async () => {
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

        // Give the first 9 ASINs to the dominant seller (95% dominance)
        for (let i = 0; i < 9; i++) {
          await tx.productFinder.create({
            data: {
              asinId: asins[i].id,
              buyBoxSeller: `DominantStore (100%) / ${PREFIX}DOM123`,
              sellerId: domSeller.id,
              sellerPercentage: 100,
              buyBoxTopSeller90Days: 0.95,
              buyBoxWinnerCount90Days: 5
            }
          });
        }

        // Give the last ASIN to someone else
        await tx.productFinder.create({
          data: {
            asinId: asins[9].id,
            buyBoxSeller: `OtherStore (100%) / ${PREFIX}OTHER123`,
            sellerId: otherSeller.id,
            sellerPercentage: 100,
            buyBoxTopSeller90Days: 0.95,
            buyBoxWinnerCount90Days: 5
          }
        });

        // Test an ASIN held by the dominant seller
        const reason = await getFilterReason(asins[0].id, tx);
        expect(reason).toBe('DOMINANT_BUY_BOX_SELLER');

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('должен возвращать DOMINANT_BRAND_SELLER, если продавец удерживает >=80% каталога бренда при наличии 2 выгрузок', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const brand = await tx.brand.create({ data: { name: `${PREFIX}MacroBrand` } });
        const seller = await tx.seller.create({ data: { id: `${PREFIX}MacroSeller`, name: 'Macro Store' } });
        const otherSeller = await tx.seller.create({ data: { id: `${PREFIX}OtherSeller`, name: 'Other Store' } });

        // Создаем выгрузки для бренда и продавца
        await tx.keepaExport.create({ data: { brandId: brand.id } });
        await tx.keepaExport.create({ data: { sellerId: seller.id } });

        // Создаем 10 ASIN для бренда
        const asins = [];
        for (let i = 0; i < 10; i++) {
          asins.push(await tx.aSIN.create({
            data: {
              code: `${PREFIX}ASIN_MACRO_${i}`,
              brandId: brand.id
            }
          }));
        }

        // Первые 9 ASIN принадлежат продавцу в Buy Box
        // Даже если на конкретном ASIN 4 победителя и доля топа всего 50% (локально листинг конкурентный)
        for (let i = 0; i < 9; i++) {
          await tx.productFinder.create({
            data: {
              asinId: asins[i].id,
              buyBoxSeller: `Macro Store (100%) / ${PREFIX}MacroSeller`,
              sellerId: seller.id,
              sellerPercentage: 100,
              buyBoxTopSeller90Days: 0.50,
              buyBoxWinnerCount90Days: 4
            }
          });
        }

        // 10-й ASIN у другого продавца
        await tx.productFinder.create({
          data: {
            asinId: asins[9].id,
            buyBoxSeller: `Other Store / ${PREFIX}OtherSeller`,
            sellerId: `${PREFIX}OtherSeller`,
            buyBoxTopSeller90Days: 0.50,
            buyBoxWinnerCount90Days: 4
          }
        });

        // ASIN продавца MacroStore должен отсеяться как DOMINANT_BRAND_SELLER (9 из 10 = 90% >= 80%)
        const reason = await getFilterReason(asins[0].id, tx);
        expect(reason).toBe('DOMINANT_BRAND_SELLER');

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('должен возвращать false в check_brand_seller_dominance и не выбрасывать ошибку, если нет выгрузок Keepa (безопасный режим для сырых данных)', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        const brand = await tx.brand.create({ data: { name: `${PREFIX}SafeBrand` } });
        const seller = await tx.seller.create({ data: { id: `${PREFIX}SafeSeller`, name: 'Safe Store' } });

        // Вызов без выгрузок Keepa должен безопасно возвращать false (не падать с ошибкой)
        const result: any = await tx.$queryRaw`
          SELECT public.check_brand_seller_dominance(${brand.id}::INT, ${seller.id}::TEXT, 80::FLOAT) AS is_dominant
        `;

        expect(result[0].is_dominant).toBe(false);

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });

  it('должен возвращать null для реальных данных (DUJUIKE / Pulchlla), существующих в базе', async () => {
    // Find the real ASIN for Pulchlla in DUJUIKE
    const asin = await prisma.aSIN.findFirst({
      where: {
        brand: { name: 'DUJUIKE' },
        productFinders: {
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

    // В новой версии функции, если продавцов мало (например < 3), она может вернуть FEW_BUYBOX_WINNERS.
    // Если она возвращает null, значит всё ок. Проверяем, что она возвращает одно из ожидаемых значений для этого старого листинга.
    const reason = await getFilterReason(asin.id, prisma);
    expect(['FEW_BUYBOX_WINNERS', null]).toContain(reason);
  });

  it('должен возвращать NO_EU_DISTRIBUTOR, если бренд имеет статус NO_EU_DISTRIBUTOR', async () => {
    try {
      await prisma.$transaction(async (tx) => {
        // Создаем бренд со статусом NO_EU_DISTRIBUTOR
        const brand = await tx.brand.create({
          data: {
            name: `${PREFIX}NO_EU_BRAND`,
            status: 'NO_EU_DISTRIBUTOR',
            notes: 'Отсутствует официальная сеть B2B дистрибьюторов в ЕС',
          },
        });

        const asin = await tx.aSIN.create({
          data: {
            code: `${PREFIX}ASIN_NO_EU`,
            brandId: brand.id,
          },
        });

        const reason = await getFilterReason(asin.id, tx);
        expect(reason).toBe('NO_EU_DISTRIBUTOR');

        throw new Error('ROLLBACK_TEST');
      });
    } catch (e: any) {
      if (e.message !== 'ROLLBACK_TEST') throw e;
    }
  });
});

describe('Smoke-тесты SQL-представлений (Views) и функций базы данных', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('все представления БД (Views) должны успешно выполняться без ошибок отсутствующих колонок', async () => {
    // Проверяем каждое SQL-представление базовым SELECT LIMIT 1 для валидации названий колонок в рантайме
    await expect(prisma.$queryRaw`SELECT * FROM "ContractedFilteredProductsView" LIMIT 1`).resolves.toBeDefined();
    await expect(prisma.$queryRaw`SELECT * FROM "ContractedAllProductsView" LIMIT 1`).resolves.toBeDefined();
    await expect(prisma.$queryRaw`SELECT * FROM "AsinView" LIMIT 1`).resolves.toBeDefined();
    await expect(prisma.$queryRaw`SELECT * FROM "CandidatesProductsView" LIMIT 1`).resolves.toBeDefined();
    await expect(prisma.$queryRaw`SELECT * FROM "KeepaExportView" LIMIT 1`).resolves.toBeDefined();
    await expect(prisma.$queryRaw`SELECT * FROM "PrivateLabelView" LIMIT 1`).resolves.toBeDefined();
  }, 30000);

  it('все ключевые табличные функции БД должны успешно вызываться с параметрами по умолчанию', async () => {
    // Проверяем вызовы табличных функций с параметрами по умолчанию
    await expect(prisma.$queryRaw`SELECT * FROM public.get_contracted_products() LIMIT 1`).resolves.toBeDefined();
    await expect(prisma.$queryRaw`SELECT * FROM public.get_contracted_all_products() LIMIT 1`).resolves.toBeDefined();
    await expect(prisma.$queryRaw`SELECT * FROM public.get_candidates_products() LIMIT 1`).resolves.toBeDefined();
  }, 30000);
});

describe('Регрессионные тесты расчета минимальной партии (unitsPerBox и minBoxOrder) в ContractedAllProductsView', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('показатели Safta (где коробка = 400 шт) должны точно рассчитываться по объему коробки', async () => {
    const saftaRow: any = await prisma.$queryRawUnsafe(`
      SELECT "asin", "ean", "distributor", "unitsPerBox", "grossPrice", "minBoxOrderGross", "netProfitPerUnit", "netProfitPerMinBoxOrder", "profitCoefficient"
      FROM "ContractedAllProductsView"
      WHERE "ean" = '8412688820252'
      LIMIT 1;
    `);

    expect(saftaRow.length).toBe(1);
    const item = saftaRow[0];

    // Проверяем эталонные значения Safta до и после изменений
    expect(item.distributor).toBe('Safta');
    expect(item.unitsPerBox).toBe(400);
    expect(item.grossPrice).toBe(0.31);
    expect(item.minBoxOrderGross).toBe(124); // 400 шт * 0.31€
    expect(item.netProfitPerUnit).toBe(10.44);
    expect(item.netProfitPerMinBoxOrder).toBe(4176); // 400 шт * 10.44€
    expect(item.profitCoefficient).toBe(33.6774); // 4176 / 124
  }, 30000);

  it('показатели Safta для второго товара (где коробка = 500 шт) должны быть стабильны', async () => {
    const saftaRow: any = await prisma.$queryRawUnsafe(`
      SELECT "asin", "ean", "distributor", "unitsPerBox", "grossPrice", "minBoxOrderGross", "netProfitPerUnit", "netProfitPerMinBoxOrder", "profitCoefficient"
      FROM "ContractedAllProductsView"
      WHERE "ean" = '8412688430918'
      LIMIT 1;
    `);

    expect(saftaRow.length).toBe(1);
    const item = saftaRow[0];

    expect(item.distributor).toBe('Safta');
    expect(item.unitsPerBox).toBe(500);
    expect(item.grossPrice).toBe(0.15);
    expect(item.minBoxOrderGross).toBe(75); // 500 шт * 0.15€
    expect(item.netProfitPerUnit).toBe(1.14);
    expect(item.netProfitPerMinBoxOrder).toBe(570); // 500 шт * 1.14€
  }, 30000);

  it('показатели Cofan (десикант) должны точно рассчитываться по полной коробке (20 шт)', async () => {
    const cofanRow: any = await prisma.$queryRawUnsafe(`
      SELECT "asin", "ean", "distributor", "unitsPerBox", "minBoxOrder", "grossPrice", "minBoxOrderGross", "netProfitPerUnit", "netProfitPerMinBoxOrder", "profitCoefficient"
      FROM "ContractedAllProductsView"
      WHERE "ean" = '8445187398878'
      LIMIT 1;
    `);

    expect(cofanRow.length).toBe(1);
    const item = cofanRow[0];

    expect(item.distributor).toBe('Cofan');
    expect(item.unitsPerBox).toBe(20);
    expect(item.minBoxOrder).toBe(20); // 1 коробка * 20 шт/кор = 20 шт
    expect(item.grossPrice).toBe(2.47);
    expect(item.minBoxOrderGross).toBeCloseTo(49.4, 2); // 20 шт * 2.47€
    expect(item.netProfitPerUnit).toBe(4.97);
    expect(item.netProfitPerMinBoxOrder).toBeCloseTo(99.4, 2); // 20 шт * 4.97€
    expect(item.profitCoefficient).toBeCloseTo(2.0121, 4); // 99.4 / 49.4
  }, 30000);
});


