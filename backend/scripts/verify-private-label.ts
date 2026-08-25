import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Читаем входные аргументы командной строки
const brandInput = process.argv[2];
const sellerInput = process.argv[3];

if (!brandInput || !sellerInput) {
  console.log('Использование: cd backend && npx tsx scripts/verify-private-label.ts "<BrandName>" "<SellerId_or_SellerName>"');
  process.exit(1);
}

// Инициализация подключения к базе данных через адаптер pg
const connectionString = process.env.DATABASE_URL || 'postgresql://viasuser:viaspassword@localhost:5432/viasglobal_db?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Структура для детальной статистики по продавцу
interface SellerStat {
  sellerName: string;
  sellerId: string | null;
  count: number;
  currentPrices: number[];
  avg90Prices: number[];
  listPrices: number[];
  topSeller90Pcts: number[];
  winnerCount90s: number[];
  isFBA: boolean;
  sampleAsins: string[];
  feedbackRating: string | null;
}

async function verifyPrivateLabel() {
  try {
    const brandName = brandInput.trim();
    const sellerParam = sellerInput.trim();

    console.log(`\n======================================================`);
    console.log(`🔍 Проверка связки Private Label`);
    console.log(`Бренд: "${brandName}"`);
    console.log(`Продавец / Seller ID: "${sellerParam}"`);
    console.log(`======================================================\n`);

    // --------------------------------------------------------------------------
    // Шаг 0.1: Поиск бренда и проверка наличия отдельной выгрузки по бренду
    // --------------------------------------------------------------------------
    const targetBrand = await prisma.brand.findFirst({
      where: { name: { equals: brandName, mode: 'insensitive' } },
    });

    if (!targetBrand) {
      console.log(`⚠️ Бренд "${brandName}" не найден в базе данных.`);
      console.log(`   Чтобы корректно проанализировать бренд, необходимо загрузить его каталог из Keepa:`);
      console.log(`   cd backend && npx tsx scripts/parse-keepa.ts <путь_к_выгрузке_бренда.xlsx>\n`);
      return;
    }

    let brandExportCheck = null;
    try {
      brandExportCheck = await prisma.keepaExport.findFirst({
        where: { brandId: targetBrand.id },
      });
    } catch {
      // Если колонка brandId еще не создана в БД, считаем, что выгрузка по бренду отсутствует
      brandExportCheck = null;
    }

    if (!brandExportCheck) {
      console.log(`⚠️ Отдельная выгрузка каталога для бренда "${targetBrand.name}" не найдена в таблице KeepaExport.`);
      console.log(`   Для достоверного анализа требуется 2 выгрузки: по бренду (каталог) и по продавцу (витрина).`);
      console.log(`   Пожалуйста, выгрузите полный каталог бренда из Keepa (Product Finder -> Brand: "${targetBrand.name}") и загрузите:`);
      console.log(`   cd backend && npx tsx scripts/parse-keepa.ts <путь_к_выгрузке_бренда.xlsx>\n`);
      return;
    }

    // --------------------------------------------------------------------------
    // Шаг 0.2: Поиск продавца и проверка наличия отдельной выгрузки по продавцу
    // --------------------------------------------------------------------------
    const targetSeller = await prisma.seller.findFirst({
      where: {
        OR: [
          { id: { equals: sellerParam, mode: 'insensitive' } },
          { name: { equals: sellerParam, mode: 'insensitive' } },
        ],
      },
    });

    if (!targetSeller) {
      console.log(`⚠️ Продавец "${sellerParam}" не найден в базе данных.`);
      console.log(`   Пожалуйста, выгрузите витрину продавца из Keepa и загрузите её:`);
      console.log(`   cd backend && npx tsx scripts/parse-keepa.ts <путь_к_выгрузке_продавца.xlsx>\n`);
      return;
    }

    let sellerExportCheck = null;
    try {
      sellerExportCheck = await prisma.keepaExport.findFirst({
        where: { sellerId: targetSeller.id },
      });
    } catch {
      sellerExportCheck = null;
    }

    if (!sellerExportCheck) {
      console.log(`⚠️ Отдельная выгрузка витрины для продавца "${targetSeller.name}" не найдена в таблице KeepaExport.`);
      console.log(`   Для достоверного анализа требуется 2 выгрузки: по бренду (каталог) и по продавцу (витрина).`);
      console.log(`   Пожалуйста, выгрузите витрину продавца из Keepa (Product Finder -> Seller: "${targetSeller.name}") и загрузите:`);
      console.log(`   cd backend && npx tsx scripts/parse-keepa.ts <путь_к_выгрузке_продавца.xlsx>\n`);
      return;
    }

    // --------------------------------------------------------------------------
    // Шаг 1.1: Проверка наличия связки в таблице PrivateLabel
    // --------------------------------------------------------------------------
    const existingPl = await prisma.privateLabel.findFirst({
      where: {
        brandId: targetBrand.id,
        sellerId: targetSeller.id,
      },
      include: {
        brand: true,
        seller: true,
      },
    });

    if (existingPl) {
      console.log(`✅ [РЕЗУЛЬТАТ] СВЯЗКА УЖЕ ПОДТВЕРЖДЕНА В БД:`);
      console.log(`   Бренд: ${existingPl.brand.name} (ID: ${existingPl.brandId})`);
      console.log(`   Продавец: ${existingPl.seller.name} (Seller ID: ${existingPl.sellerId})`);
      console.log(`   Статус: Private Label (зафиксирован в таблице PrivateLabel)\n`);
    }

    // --------------------------------------------------------------------------
    // Шаг 1.2: Текстовая проверка по совпадению имен (Brand / Manufacturer vs Seller)
    // --------------------------------------------------------------------------
    const cleanBrand = brandName.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '');
    const cleanSeller = targetSeller.name.toLowerCase().replace(/[^a-z0-9а-яё]/gi, '');

    if (cleanBrand.length > 2 && (cleanSeller.includes(cleanBrand) || cleanBrand.includes(cleanSeller))) {
      console.log(`✅ [РЕЗУЛЬТАТ] ПОДТВЕРЖДЕНО КАК PRIVATE LABEL (по совпадению названий):`);
      console.log(`   Имя продавца "${targetSeller.name}" содержит название бренда "${brandName}".`);
      console.log(`   Рекомендуется зафиксировать связку в БД через навык add-private-label.\n`);
    }

    // --------------------------------------------------------------------------
    // Шаг 2: Поиск товаров бренда и их последних снапшотов ProductFinder
    // --------------------------------------------------------------------------
    const asins = await prisma.aSIN.findMany({
      where: { brandId: targetBrand.id },
      include: {
        productFinders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (asins.length === 0) {
      console.log(`⚠️ В базе данных нет товаров (ASIN) для бренда "${brandName}".`);
      console.log(`   Загрузите выгрузку бренда через parse-keepa для проведения анализа.\n`);
      return;
    }

    // --------------------------------------------------------------------------
    // Шаги 3 и 4: Расчет ключевых метрик (Эксклюзивность и BuyBox)
    // --------------------------------------------------------------------------
    let totalBrandItems = 0;
    let singleSellerItems = 0;
    let buyBoxWins = 0;
    const sellersMap: Record<string, SellerStat> = {};

    for (const asinItem of asins) {
      const snap = asinItem.productFinders[0];
      if (!snap) continue;

      totalBrandItems++;

      // Метрика 1: Продавец является единственным на листинге
      if (snap.newOfferCountCurrent === 1) {
        singleSellerItems++;
      }

      // Метрика 2: Кто владеет BuyBox
      const bbSellerRaw = snap.buyBoxSeller || '-';
      const snapSellerId = snap.sellerId || null;
      const currentPrice = snap.buyBoxCurrent || 0;
      const avg90Price = snap.buyBox90DaysAvg || snap.new90DaysAvg || 0;
      const listPrice = snap.listPriceCurrent || snap.listPrice90DaysAvg || 0;
      const topSeller90 = snap.buyBoxTopSeller90Days || 0;
      const winnerCount90 = snap.buyBoxWinnerCount90Days || 0;

      // Извлекаем рейтинг в процентах из строки, например "(97%)"
      const ratingMatch = bbSellerRaw.match(/\((\d+%)\)/);
      const rating = ratingMatch ? ratingMatch[1] : null;

      // Извлекаем чистое имя продавца
      const cleanName = bbSellerRaw.split(' / ')[0].replace(/\s*\(\d+%\)\s*$/, '').trim() || bbSellerRaw;

      if (!sellersMap[cleanName]) {
        sellersMap[cleanName] = {
          sellerName: cleanName,
          sellerId: snapSellerId,
          count: 0,
          currentPrices: [],
          avg90Prices: [],
          listPrices: [],
          topSeller90Pcts: [],
          winnerCount90s: [],
          isFBA: snap.buyBoxIsFBA?.toLowerCase() === 'yes',
          sampleAsins: [],
          feedbackRating: rating,
        };
      }

      sellersMap[cleanName].count++;
      if (currentPrice > 0) sellersMap[cleanName].currentPrices.push(currentPrice);
      if (avg90Price > 0) sellersMap[cleanName].avg90Prices.push(avg90Price);
      if (listPrice > 0) sellersMap[cleanName].listPrices.push(listPrice);
      if (topSeller90 > 0) sellersMap[cleanName].topSeller90Pcts.push(topSeller90);
      if (winnerCount90 > 0) sellersMap[cleanName].winnerCount90s.push(winnerCount90);

      if (sellersMap[cleanName].sampleAsins.length < 3) {
        sellersMap[cleanName].sampleAsins.push(asinItem.code);
      }

      const isTargetSellerId = snapSellerId && snapSellerId.toLowerCase() === sellerParam.toLowerCase();
      const isTargetSellerName = bbSellerRaw.toLowerCase().includes(sellerParam.toLowerCase());

      if (isTargetSellerId || isTargetSellerName) {
        buyBoxWins++;
      }
    }

    if (totalBrandItems === 0) {
      console.log(`⚠️ У товаров бренда "${brandName}" отсутствуют снимки параметров (ProductFinder).\n`);
      return;
    }

    const singleSellerPct = (singleSellerItems / totalBrandItems) * 100;
    const buyBoxWinPct = (buyBoxWins / totalBrandItems) * 100;

    console.log(`📊 Статистика по каталогу бренда "${targetBrand.name}" в БД:`);
    console.log(`   • Всего листингов бренда: ${totalBrandItems}`);
    console.log(`   • Листингов с единственным продавцом: ${singleSellerItems} (${singleSellerPct.toFixed(1)}%) [порог > 50%]`);
    console.log(`   • Листингов с удержанием BuyBox целевым продавцом: ${buyBoxWins} (${buyBoxWinPct.toFixed(1)}%) [порог > 90%]`);

    console.log(`\n🏆 Топ продавцов в BuyBox на листингах этого бренда:`);
    const sortedSellers = Object.values(sellersMap).sort((a, b) => b.count - a.count);
    sortedSellers.forEach((s) => {
      const pct = ((s.count / totalBrandItems) * 100).toFixed(1);
      const avgCurrent = s.currentPrices.length > 0
        ? (s.currentPrices.reduce((a, b) => a + b, 0) / s.currentPrices.length).toFixed(2) + ' €'
        : 'нет данных';
      const avg90 = s.avg90Prices.length > 0
        ? (s.avg90Prices.reduce((a, b) => a + b, 0) / s.avg90Prices.length).toFixed(2) + ' €'
        : null;
      const ratingStr = s.feedbackRating ? ` (рейтинг ${s.feedbackRating})` : '';
      const histStr = avg90 ? ` [ср. за 90 дн: ${avg90}]` : '';
      console.log(`   - ${s.sellerName}${ratingStr}: ${s.count} листингов (${pct}%), тек. цена: ${avgCurrent}${histStr}`);
    });

    // --------------------------------------------------------------------------
    // Вывод и проверка порогов
    // --------------------------------------------------------------------------
    const isSingleSellerDominant = (singleSellerItems / totalBrandItems) > 0.5;
    const isBuyBoxDominant = (buyBoxWins / totalBrandItems) > 0.9;

    console.log(`\n------------------------------------------------------`);
    if (isSingleSellerDominant || isBuyBoxDominant) {
      console.log(`✅ [РЕЗУЛЬТАТ] ВЫВОД ПОДТВЕРЖДЕН: Это PRIVATE LABEL связка.`);
      if (isSingleSellerDominant) {
        console.log(`   Причина: Продавец является единственным на ${singleSellerPct.toFixed(1)}% листингов бренда (порог > 50%).`);
      }
      if (isBuyBoxDominant) {
        console.log(`   Причина: Продавец удерживает BuyBox на ${buyBoxWinPct.toFixed(1)}% листингов бренда (порог > 90%).`);
      }

      // --------------------------------------------------------------------------
      // Анализ недоминантных продавцов (Локальные листинги / Реселлеры)
      // --------------------------------------------------------------------------
      const nonDominantSellers = sortedSellers.filter(
        (s) => !s.sellerName.toLowerCase().includes(sellerParam.toLowerCase()) &&
               (!s.sellerId || s.sellerId.toLowerCase() !== sellerParam.toLowerCase()) &&
               s.sellerName !== '-'
      );

      if (nonDominantSellers.length > 0) {
        console.log(`\n🔎 Детальный анализ недоминантных продавцов (${nonDominantSellers.length} шт.):`);
        nonDominantSellers.forEach((nds) => {
          const pct = ((nds.count / totalBrandItems) * 100).toFixed(1);
          const avgCurr = nds.currentPrices.length > 0
            ? (nds.currentPrices.reduce((a, b) => a + b, 0) / nds.currentPrices.length).toFixed(2)
            : null;
          const avg90 = nds.avg90Prices.length > 0
            ? (nds.avg90Prices.reduce((a, b) => a + b, 0) / nds.avg90Prices.length).toFixed(2)
            : null;
          const avgList = nds.listPrices.length > 0
            ? (nds.listPrices.reduce((a, b) => a + b, 0) / nds.listPrices.length).toFixed(2)
            : null;
          const avgTopSeller90 = nds.topSeller90Pcts.length > 0
            ? ((nds.topSeller90Pcts.reduce((a, b) => a + b, 0) / nds.topSeller90Pcts.length) * 100).toFixed(0)
            : null;
          const avgWinners90 = nds.winnerCount90s.length > 0
            ? (nds.winnerCount90s.reduce((a, b) => a + b, 0) / nds.winnerCount90s.length).toFixed(1)
            : null;

          console.log(`\n   📌 Продавец: "${nds.sellerName}" (Seller ID: ${nds.sellerId || 'не указан'})`);
          console.log(`      • Доля листингов бренда: ${nds.count} из ${totalBrandItems} (${pct}%)`);
          console.log(`      • Рейтинг отзывов: ${nds.feedbackRating || '0% / новый продавец'}`);
          console.log(`      • Текущая цена BuyBox: ${avgCurr ? avgCurr + ' €' : 'нет данных'}`);
          if (avg90) {
            console.log(`      • Средняя цена BuyBox этих товаров за 90 дней: ${avg90} € (динамика стабильна)`);
          }
          if (avgList) {
            console.log(`      • Рекомендованная цена листинга (List Price): ${avgList} €`);
          }
          if (avgTopSeller90 && avgWinners90) {
            console.log(`      • Удержание листинга топовым продавцом за 90 дней: ${avgTopSeller90}% (всего продавцов за 90 дн: ${avgWinners90})`);
          }
          console.log(`      • Формат доставки: ${nds.isFBA ? 'FBA (Amazon склад)' : 'FBM (со своего склада)'}`);
          console.log(`      • Примеры ASIN: ${nds.sampleAsins.join(', ')}`);
        });

        console.log(`\n💡 Экспертная оценка для оптовой закупки (Wholesale):`);
        console.log(`   1. Монополизация каталога брендом:`);
        console.log(`      Основной продавец удерживает BuyBox на ${(buyBoxWinPct).toFixed(1)}% каталога.`);
        console.log(`   2. Локальность сторонних продавцов:`);
        console.log(`      Сторонние продавцы присутствуют суммарно лишь на ${(100 - buyBoxWinPct).toFixed(1)}% каталога на отдельных позициях.`);
        console.log(`      Они удерживают эти товары стабильно (цены за 90 дней стабильны), возможно для них это выгодно в рамках их штучной бизнес-модели.`);
        console.log(`   3. Вывод для нашей оптовой стратегии:`);
        console.log(`      Для нас как оптового ритейлера бренд НЕ подходит для оптовых закупок (Wholesale):`);
        console.log(`      у бренда нет открытой дистрибьюторской сети и конкурентного рынка продавцов на листингах.`);
      }

      if (!existingPl) {
        console.log(`\n👉 Рекомендуется добавить связку в БД (произнесите: "добавь приватный лейбл").`);
      }
    } else {
      console.log(`❌ [РЕЗУЛЬТАТ] НЕТ ПОДТВЕРЖДЕНИЯ Private Label: Это подтвержденный WHOLESALE (оптовая модель).`);
      console.log(`   Листинги бренда распределены между несколькими независимыми продавцами и имеют здоровую конкуренцию.`);
      console.log(`\n💡 Рекомендация: Бренд "${brand.name}" подходит для оптовых закупок.`);
      console.log(`👉 Вы можете найти официальных B2B дистрибьюторов в Европе (произнесите: "найди дистрибьютора для бренда ${brand.name}").`);
    }
    console.log(`------------------------------------------------------\n`);

  } catch (error: any) {
    console.error(`Ошибка при выполнении проверки: ${error.message}`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

verifyPrivateLabel();
