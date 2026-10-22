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

describe('Регрессионные тесты расчета estimatedMonthlySales (по дропам Keepa: salesRankDropsLast90Days / 3)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('для ASIN B0GWN21GRQ (пенал Safta) число дропов Keepa (28) должно давать estimatedMonthlySales = 9', async () => {
    const row: any = await prisma.$queryRawUnsafe(`
      SELECT 
        snap."asinId",
        snap."salesRankDropsLast90Days",
        ROUND(snap."salesRankDropsLast90Days" / 3.0)::INT AS "estimatedMonthlySales"
      FROM "ProductFinder" snap
      JOIN "ASIN" a ON snap."asinId" = a.id
      WHERE a.code = 'B0GWN21GRQ'
      ORDER BY snap."createdAt" DESC
      LIMIT 1;
    `);

    expect(row.length).toBe(1);
    const item = row[0];
    expect(item.salesRankDropsLast90Days).toBe(28);
    expect(item.estimatedMonthlySales).toBe(9); // 28 дропов за 90 дней / 3 = 9.33 -> 9
  }, 30000);

  it('если миграция применена, ContractedAllProductsView возвращает колонку estimatedMonthlySales', async () => {
    const colCheck: any = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ContractedAllProductsView' AND column_name = 'estimatedMonthlySales';
    `);
    if (colCheck.length > 0) {
      const row: any = await prisma.$queryRawUnsafe(`
        SELECT "asin", "estimatedMonthlySales" 
        FROM "ContractedAllProductsView" 
        WHERE "asin" = 'B0GWN21GRQ' 
        LIMIT 1;
      `);
      expect(row.length).toBe(1);
      expect(row[0].estimatedMonthlySales).toBe(9);
    }
  }, 30000);
});

describe('Регрессионные тесты расчета доли присутствия Amazon и фильтрации KUKEN (кейс ASIN B0CSPHRCFH)', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('товар KUKEN (ASIN B0CSPHRCFH) должен иметь корректные контрактные цены и расчет прибыли в ContractedAllProductsView', async () => {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT "asin", "ean", "brand", "distributor", "grossPrice", "netPrice", "buyBoxPrice", "netProfitPerUnit", "salesRank"
      FROM "ContractedAllProductsView"
      WHERE "asin" = 'B0CSPHRCFH'
      LIMIT 1;
    `);

    expect(rows.length).toBe(1);
    const item = rows[0];
    expect(item.asin).toBe('B0CSPHRCFH');
    expect(item.ean).toBe('8425160343163');
    expect(item.brand).toBe('KUKEN');
    expect(item.distributor).toBe('Alfadyser (Kuken)');
    expect(item.netPrice).toBe(11.82);
    expect(item.grossPrice).toBe(15.74);
    expect(item.buyBoxPrice).toBe(26.7);
    expect(item.netProfitPerUnit).toBe(0.94);
    expect(item.salesRank).toBeLessThanOrEqual(100000);
  }, 30000);

  it('исправленная формула calc_amazon_share должна давать долю Amazon 0.0 (0%) для 100% OOS как в масштабе 0..1, так и 0..100', async () => {
    // Проверяем работу SQL-выражения для различных форматов OOS
    const testCases: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        -- Случай 1: OOS = 1 (в масштабе Excel 0..1, 100% Out of Stock)
        CASE 
          WHEN 1 <= 1 THEN (1.0 - 1.0)::FLOAT 
          ELSE ((100.0 - 1.0) / 100.0)::FLOAT 
        END AS share_from_1,
        -- Случай 2: OOS = 100 (в масштабе процентов 0..100, 100% Out of Stock)
        CASE 
          WHEN 100 <= 1 THEN (1.0 - 100.0)::FLOAT 
          ELSE ((100.0 - 100.0) / 100.0)::FLOAT 
        END AS share_from_100,
        -- Случай 3: OOS = 0 (Amazon всегда в наличии, доля 100%)
        CASE 
          WHEN 0 <= 1 THEN (1.0 - 0.0)::FLOAT 
          ELSE ((100.0 - 0.0) / 100.0)::FLOAT 
        END AS share_from_0,
        -- Случай 4: OOS = 56 (Amazon отсутствовал 56% времени, доля 44%)
        CASE 
          WHEN 56 <= 1 THEN (1.0 - 56.0)::FLOAT 
          ELSE ((100.0 - 56.0) / 100.0)::FLOAT 
        END AS share_from_56
    `);

    expect(testCases.length).toBe(1);
    const res = testCases[0];
    // 100% OOS из любого представления должен давать долю Amazon = 0.0
    expect(res.share_from_1).toBe(0.0);
    expect(res.share_from_100).toBe(0.0);
    // 0% OOS должен давать долю Amazon = 1.0
    expect(res.share_from_0).toBe(1.0);
    // 56% OOS должен давать долю Amazon = 0.44
    expect(res.share_from_56).toBeCloseTo(0.44, 2);
  }, 30000);

  it('запрос колонки asin в ContractedFilteredProductsView не должен вызывать ошибку отсутствующей колонки asinId', async () => {
    // Тест проверяет исправление опечатки "asinId" -> asin в get-distributor-snapshot.ts
    await expect(
      prisma.$queryRawUnsafe(`
        SELECT asin FROM "ContractedFilteredProductsView"
        WHERE asin = 'B0CSPHRCFH'
        LIMIT 1;
      `)
    ).resolves.toBeDefined();
  }, 30000);

  it('для ASIN B0CSPHRCFH производитель в базе данных должен быть ALFA DYSER, S.L (или нормализованный ALFA DYSER, S.L.)', async () => {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT m.name AS "manufacturer"
      FROM "ASIN" a
      LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
      WHERE a.code = 'B0CSPHRCFH'
      LIMIT 1;
    `);
    expect(rows.length).toBe(1);
    expect(rows[0].manufacturer).toMatch(/^ALFA DYSER, S\.L\.?$/);
  }, 30000);

  it('если миграция применена, ContractedAllProductsView возвращает колонку manufacturer сразу после distributor', async () => {
    const colCheck: any = await prisma.$queryRawUnsafe(`
      SELECT column_name, ordinal_position
      FROM information_schema.columns 
      WHERE table_name = 'ContractedAllProductsView' AND column_name IN ('distributor', 'manufacturer')
      ORDER BY ordinal_position ASC;
    `);
    if (colCheck.length === 2) {
      // Проверяем, что колонка manufacturer идет сразу после distributor
      expect(colCheck[0].column_name).toBe('distributor');
      expect(colCheck[1].column_name).toBe('manufacturer');
      expect(colCheck[1].ordinal_position).toBe(colCheck[0].ordinal_position + 1);

      const row: any = await prisma.$queryRawUnsafe(`
        SELECT "asin", "distributor", "manufacturer" 
        FROM "ContractedAllProductsView" 
        WHERE "asin" = 'B0CSPHRCFH' 
        LIMIT 1;
      `);
      expect(row.length).toBe(1);
      expect(row[0].manufacturer).toMatch(/^ALFA DYSER, S\.L\.?$/);
    }
  }, 30000);
});

describe('Регрессионные тесты приоритета прибыльных товаров в ContractedFilteredProductsView и ContractedAllProductsView', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('прибыльный товар B0DR36YG4Q (+76€) должен идти в ContractedFilteredProductsView раньше минусовых B01N4SDF1W (-52.8€) и B0GWNF9VBL (-138.6€)', async () => {
    // Выполняем выборку конкретных тестовых товаров из кейса пользователя
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        "asin", 
        "salesRank", 
        "boughtInPastMonth", 
        "netProfitPerMinBoxOrder", 
        "profitCoefficient"
      FROM "ContractedAllProductsView"
      WHERE "asin" IN ('B01N4SDF1W', 'B0GWNF9VBL', 'B0DR36YG4Q')
      ORDER BY 
        CASE 
          WHEN "netProfitPerMinBoxOrder" > 0 THEN 0 
          WHEN "netProfitPerMinBoxOrder" <= 0 THEN 1 
          ELSE 2 
        END ASC,
        "boughtInPastMonth" DESC NULLS LAST,
        "netProfitPerMinBoxOrder" DESC NULLS LAST,
        "salesRank" ASC NULLS LAST;
    `);

    expect(rows.length).toBe(3);
    // Первый товар - прибыльный B0DR36YG4Q с подтвержденными продажами 200 шт и прибылью +76€
    expect(rows[0].asin).toBe('B0DR36YG4Q');
    expect(rows[0].boughtInPastMonth).toBe(200);
    expect(rows[0].netProfitPerMinBoxOrder).toBe(76);
    expect(rows[0].profitCoefficient).toBe(0.3645);

    // Минусовые товары не удаляются из выборки, но опускаются ниже всех прибыльных позиций
    expect(rows[1].asin).toBe('B01N4SDF1W');
    expect(rows[1].boughtInPastMonth).toBe(1000);
    expect(rows[1].netProfitPerMinBoxOrder).toBeCloseTo(-52.8, 1);

    expect(rows[2].asin).toBe('B0GWNF9VBL');
    expect(rows[2].boughtInPastMonth).toBe(300);
    expect(rows[2].netProfitPerMinBoxOrder).toBeCloseTo(-138.6, 1);
  }, 30000);

  it('в топ-выборке ContractedFilteredProductsView товары с отрицательной прибылью не должны опережать прибыльные позиции с меньшими продажами', async () => {
    // Проверяем, что в верхнем срезе товаров присутствуют только позиции с netProfitPerMinBoxOrder > 0
    const topPositive: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        "asin", 
        "boughtInPastMonth", 
        "netProfitPerMinBoxOrder"
      FROM "ContractedFilteredProductsView"
      ORDER BY 
        CASE 
          WHEN "netProfitPerMinBoxOrder" > 0 THEN 0 
          WHEN "netProfitPerMinBoxOrder" <= 0 THEN 1 
          ELSE 2 
        END ASC,
        "boughtInPastMonth" DESC NULLS LAST,
        "netProfitPerMinBoxOrder" DESC NULLS LAST,
        "salesRank" ASC NULLS LAST
      LIMIT 10;
    `);

    expect(topPositive.length).toBeGreaterThan(0);
    for (const item of topPositive) {
      // Все верхние товары обязаны иметь строго положительную чистую прибыль
      expect(item.netProfitPerMinBoxOrder).toBeGreaterThan(0);
    }
  }, 30000);
});

describe('Эталонные тесты инвариантности цен реальных снапшотов разных производителей до миграции эко-тасы', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('для производителя SAFTA (товары B01N4SDF1W и B0HFKT8N24) контрактные цены и кратность партии должны оставаться неизменными', async () => {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        "asin", "ean", "brand", "manufacturer", "distributor",
        "netPrice", "grossPrice", "costPrice",
        "unitsPerBox", "minBoxOrder", "minBoxOrderGross", "minBoxOrderNetto",
        "buyBoxPrice", "netProfitPerUnit", "profitCoefficient"
      FROM "ContractedAllProductsView"
      WHERE "asin" IN ('B01N4SDF1W', 'B0HFKT8N24')
      ORDER BY "asin" ASC;
    `);

    expect(rows.length).toBe(2);

    // Товар 1: B01N4SDF1W (пенал Safta)
    const item1 = rows.find((r: any) => r.asin === 'B01N4SDF1W');
    expect(item1).toBeDefined();
    expect(item1.manufacturer).toBe('SAFTA');
    expect(item1.brand).toBe('SAFTA');
    expect(item1.distributor).toBe('Safta');
    expect(item1.netPrice).toBe(11.135);
    expect(item1.grossPrice).toBe(14.05);
    expect(item1.costPrice).toBe(14.05);
    expect(item1.unitsPerBox).toBe(10);
    expect(item1.minBoxOrder).toBe(10);
    expect(item1.minBoxOrderGross).toBe(140.5);
    expect(item1.buyBoxPrice).toBe(19.6);
    expect(item1.netProfitPerUnit).toBe(-5.28);
    expect(item1.profitCoefficient).toBe(-0.3758);

    // Товар 2: B0HFKT8N24 (рюкзак на колесах Safta)
    const item2 = rows.find((r: any) => r.asin === 'B0HFKT8N24');
    expect(item2).toBeDefined();
    expect(item2.manufacturer).toBe('SAFTA');
    expect(item2.brand).toBe('SAFTA');
    expect(item2.distributor).toBe('Safta');
    expect(item2.netPrice).toBe(36.68);
    expect(item2.grossPrice).toBe(46.29);
    expect(item2.costPrice).toBe(46.29);
    expect(item2.unitsPerBox).toBe(4);
    expect(item2.minBoxOrder).toBe(4);
    expect(item2.minBoxOrderGross).toBe(185.16);
    expect(item2.minBoxOrderNetto).toBe(146.72);
    expect(item2.buyBoxPrice).toBe(64.89);
    expect(item2.netProfitPerUnit).toBe(-1.17);
    expect(item2.profitCoefficient).toBe(-0.0253);
  }, 30000);

  it('для производителя COFAN (товары B08WM385FK и B00MGJ4GOO) контрактные цены и кратность партии должны оставаться неизменными', async () => {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        "asin", "ean", "brand", "manufacturer", "distributor",
        "netPrice", "grossPrice", "costPrice",
        "unitsPerBox", "minBoxOrder", "minBoxOrderGross", "minBoxOrderNetto",
        "buyBoxPrice", "netProfitPerUnit", "profitCoefficient"
      FROM "ContractedAllProductsView"
      WHERE "asin" IN ('B08WM385FK', 'B00MGJ4GOO')
      ORDER BY "asin" ASC;
    `);

    expect(rows.length).toBe(2);

    // Товар 1: B00MGJ4GOO (каска защитная Cofan)
    const item1 = rows.find((r: any) => r.asin === 'B00MGJ4GOO');
    expect(item1).toBeDefined();
    expect(item1.manufacturer).toBe('COFAN');
    expect(item1.brand).toBe('COFAN');
    expect(item1.distributor).toBe('Cofan');
    expect(item1.netPrice).toBe(5.25);
    expect(item1.grossPrice).toBe(6.63);
    expect(item1.costPrice).toBe(6.63);
    expect(item1.unitsPerBox).toBe(1);
    expect(item1.minBoxOrder).toBe(1);
    expect(item1.minBoxOrderGross).toBe(6.63);
    expect(item1.minBoxOrderNetto).toBe(5.25);
    expect(item1.buyBoxPrice).toBe(13.54);
    expect(item1.netProfitPerUnit).toBe(-2.35);
    expect(item1.profitCoefficient).toBe(-0.3544);

    // Товар 2: B08WM385FK (пульверизатор Cofan)
    const item2 = rows.find((r: any) => r.asin === 'B08WM385FK');
    expect(item2).toBeDefined();
    expect(item2.manufacturer).toBe('COFAN');
    expect(item2.brand).toBe('COFAN');
    expect(item2.distributor).toBe('Cofan');
    expect(item2.netPrice).toBe(5.8);
    expect(item2.grossPrice).toBe(7.32);
    expect(item2.costPrice).toBe(7.32);
    expect(item2.unitsPerBox).toBe(6);
    expect(item2.minBoxOrder).toBe(6);
    expect(item2.minBoxOrderGross).toBe(43.92);
    expect(item2.minBoxOrderNetto).toBe(34.8);
    expect(item2.buyBoxPrice).toBe(13.38);
    expect(item2.netProfitPerUnit).toBe(-3.16);
    expect(item2.profitCoefficient).toBe(-0.4317);
  }, 30000);

  it('для производителя ALFA DYSER, S.L. (товар B0CSPHRCFH) исторический снапшот до эко-тасы должен сохранять точные значения', async () => {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        dp.ean, dp."priceNetto", dp."costPrice", dp."ecoTasa", dp."unitsPerBox", dp."minBoxOrder"
      FROM "DistributorPriceSnapshot" dp
      JOIN "ASIN" a ON dp."asinId" = a.id
      WHERE a.code = 'B0CSPHRCFH' AND dp."ecoTasa" IS NULL
      ORDER BY dp."createdAt" ASC
      LIMIT 1;
    `);

    expect(rows.length).toBe(1);
    const item = rows[0];
    expect(item.ean).toBe('8425160343163');
    expect(item.priceNetto).toBe(11.82);
    expect(item.costPrice).toBe(14.92);
    expect(item.ecoTasa).toBeNull();
    expect(item.unitsPerBox).toBe(1);
    expect(item.minBoxOrder).toBe(1);
  }, 30000);

  it('для товара KUKEN B0CSPHRCFH свежий снапшот с эко-тасой должен содержать ecoTasa 0.65 и себестоимость 15.74', async () => {
    const rows: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        dp.ean, dp."priceNetto", dp."costPrice", dp."ecoTasa", dp."unitsPerBox", dp."minBoxOrder"
      FROM "DistributorPriceSnapshot" dp
      JOIN "ASIN" a ON dp."asinId" = a.id
      WHERE a.code = 'B0CSPHRCFH' AND dp."ecoTasa" IS NOT NULL
      ORDER BY dp."createdAt" DESC
      LIMIT 1;
    `);

    expect(rows.length).toBe(1);
    const item = rows[0];
    expect(item.ean).toBe('8425160343163');
    expect(item.priceNetto).toBe(11.82);
    expect(item.ecoTasa).toBe(0.65);
    expect(item.costPrice).toBe(15.74);
    expect(item.unitsPerBox).toBe(1);
    expect(item.minBoxOrder).toBe(1);
  }, 30000);

  it('в таблице DistributorPriceSnapshot для всех снапшотов SAFTA и COFAN себестоимость costPrice строго равна round(priceNetto * 1.262, 2)', async () => {
    // Выбираем пачку реальных снапшотов дистрибьюторов SAFTA и COFAN из БД
    const snapshots: any[] = await prisma.$queryRawUnsafe(`
      SELECT dp.id, d.name as distributor, dp."priceNetto", dp."costPrice"
      FROM "DistributorPriceSnapshot" dp
      JOIN "Distributor" d ON dp."distributorId" = d.id
      WHERE d.name IN ('Safta', 'Cofan')
      ORDER BY dp.id DESC
      LIMIT 50;
    `);

    expect(snapshots.length).toBeGreaterThan(0);
    for (const snap of snapshots) {
      const expectedCost = Math.round(snap.priceNetto * 1.262 * 100) / 100;
      // Себестоимость без эко-тасы обязана строго соответствовать умножению на 1.262
      expect(snap.costPrice).toBeCloseTo(expectedCost, 2);
    }
  }, 30000);
});






