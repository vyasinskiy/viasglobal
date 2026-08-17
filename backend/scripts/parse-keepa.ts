import xlsx from 'xlsx';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Использование: cd backend && npx tsx ../.agents/skills/parse-keepa/scripts/parse-keepa.ts <путь_к_файлу.xlsx>');
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), inputFile);
if (!fs.existsSync(resolvedPath)) {
  console.error(`Файл не найден: ${resolvedPath}`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Убираем невидимые символы (Zero-width space, Left-to-Right mark, и т.д.)
function cleanString(str: string | undefined | null): string | null {
  if (!str) return null;
  return str.toString().replace(/[\u200B-\u200D\uFEFF\u200E\u200F]/g, '').trim();
}

/**
 * Парсит строку продавца из Keepa (например: "paramount city (80%) / A2125XITGCFM0Q" или "Seller Name / A1234567").
 * Извлекает только чистое название продавца (без рейтинга в процентах) и его Seller ID.
 *
 * @param rawSeller Исходная строка продавца из выгрузки Keepa
 * @returns Объект с полями sellerName (чистое название) и sellerId (уникальный ID продавца)
 */
function parseSellerInfo(rawSeller: string | null | undefined): {
  sellerName: string | null;
  sellerId: string | null;
} {
  if (!rawSeller) {
    return { sellerName: null, sellerId: null };
  }

  const clean = cleanString(rawSeller);
  if (!clean) {
    return { sellerName: null, sellerId: null };
  }

  // Если есть разделитель " / " между именем продавца и его ID
  if (clean.includes(' / ')) {
    const parts = clean.split(' / ');
    const rawName = parts[0] || '';
    const id = parts.slice(1).join(' / ').trim() || null;

    // Удаляем из имени продавца скобки с процентами рейтинга, например " (80%)"
    const name = rawName.replace(/\s*\(\d+%\)\s*$/, '').trim() || null;

    return {
      sellerName: name,
      sellerId: id,
    };
  }

  // Если разделителя " / " нет (например, "Amazon" или "Store Name (100%)")
  const name = clean.replace(/\s*\(\d+%\)\s*$/, '').trim() || null;
  return {
    sellerName: name,
    sellerId: null,
  };
}

async function main() {
  try {
    console.log(`Читаем файл: ${resolvedPath}...`);
    const workbook = xlsx.readFile(resolvedPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    const rows = xlsx.utils.sheet_to_json(sheet) as any[];
    console.log(`Найдено строк: ${rows.length}`);

    const uniqueAsins = new Set<string>();
    const uniqueBrands = new Set<string>();
    const uniqueManufacturers = new Set<string>();

    for (const row of rows) {
      const asin = row['ASIN'];
      const brand = row['Brand'];
      const manufacturer = row['Manufacturer'];

      if (asin && typeof asin === 'string') uniqueAsins.add(asin.trim());
      if (brand && typeof brand === 'string') uniqueBrands.add(brand.trim());
      if (manufacturer && typeof manufacturer === 'string') uniqueManufacturers.add(manufacturer.trim());
    }

    console.log(`\nУникальных ASIN: ${uniqueAsins.size}`);
    console.log(`Уникальных Брендов: ${uniqueBrands.size}`);
    console.log(`Уникальных Производителей: ${uniqueManufacturers.size}`);
    console.log('\nДобавляем новые записи в базу данных...');

    // 1. Добавляем Бренды
    let newBrandsCount = 0;
    for (const brand of uniqueBrands) {
      if (!brand) continue;
      const existing = await prisma.brand.findUnique({ where: { name: brand } });
      if (!existing) {
        await prisma.brand.create({ data: { name: brand } });
        newBrandsCount++;
      }
    }

    // 2. Добавляем Производителей
    let newManufacturersCount = 0;
    for (const manufacturer of uniqueManufacturers) {
      if (!manufacturer) continue;
      const existing = await prisma.manufacturer.findUnique({ where: { name: manufacturer } });
      if (!existing) {
        await prisma.manufacturer.create({ data: { name: manufacturer } });
        newManufacturersCount++;
      }
    }

    // 3. Добавляем ASIN-ы и связываем их с брендом и производителем
    let newAsinsCount = 0;
    let newSnapshotsCount = 0;
    for (const row of rows) {
      const asinCode = row['ASIN']?.toString().trim();
      if (!asinCode) continue;

      const brandName = cleanString(row['Brand']);
      const manufacturerName = cleanString(row['Manufacturer']);
      const buyBoxSeller = cleanString(row['Buy Box: Buy Box Seller']);

      let currentAsin = await prisma.aSIN.findUnique({ where: { code: asinCode } });
      
      if (!currentAsin) {
        // Находим id бренда и производителя
        let brandId = null;
        let manufacturerId = null;

        if (brandName) {
          const b = await prisma.brand.findUnique({ where: { name: brandName } });
          if (b) brandId = b.id;
        }

        if (manufacturerName) {
          const m = await prisma.manufacturer.findUnique({ where: { name: manufacturerName } });
          if (m) manufacturerId = m.id;
        }

        currentAsin = await prisma.aSIN.create({
          data: {
            code: asinCode,
            brandId: brandId,
            manufacturerId: manufacturerId
          }
        });
        newAsinsCount++;
      }

      // Парсим продавца: извлекаем чистое имя и ID (игнорируя процент рейтинга)
      const { sellerName, sellerId } = parseSellerInfo(buyBoxSeller);

      if (sellerId && sellerName) {
        const existingSeller = await prisma.seller.findUnique({ where: { id: sellerId } });
        if (!existingSeller) {
          // Создаем нового продавца
          await prisma.seller.create({
            data: {
              id: sellerId,
              name: sellerName
            }
          });
          // Создаем снапшот продавца
          await prisma.sellerSnapshot.create({
            data: {
              sellerId: sellerId,
              name: sellerName
            }
          });
        } else if (existingSeller.name !== sellerName) {
          // Обновляем имя продавца, если оно изменилось
          await prisma.seller.update({
            where: { id: sellerId },
            data: { name: sellerName }
          });
          await prisma.sellerSnapshot.create({
            data: {
              sellerId: sellerId,
              name: sellerName
            }
          });
        }
      }

      // Создаем снапшот ASIN
      const snapshotData: any = {
        asinId: currentAsin.id,
        buyBoxSeller: buyBoxSeller,
        sellerId: sellerId,
        sellerPercentage: null
      };

    // Locale
    if (row['Locale'] !== undefined && row['Locale'] !== null) snapshotData.locale = String(row['Locale']);

    // Image
    if (row['Image'] !== undefined && row['Image'] !== null) snapshotData.image = String(row['Image']);

    // Title
    if (row['Title'] !== undefined && row['Title'] !== null) snapshotData.title = String(row['Title']);

    // Item Highlights
    if (row['Item Highlights'] !== undefined && row['Item Highlights'] !== null) snapshotData.itemHighlights = String(row['Item Highlights']);

    // Sales Rank: Current
    const val_salesRankCurrent = parseInt(row['Sales Rank: Current']);
    if (!isNaN(val_salesRankCurrent)) snapshotData.salesRankCurrent = val_salesRankCurrent;

    // Sales Rank: 90 days avg.
    const val_salesRank90DaysAvg = parseInt(row['Sales Rank: 90 days avg.']);
    if (!isNaN(val_salesRank90DaysAvg)) snapshotData.salesRank90DaysAvg = val_salesRank90DaysAvg;

    // Sales Rank: 90 days drop %
    const val_salesRank90DaysDrop = parseFloat(row['Sales Rank: 90 days drop %']);
    if (!isNaN(val_salesRank90DaysDrop)) snapshotData.salesRank90DaysDrop = val_salesRank90DaysDrop;

    // Sales Rank: Drops last 90 days
    const val_salesRankDropsLast90Days = parseInt(row['Sales Rank: Drops last 90 days']);
    if (!isNaN(val_salesRankDropsLast90Days)) snapshotData.salesRankDropsLast90Days = val_salesRankDropsLast90Days;

    // Sales Rank: Reference
    if (row['Sales Rank: Reference'] !== undefined && row['Sales Rank: Reference'] !== null) snapshotData.salesRankReference = String(row['Sales Rank: Reference']);

    // Sales Rank: Display Group
    if (row['Sales Rank: Display Group'] !== undefined && row['Sales Rank: Display Group'] !== null) snapshotData.salesRankDisplayGroup = String(row['Sales Rank: Display Group']);

    // Sales Rank: Subcategory Sales Ranks
    if (row['Sales Rank: Subcategory Sales Ranks'] !== undefined && row['Sales Rank: Subcategory Sales Ranks'] !== null) snapshotData.salesRankSubcategorySalesRanks = String(row['Sales Rank: Subcategory Sales Ranks']);

    // Monthly Sales Trends: Bought in past month
    if (row['Monthly Sales Trends: Bought in past month'] !== undefined && row['Monthly Sales Trends: Bought in past month'] !== null) snapshotData.monthlySalesTrendsBoughtInPastMonth = String(row['Monthly Sales Trends: Bought in past month']);

    // Monthly Sales Trends: 90 days change % monthly sold
    if (row['Monthly Sales Trends: 90 days change % monthly sold'] !== undefined && row['Monthly Sales Trends: 90 days change % monthly sold'] !== null) snapshotData.monthlySalesTrends90DaysChangeMonthlySold = String(row['Monthly Sales Trends: 90 days change % monthly sold']);

    // Return Rate
    if (row['Return Rate'] !== undefined && row['Return Rate'] !== null) snapshotData.returnRate = String(row['Return Rate']);

    // Reviews: Rating
    const val_reviewsRating = parseFloat(row['Reviews: Rating']);
    if (!isNaN(val_reviewsRating)) snapshotData.reviewsRating = val_reviewsRating;

    // Reviews: Rating Count
    const val_reviewsRatingCount = parseInt(row['Reviews: Rating Count']);
    if (!isNaN(val_reviewsRatingCount)) snapshotData.reviewsRatingCount = val_reviewsRatingCount;

    // Reviews: Rating Count - 90 days drop %
    if (row['Reviews: Rating Count - 90 days drop %'] !== undefined && row['Reviews: Rating Count - 90 days drop %'] !== null) snapshotData.reviewsRatingCount90DaysDrop = String(row['Reviews: Rating Count - 90 days drop %']);

    // Reviews: Review Count - Format Specific
    const val_reviewsReviewCountFormatSpecific = parseInt(row['Reviews: Review Count - Format Specific']);
    if (!isNaN(val_reviewsReviewCountFormatSpecific)) snapshotData.reviewsReviewCountFormatSpecific = val_reviewsReviewCountFormatSpecific;

    // Last Price Change
    const val_lastPriceChange = parseFloat(row['Last Price Change']);
    if (!isNaN(val_lastPriceChange)) snapshotData.lastPriceChange = val_lastPriceChange;

    // Buy Box: Current
    const val_buyBoxCurrent = parseFloat(row['Buy Box: Current']);
    if (!isNaN(val_buyBoxCurrent)) snapshotData.buyBoxCurrent = val_buyBoxCurrent;

    // Buy Box: 90 days avg.
    const val_buyBox90DaysAvg = parseFloat(row['Buy Box: 90 days avg.']);
    if (!isNaN(val_buyBox90DaysAvg)) snapshotData.buyBox90DaysAvg = val_buyBox90DaysAvg;

    // Buy Box: 90 days drop %
    if (row['Buy Box: 90 days drop %'] !== undefined && row['Buy Box: 90 days drop %'] !== null) snapshotData.buyBox90DaysDrop = String(row['Buy Box: 90 days drop %']);

    // Buy Box: Stock
    const val_buyBoxStock = parseInt(row['Buy Box: Stock']);
    if (!isNaN(val_buyBoxStock)) snapshotData.buyBoxStock = val_buyBoxStock;

    // Buy Box: 90 days OOS
    const val_buyBox90DaysOOS = parseFloat(row['Buy Box: 90 days OOS']);
    if (!isNaN(val_buyBox90DaysOOS)) snapshotData.buyBox90DaysOOS = val_buyBox90DaysOOS;

    // Buy Box: Buy Box Seller
    if (row['Buy Box: Buy Box Seller'] !== undefined && row['Buy Box: Buy Box Seller'] !== null) snapshotData.buyBoxSellerName = String(row['Buy Box: Buy Box Seller']);

    // Buy Box: Shipping Country
    if (row['Buy Box: Shipping Country'] !== undefined && row['Buy Box: Shipping Country'] !== null) snapshotData.buyBoxShippingCountry = String(row['Buy Box: Shipping Country']);

    // Buy Box: Strikethrough Price
    if (row['Buy Box: Strikethrough Price'] !== undefined && row['Buy Box: Strikethrough Price'] !== null) snapshotData.buyBoxStrikethroughPrice = String(row['Buy Box: Strikethrough Price']);

    // Buy Box: % Amazon 90 days
    if (row['Buy Box: % Amazon 90 days'] !== undefined && row['Buy Box: % Amazon 90 days'] !== null) snapshotData.buyBoxAmazon90Days = String(row['Buy Box: % Amazon 90 days']);

    // Buy Box: % Top Seller 90 days
    const val_buyBoxTopSeller90Days = parseFloat(row['Buy Box: % Top Seller 90 days']);
    if (!isNaN(val_buyBoxTopSeller90Days)) snapshotData.buyBoxTopSeller90Days = val_buyBoxTopSeller90Days;

    // Buy Box: Winner Count 90 days
    const val_buyBoxWinnerCount90Days = parseInt(row['Buy Box: Winner Count 90 days']);
    if (!isNaN(val_buyBoxWinnerCount90Days)) snapshotData.buyBoxWinnerCount90Days = val_buyBoxWinnerCount90Days;

    // Buy Box: Standard Deviation 90 days
    if (row['Buy Box: Standard Deviation 90 days'] !== undefined && row['Buy Box: Standard Deviation 90 days'] !== null) snapshotData.buyBoxStandardDeviation90Days = String(row['Buy Box: Standard Deviation 90 days']);

    // Buy Box: Flipability 90 days
    const val_buyBoxFlipability90Days = parseInt(row['Buy Box: Flipability 90 days']);
    if (!isNaN(val_buyBoxFlipability90Days)) snapshotData.buyBoxFlipability90Days = val_buyBoxFlipability90Days;

    // Buy Box: Is FBA
    if (row['Buy Box: Is FBA'] !== undefined && row['Buy Box: Is FBA'] !== null) snapshotData.buyBoxIsFBA = String(row['Buy Box: Is FBA']);

    // Buy Box: Unqualified
    if (row['Buy Box: Unqualified'] !== undefined && row['Buy Box: Unqualified'] !== null) snapshotData.buyBoxUnqualified = String(row['Buy Box: Unqualified']);

    // Buy Box: Prime Eligible
    if (row['Buy Box: Prime Eligible'] !== undefined && row['Buy Box: Prime Eligible'] !== null) snapshotData.buyBoxPrimeEligible = String(row['Buy Box: Prime Eligible']);

    // Buy Box: Subscribe & Save
    if (row['Buy Box: Subscribe & Save'] !== undefined && row['Buy Box: Subscribe & Save'] !== null) snapshotData.buyBoxSubscribeSave = String(row['Buy Box: Subscribe & Save']);

    // Amazon: Current
    if (row['Amazon: Current'] !== undefined && row['Amazon: Current'] !== null) snapshotData.amazonCurrent = String(row['Amazon: Current']);

    // Amazon: 90 days avg.
    if (row['Amazon: 90 days avg.'] !== undefined && row['Amazon: 90 days avg.'] !== null) snapshotData.amazon90DaysAvg = String(row['Amazon: 90 days avg.']);

    // Amazon: 90 days drop %
    if (row['Amazon: 90 days drop %'] !== undefined && row['Amazon: 90 days drop %'] !== null) snapshotData.amazon90DaysDrop = String(row['Amazon: 90 days drop %']);

    // Amazon: Stock
    if (row['Amazon: Stock'] !== undefined && row['Amazon: Stock'] !== null) snapshotData.amazonStock = String(row['Amazon: Stock']);

    // Amazon: 90 days OOS
    const val_amazon90DaysOOS = parseInt(row['Amazon: 90 days OOS']);
    if (!isNaN(val_amazon90DaysOOS)) snapshotData.amazon90DaysOOS = val_amazon90DaysOOS;

    // New: Current
    const val_newCurrent = parseFloat(row['New: Current']);
    if (!isNaN(val_newCurrent)) snapshotData.newCurrent = val_newCurrent;

    // New: 90 days avg.
    const val_new90DaysAvg = parseFloat(row['New: 90 days avg.']);
    if (!isNaN(val_new90DaysAvg)) snapshotData.new90DaysAvg = val_new90DaysAvg;

    // New: 90 days drop %
    if (row['New: 90 days drop %'] !== undefined && row['New: 90 days drop %'] !== null) snapshotData.new90DaysDrop = String(row['New: 90 days drop %']);

    // New: 90 days OOS
    if (row['New: 90 days OOS'] !== undefined && row['New: 90 days OOS'] !== null) snapshotData.new90DaysOOS = String(row['New: 90 days OOS']);

    // New, 3rd Party FBA: Current
    if (row['New, 3rd Party FBA: Current'] !== undefined && row['New, 3rd Party FBA: Current'] !== null) snapshotData.new3rdPartyFBACurrent = String(row['New, 3rd Party FBA: Current']);

    // New, 3rd Party FBA: 90 days avg.
    const val_new3rdPartyFBA90DaysAvg = parseFloat(row['New, 3rd Party FBA: 90 days avg.']);
    if (!isNaN(val_new3rdPartyFBA90DaysAvg)) snapshotData.new3rdPartyFBA90DaysAvg = val_new3rdPartyFBA90DaysAvg;

    // New, 3rd Party FBA: 90 days drop %
    if (row['New, 3rd Party FBA: 90 days drop %'] !== undefined && row['New, 3rd Party FBA: 90 days drop %'] !== null) snapshotData.new3rdPartyFBA90DaysDrop = String(row['New, 3rd Party FBA: 90 days drop %']);

    // New, 3rd Party FBA: Stock
    const val_new3rdPartyFBAStock = parseInt(row['New, 3rd Party FBA: Stock']);
    if (!isNaN(val_new3rdPartyFBAStock)) snapshotData.new3rdPartyFBAStock = val_new3rdPartyFBAStock;

    // FBA Pick&Pack Fee
    const val_fBAPickPackFee = parseFloat(row['FBA Pick&Pack Fee']);
    if (!isNaN(val_fBAPickPackFee)) snapshotData.fBAPickPackFee = val_fBAPickPackFee;

    // Referral Fee %
    const val_referralFee = parseFloat(row['Referral Fee %']);
    if (!isNaN(val_referralFee)) snapshotData.referralFee = val_referralFee;

    // Referral Fee based on current Buy Box price
    const val_referralFeeBasedOnCurrentBuyBoxPrice = parseFloat(row['Referral Fee based on current Buy Box price']);
    if (!isNaN(val_referralFeeBasedOnCurrentBuyBoxPrice)) snapshotData.referralFeeBasedOnCurrentBuyBoxPrice = val_referralFeeBasedOnCurrentBuyBoxPrice;

    // New, 3rd Party FBM: Current
    if (row['New, 3rd Party FBM: Current'] !== undefined && row['New, 3rd Party FBM: Current'] !== null) snapshotData.new3rdPartyFBMCurrent = String(row['New, 3rd Party FBM: Current']);

    // New, 3rd Party FBM: 90 days avg.
    const val_new3rdPartyFBM90DaysAvg = parseFloat(row['New, 3rd Party FBM: 90 days avg.']);
    if (!isNaN(val_new3rdPartyFBM90DaysAvg)) snapshotData.new3rdPartyFBM90DaysAvg = val_new3rdPartyFBM90DaysAvg;

    // New, 3rd Party FBM: 90 days drop %
    if (row['New, 3rd Party FBM: 90 days drop %'] !== undefined && row['New, 3rd Party FBM: 90 days drop %'] !== null) snapshotData.new3rdPartyFBM90DaysDrop = String(row['New, 3rd Party FBM: 90 days drop %']);

    // New, 3rd Party FBM: Stock
    if (row['New, 3rd Party FBM: Stock'] !== undefined && row['New, 3rd Party FBM: Stock'] !== null) snapshotData.new3rdPartyFBMStock = String(row['New, 3rd Party FBM: Stock']);

    // New, Prime exclusive: Current
    if (row['New, Prime exclusive: Current'] !== undefined && row['New, Prime exclusive: Current'] !== null) snapshotData.newPrimeExclusiveCurrent = String(row['New, Prime exclusive: Current']);

    // New, Prime exclusive: 90 days avg.
    if (row['New, Prime exclusive: 90 days avg.'] !== undefined && row['New, Prime exclusive: 90 days avg.'] !== null) snapshotData.newPrimeExclusive90DaysAvg = String(row['New, Prime exclusive: 90 days avg.']);

    // New, Prime exclusive: 90 days drop %
    if (row['New, Prime exclusive: 90 days drop %'] !== undefined && row['New, Prime exclusive: 90 days drop %'] !== null) snapshotData.newPrimeExclusive90DaysDrop = String(row['New, Prime exclusive: 90 days drop %']);

    // Lightning Deals: Current
    if (row['Lightning Deals: Current'] !== undefined && row['Lightning Deals: Current'] !== null) snapshotData.lightningDealsCurrent = String(row['Lightning Deals: Current']);

    // Buy Box Used: Current
    if (row['Buy Box Used: Current'] !== undefined && row['Buy Box Used: Current'] !== null) snapshotData.buyBoxUsedCurrent = String(row['Buy Box Used: Current']);

    // Buy Box Used: 90 days avg.
    if (row['Buy Box Used: 90 days avg.'] !== undefined && row['Buy Box Used: 90 days avg.'] !== null) snapshotData.buyBoxUsed90DaysAvg = String(row['Buy Box Used: 90 days avg.']);

    // Buy Box Used: 90 days drop %
    if (row['Buy Box Used: 90 days drop %'] !== undefined && row['Buy Box Used: 90 days drop %'] !== null) snapshotData.buyBoxUsed90DaysDrop = String(row['Buy Box Used: 90 days drop %']);

    // Buy Box Used: Buy Box Used Seller
    if (row['Buy Box Used: Buy Box Used Seller'] !== undefined && row['Buy Box Used: Buy Box Used Seller'] !== null) snapshotData.buyBoxUsedBuyBoxUsedSeller = String(row['Buy Box Used: Buy Box Used Seller']);

    // Buy Box Used: Is FBA
    if (row['Buy Box Used: Is FBA'] !== undefined && row['Buy Box Used: Is FBA'] !== null) snapshotData.buyBoxUsedIsFBA = String(row['Buy Box Used: Is FBA']);

    // Buy Box Used: Condition
    if (row['Buy Box Used: Condition'] !== undefined && row['Buy Box Used: Condition'] !== null) snapshotData.buyBoxUsedCondition = String(row['Buy Box Used: Condition']);

    // Used: Current
    if (row['Used: Current'] !== undefined && row['Used: Current'] !== null) snapshotData.usedCurrent = String(row['Used: Current']);

    // Used: 90 days avg.
    if (row['Used: 90 days avg.'] !== undefined && row['Used: 90 days avg.'] !== null) snapshotData.used90DaysAvg = String(row['Used: 90 days avg.']);

    // Used: 90 days drop %
    if (row['Used: 90 days drop %'] !== undefined && row['Used: 90 days drop %'] !== null) snapshotData.used90DaysDrop = String(row['Used: 90 days drop %']);

    // Used: 90 days OOS
    const val_used90DaysOOS = parseInt(row['Used: 90 days OOS']);
    if (!isNaN(val_used90DaysOOS)) snapshotData.used90DaysOOS = val_used90DaysOOS;

    // Used, like new: Current
    if (row['Used, like new: Current'] !== undefined && row['Used, like new: Current'] !== null) snapshotData.usedLikeNewCurrent = String(row['Used, like new: Current']);

    // Used, like new: 90 days avg.
    if (row['Used, like new: 90 days avg.'] !== undefined && row['Used, like new: 90 days avg.'] !== null) snapshotData.usedLikeNew90DaysAvg = String(row['Used, like new: 90 days avg.']);

    // Used, like new: 90 days drop %
    if (row['Used, like new: 90 days drop %'] !== undefined && row['Used, like new: 90 days drop %'] !== null) snapshotData.usedLikeNew90DaysDrop = String(row['Used, like new: 90 days drop %']);

    // Used, very good: Current
    if (row['Used, very good: Current'] !== undefined && row['Used, very good: Current'] !== null) snapshotData.usedVeryGoodCurrent = String(row['Used, very good: Current']);

    // Used, very good: 90 days avg.
    if (row['Used, very good: 90 days avg.'] !== undefined && row['Used, very good: 90 days avg.'] !== null) snapshotData.usedVeryGood90DaysAvg = String(row['Used, very good: 90 days avg.']);

    // Used, very good: 90 days drop %
    if (row['Used, very good: 90 days drop %'] !== undefined && row['Used, very good: 90 days drop %'] !== null) snapshotData.usedVeryGood90DaysDrop = String(row['Used, very good: 90 days drop %']);

    // Used, good: Current
    if (row['Used, good: Current'] !== undefined && row['Used, good: Current'] !== null) snapshotData.usedGoodCurrent = String(row['Used, good: Current']);

    // Used, good: 90 days avg.
    if (row['Used, good: 90 days avg.'] !== undefined && row['Used, good: 90 days avg.'] !== null) snapshotData.usedGood90DaysAvg = String(row['Used, good: 90 days avg.']);

    // Used, good: 90 days drop %
    if (row['Used, good: 90 days drop %'] !== undefined && row['Used, good: 90 days drop %'] !== null) snapshotData.usedGood90DaysDrop = String(row['Used, good: 90 days drop %']);

    // Used, acceptable: Current
    if (row['Used, acceptable: Current'] !== undefined && row['Used, acceptable: Current'] !== null) snapshotData.usedAcceptableCurrent = String(row['Used, acceptable: Current']);

    // Used, acceptable: 90 days avg.
    if (row['Used, acceptable: 90 days avg.'] !== undefined && row['Used, acceptable: 90 days avg.'] !== null) snapshotData.usedAcceptable90DaysAvg = String(row['Used, acceptable: 90 days avg.']);

    // Used, acceptable: 90 days drop %
    if (row['Used, acceptable: 90 days drop %'] !== undefined && row['Used, acceptable: 90 days drop %'] !== null) snapshotData.usedAcceptable90DaysDrop = String(row['Used, acceptable: 90 days drop %']);

    // Warehouse Deals: Current
    if (row['Warehouse Deals: Current'] !== undefined && row['Warehouse Deals: Current'] !== null) snapshotData.warehouseDealsCurrent = String(row['Warehouse Deals: Current']);

    // Warehouse Deals: 90 days avg.
    if (row['Warehouse Deals: 90 days avg.'] !== undefined && row['Warehouse Deals: 90 days avg.'] !== null) snapshotData.warehouseDeals90DaysAvg = String(row['Warehouse Deals: 90 days avg.']);

    // Warehouse Deals: 90 days drop %
    if (row['Warehouse Deals: 90 days drop %'] !== undefined && row['Warehouse Deals: 90 days drop %'] !== null) snapshotData.warehouseDeals90DaysDrop = String(row['Warehouse Deals: 90 days drop %']);

    // List Price: Current
    const val_listPriceCurrent = parseFloat(row['List Price: Current']);
    if (!isNaN(val_listPriceCurrent)) snapshotData.listPriceCurrent = val_listPriceCurrent;

    // List Price: 90 days avg.
    const val_listPrice90DaysAvg = parseFloat(row['List Price: 90 days avg.']);
    if (!isNaN(val_listPrice90DaysAvg)) snapshotData.listPrice90DaysAvg = val_listPrice90DaysAvg;

    // List Price: 90 days drop %
    if (row['List Price: 90 days drop %'] !== undefined && row['List Price: 90 days drop %'] !== null) snapshotData.listPrice90DaysDrop = String(row['List Price: 90 days drop %']);

    // eBay New: Current
    if (row['eBay New: Current'] !== undefined && row['eBay New: Current'] !== null) snapshotData.eBayNewCurrent = String(row['eBay New: Current']);

    // eBay New: 90 days avg.
    if (row['eBay New: 90 days avg.'] !== undefined && row['eBay New: 90 days avg.'] !== null) snapshotData.eBayNew90DaysAvg = String(row['eBay New: 90 days avg.']);

    // eBay New: 90 days drop %
    if (row['eBay New: 90 days drop %'] !== undefined && row['eBay New: 90 days drop %'] !== null) snapshotData.eBayNew90DaysDrop = String(row['eBay New: 90 days drop %']);

    // eBay Used: Current
    if (row['eBay Used: Current'] !== undefined && row['eBay Used: Current'] !== null) snapshotData.eBayUsedCurrent = String(row['eBay Used: Current']);

    // eBay Used: 90 days avg.
    if (row['eBay Used: 90 days avg.'] !== undefined && row['eBay Used: 90 days avg.'] !== null) snapshotData.eBayUsed90DaysAvg = String(row['eBay Used: 90 days avg.']);

    // eBay Used: 90 days drop %
    if (row['eBay Used: 90 days drop %'] !== undefined && row['eBay Used: 90 days drop %'] !== null) snapshotData.eBayUsed90DaysDrop = String(row['eBay Used: 90 days drop %']);

    // Total Offer Count
    const val_totalOfferCount = parseInt(row['Total Offer Count']);
    if (!isNaN(val_totalOfferCount)) snapshotData.totalOfferCount = val_totalOfferCount;

    // New Offer Count: Current
    const val_newOfferCountCurrent = parseInt(row['New Offer Count: Current']);
    if (!isNaN(val_newOfferCountCurrent)) snapshotData.newOfferCountCurrent = val_newOfferCountCurrent;

    // New Offer Count: 90 days avg.
    const val_newOfferCount90DaysAvg = parseInt(row['New Offer Count: 90 days avg.']);
    if (!isNaN(val_newOfferCount90DaysAvg)) snapshotData.newOfferCount90DaysAvg = val_newOfferCount90DaysAvg;

    // New FBA Offer Count: Current
    const val_newFBAOfferCountCurrent = parseInt(row['New FBA Offer Count: Current']);
    if (!isNaN(val_newFBAOfferCountCurrent)) snapshotData.newFBAOfferCountCurrent = val_newFBAOfferCountCurrent;

    // New FBA Offer Count: 90 days avg.
    const val_newFBAOfferCount90DaysAvg = parseInt(row['New FBA Offer Count: 90 days avg.']);
    if (!isNaN(val_newFBAOfferCount90DaysAvg)) snapshotData.newFBAOfferCount90DaysAvg = val_newFBAOfferCount90DaysAvg;

    // New FBM Offer Count: Current
    const val_newFBMOfferCountCurrent = parseInt(row['New FBM Offer Count: Current']);
    if (!isNaN(val_newFBMOfferCountCurrent)) snapshotData.newFBMOfferCountCurrent = val_newFBMOfferCountCurrent;

    // New FBM Offer Count: 90 days avg.
    const val_newFBMOfferCount90DaysAvg = parseInt(row['New FBM Offer Count: 90 days avg.']);
    if (!isNaN(val_newFBMOfferCount90DaysAvg)) snapshotData.newFBMOfferCount90DaysAvg = val_newFBMOfferCount90DaysAvg;

    // Used Offer Count: Current
    if (row['Used Offer Count: Current'] !== undefined && row['Used Offer Count: Current'] !== null) snapshotData.usedOfferCountCurrent = String(row['Used Offer Count: Current']);

    // Used Offer Count: 90 days avg.
    if (row['Used Offer Count: 90 days avg.'] !== undefined && row['Used Offer Count: 90 days avg.'] !== null) snapshotData.usedOfferCount90DaysAvg = String(row['Used Offer Count: 90 days avg.']);

    // Tracking since
    const val_trackingSince = parseFloat(row['Tracking since']);
    if (!isNaN(val_trackingSince)) snapshotData.trackingSince = val_trackingSince;

    // Listed since
    const val_listedSince = parseFloat(row['Listed since']);
    if (!isNaN(val_listedSince)) snapshotData.listedSince = val_listedSince;

    // URL: URL slug
    if (row['URL: URL slug'] !== undefined && row['URL: URL slug'] !== null) snapshotData.uRLURLSlug = String(row['URL: URL slug']);

    // Categories: Root
    if (row['Categories: Root'] !== undefined && row['Categories: Root'] !== null) snapshotData.categoriesRoot = String(row['Categories: Root']);

    // Categories: Sub
    if (row['Categories: Sub'] !== undefined && row['Categories: Sub'] !== null) snapshotData.categoriesSub = String(row['Categories: Sub']);

    // Categories: Tree
    if (row['Categories: Tree'] !== undefined && row['Categories: Tree'] !== null) snapshotData.categoriesTree = String(row['Categories: Tree']);

    // Website Display Group: Name
    if (row['Website Display Group: Name'] !== undefined && row['Website Display Group: Name'] !== null) snapshotData.websiteDisplayGroupName = String(row['Website Display Group: Name']);

    // Product Codes: UPC
    if (row['Product Codes: UPC'] !== undefined && row['Product Codes: UPC'] !== null) snapshotData.productCodesUPC = String(row['Product Codes: UPC']);

    // Product Codes: EAN
    if (row['Product Codes: EAN'] !== undefined && row['Product Codes: EAN'] !== null) snapshotData.productCodesEAN = String(row['Product Codes: EAN']);

    // Product Codes: GTIN
    if (row['Product Codes: GTIN'] !== undefined && row['Product Codes: GTIN'] !== null) snapshotData.productCodesGTIN = String(row['Product Codes: GTIN']);

    // Product Codes: PartNumber
    if (row['Product Codes: PartNumber'] !== undefined && row['Product Codes: PartNumber'] !== null) snapshotData.productCodesPartNumber = String(row['Product Codes: PartNumber']);

    // Parent ASIN
    if (row['Parent ASIN'] !== undefined && row['Parent ASIN'] !== null) snapshotData.parentASIN = String(row['Parent ASIN']);

    // Variation ASINs
    if (row['Variation ASINs'] !== undefined && row['Variation ASINs'] !== null) snapshotData.variationASINs = String(row['Variation ASINs']);

    // Bundle Items
    if (row['Bundle Items'] !== undefined && row['Bundle Items'] !== null) snapshotData.bundleItems = String(row['Bundle Items']);

    // Freq. Bought Together
    if (row['Freq. Bought Together'] !== undefined && row['Freq. Bought Together'] !== null) snapshotData.freqBoughtTogether = String(row['Freq. Bought Together']);

    // Type
    if (row['Type'] !== undefined && row['Type'] !== null) snapshotData.type = String(row['Type']);

    // Manufacturer
    if (row['Manufacturer'] !== undefined && row['Manufacturer'] !== null) snapshotData.manufacturer = String(row['Manufacturer']);

    // Brand
    if (row['Brand'] !== undefined && row['Brand'] !== null) snapshotData.brand = String(row['Brand']);

    // Brand Store Name
    if (row['Brand Store Name'] !== undefined && row['Brand Store Name'] !== null) snapshotData.brandStoreName = String(row['Brand Store Name']);

    // Brand Store URL Name
    if (row['Brand Store URL Name'] !== undefined && row['Brand Store URL Name'] !== null) snapshotData.brandStoreURLName = String(row['Brand Store URL Name']);

    // Model
    if (row['Model'] !== undefined && row['Model'] !== null) snapshotData.model = String(row['Model']);

    // Variation Attributes
    if (row['Variation Attributes'] !== undefined && row['Variation Attributes'] !== null) snapshotData.variationAttributes = String(row['Variation Attributes']);

    // Color
    if (row['Color'] !== undefined && row['Color'] !== null) snapshotData.color = String(row['Color']);

    // Size
    if (row['Size'] !== undefined && row['Size'] !== null) snapshotData.size = String(row['Size']);

    // Unit Details: Unit Value
    if (row['Unit Details: Unit Value'] !== undefined && row['Unit Details: Unit Value'] !== null) snapshotData.unitDetailsUnitValue = String(row['Unit Details: Unit Value']);

    // Unit Details: Unit Type
    if (row['Unit Details: Unit Type'] !== undefined && row['Unit Details: Unit Type'] !== null) snapshotData.unitDetailsUnitType = String(row['Unit Details: Unit Type']);

    // Scent
    if (row['Scent'] !== undefined && row['Scent'] !== null) snapshotData.scent = String(row['Scent']);

    // Item Form
    if (row['Item Form'] !== undefined && row['Item Form'] !== null) snapshotData.itemForm = String(row['Item Form']);

    // Pattern
    if (row['Pattern'] !== undefined && row['Pattern'] !== null) snapshotData.pattern = String(row['Pattern']);

    // Style
    if (row['Style'] !== undefined && row['Style'] !== null) snapshotData.style = String(row['Style']);

    // Material
    if (row['Material'] !== undefined && row['Material'] !== null) snapshotData.material = String(row['Material']);

    // Item Type
    if (row['Item Type'] !== undefined && row['Item Type'] !== null) snapshotData.itemType = String(row['Item Type']);

    // Target Audience
    if (row['Target Audience'] !== undefined && row['Target Audience'] !== null) snapshotData.targetAudience = String(row['Target Audience']);

    // Recommended Uses
    if (row['Recommended Uses'] !== undefined && row['Recommended Uses'] !== null) snapshotData.recommendedUses = String(row['Recommended Uses']);

    // Specific Uses
    if (row['Specific Uses'] !== undefined && row['Specific Uses'] !== null) snapshotData.specificUses = String(row['Specific Uses']);

    // Product Benefit
    if (row['Product Benefit'] !== undefined && row['Product Benefit'] !== null) snapshotData.productBenefit = String(row['Product Benefit']);

    // Edition
    if (row['Edition'] !== undefined && row['Edition'] !== null) snapshotData.edition = String(row['Edition']);

    // Format
    if (row['Format'] !== undefined && row['Format'] !== null) snapshotData.format = String(row['Format']);

    // Author
    if (row['Author'] !== undefined && row['Author'] !== null) snapshotData.author = String(row['Author']);

    // Contributors
    if (row['Contributors'] !== undefined && row['Contributors'] !== null) snapshotData.contributors = String(row['Contributors']);

    // Binding
    if (row['Binding'] !== undefined && row['Binding'] !== null) snapshotData.binding = String(row['Binding']);

    // Number of Items
    const val_numberOfItems = parseInt(row['Number of Items']);
    if (!isNaN(val_numberOfItems)) snapshotData.numberOfItems = val_numberOfItems;

    // Number of Pages
    if (row['Number of Pages'] !== undefined && row['Number of Pages'] !== null) snapshotData.numberOfPages = String(row['Number of Pages']);

    // Publication Date
    if (row['Publication Date'] !== undefined && row['Publication Date'] !== null) snapshotData.publicationDate = String(row['Publication Date']);

    // Release Date
    if (row['Release Date'] !== undefined && row['Release Date'] !== null) snapshotData.releaseDate = String(row['Release Date']);

    // Languages
    if (row['Languages'] !== undefined && row['Languages'] !== null) snapshotData.languages = String(row['Languages']);

    // Videos: Video Count
    const val_videosVideoCount = parseInt(row['Videos: Video Count']);
    if (!isNaN(val_videosVideoCount)) snapshotData.videosVideoCount = val_videosVideoCount;

    // Videos: Has Main Video
    if (row['Videos: Has Main Video'] !== undefined && row['Videos: Has Main Video'] !== null) snapshotData.videosHasMainVideo = String(row['Videos: Has Main Video']);

    // Videos: Main Videos
    if (row['Videos: Main Videos'] !== undefined && row['Videos: Main Videos'] !== null) snapshotData.videosMainVideos = String(row['Videos: Main Videos']);

    // Videos: Additional Videos
    if (row['Videos: Additional Videos'] !== undefined && row['Videos: Additional Videos'] !== null) snapshotData.videosAdditionalVideos = String(row['Videos: Additional Videos']);

    // A+ Content: Has A+ Content
    if (row['A+ Content: Has A+ Content'] !== undefined && row['A+ Content: Has A+ Content'] !== null) snapshotData.aContentHasAContent = String(row['A+ Content: Has A+ Content']);

    // Package: Dimension (cm³)
    const val_packageDimensionCm = parseFloat(row['Package: Dimension (cm³)']);
    if (!isNaN(val_packageDimensionCm)) snapshotData.packageDimensionCm = val_packageDimensionCm;

    // Package: Weight (g)
    const val_packageWeightG = parseFloat(row['Package: Weight (g)']);
    if (!isNaN(val_packageWeightG)) snapshotData.packageWeightG = val_packageWeightG;

    // Package: Quantity
    if (row['Package: Quantity'] !== undefined && row['Package: Quantity'] !== null) snapshotData.packageQuantity = String(row['Package: Quantity']);

    // Item: Dimension (cm³)
    const val_itemDimensionCm = parseFloat(row['Item: Dimension (cm³)']);
    if (!isNaN(val_itemDimensionCm)) snapshotData.itemDimensionCm = val_itemDimensionCm;

    // Item: Weight (g)
    const val_itemWeightG = parseFloat(row['Item: Weight (g)']);
    if (!isNaN(val_itemWeightG)) snapshotData.itemWeightG = val_itemWeightG;

    // Included Components
    if (row['Included Components'] !== undefined && row['Included Components'] !== null) snapshotData.includedComponents = String(row['Included Components']);

    // Ingredients
    if (row['Ingredients'] !== undefined && row['Ingredients'] !== null) snapshotData.ingredients = String(row['Ingredients']);

    // Active Ingredients
    if (row['Active Ingredients'] !== undefined && row['Active Ingredients'] !== null) snapshotData.activeIngredients = String(row['Active Ingredients']);

    // Special Ingredients
    if (row['Special Ingredients'] !== undefined && row['Special Ingredients'] !== null) snapshotData.specialIngredients = String(row['Special Ingredients']);

    // Safety Warning
    if (row['Safety Warning'] !== undefined && row['Safety Warning'] !== null) snapshotData.safetyWarning = String(row['Safety Warning']);

    // Batteries Required
    if (row['Batteries Required'] !== undefined && row['Batteries Required'] !== null) snapshotData.batteriesRequired = String(row['Batteries Required']);

    // Batteries Included
    if (row['Batteries Included'] !== undefined && row['Batteries Included'] !== null) snapshotData.batteriesIncluded = String(row['Batteries Included']);

    // Hazardous Materials
    if (row['Hazardous Materials'] !== undefined && row['Hazardous Materials'] !== null) snapshotData.hazardousMaterials = String(row['Hazardous Materials']);

    // Is HazMat
    if (row['Is HazMat'] !== undefined && row['Is HazMat'] !== null) snapshotData.isHazMat = String(row['Is HazMat']);

    // Is heat sensitive
    if (row['Is heat sensitive'] !== undefined && row['Is heat sensitive'] !== null) snapshotData.isHeatSensitive = String(row['Is heat sensitive']);

    // Adult Product
    if (row['Adult Product'] !== undefined && row['Adult Product'] !== null) snapshotData.adultProduct = String(row['Adult Product']);

    // Is Merch on Demand
    if (row['Is Merch on Demand'] !== undefined && row['Is Merch on Demand'] !== null) snapshotData.isMerchOnDemand = String(row['Is Merch on Demand']);

    // Trade-In Eligible
    if (row['Trade-In Eligible'] !== undefined && row['Trade-In Eligible'] !== null) snapshotData.tradeInEligible = String(row['Trade-In Eligible']);

    // Deals: Deal Type
    if (row['Deals: Deal Type'] !== undefined && row['Deals: Deal Type'] !== null) snapshotData.dealsDealType = String(row['Deals: Deal Type']);

    // Deals: Badge
    if (row['Deals: Badge'] !== undefined && row['Deals: Badge'] !== null) snapshotData.dealsBadge = String(row['Deals: Badge']);

    // One Time Coupon: Absolute
    if (row['One Time Coupon: Absolute'] !== undefined && row['One Time Coupon: Absolute'] !== null) snapshotData.oneTimeCouponAbsolute = String(row['One Time Coupon: Absolute']);

    // One Time Coupon: Percentage
    if (row['One Time Coupon: Percentage'] !== undefined && row['One Time Coupon: Percentage'] !== null) snapshotData.oneTimeCouponPercentage = String(row['One Time Coupon: Percentage']);

    // One Time Coupon: Subscribe & Save %
    if (row['One Time Coupon: Subscribe & Save %'] !== undefined && row['One Time Coupon: Subscribe & Save %'] !== null) snapshotData.oneTimeCouponSubscribeSave = String(row['One Time Coupon: Subscribe & Save %']);

    // Business Discount: Percentage
    if (row['Business Discount: Percentage'] !== undefined && row['Business Discount: Percentage'] !== null) snapshotData.businessDiscountPercentage = String(row['Business Discount: Percentage']);


      await prisma.productFinder.create({
        data: snapshotData
      });
      newSnapshotsCount++;
    }

    console.log('\n--- ИТОГИ ---');
    console.log(`Новых Брендов добавлено: ${newBrandsCount}`);
    console.log(`Новых Производителей добавлено: ${newManufacturersCount}`);
    console.log(`Новых ASIN добавлено: ${newAsinsCount}`);
    console.log(`Создано снапшотов ASIN: ${newSnapshotsCount}`);

  } catch (error: any) {
    console.error(`Произошла ошибка: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
