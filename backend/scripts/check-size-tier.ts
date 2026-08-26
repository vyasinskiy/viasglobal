import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

// Копия функции из keepa.service.ts для независимой проверки
function calculateAmazonTier(lengthMm: number | null, widthMm: number | null, heightMm: number | null, weightG: number | null): string | null {
  if (!lengthMm || !widthMm || !heightMm || !weightG) return null;

  const sides = [lengthMm / 10, widthMm / 10, heightMm / 10].sort((a, b) => b - a);
  const [lCm, wCm, hCm] = sides;
  const kg = weightG / 1000;

  if (lCm <= 20 && wCm <= 15 && hCm <= 1 && kg <= 0.08) return 'Small envelope';
  if (lCm <= 33 && wCm <= 23 && hCm <= 2.5 && kg <= 0.46) return 'Standard envelope';
  if (lCm <= 33 && wCm <= 23 && hCm <= 5 && kg <= 0.96) return 'Large envelope';
  if (lCm <= 45 && wCm <= 34 && hCm <= 26 && kg <= 11.9) return 'Standard parcel';
  if (lCm <= 61 && wCm <= 46 && hCm <= 46 && kg <= 1.76) return 'Small Oversize';
  if (lCm <= 120 && wCm <= 60 && hCm <= 60 && kg <= 29.76) return 'Standard Oversize';
  if (kg <= 31.5) return 'Large Oversize';
  
  return 'Special Oversize';
}

async function main() {
  const asin = process.argv[2];
  if (!asin) {
    console.error('❌ Ошибка: Не указан ASIN. Использование: npx tsx scripts/check-size-tier.ts <ASIN>');
    process.exit(1);
  }

  console.log(`\n🔍 Проверка ASIN: ${asin}`);

  // 1. Сначала ищем в обработанных данных
  const processed = await prisma.keepaApiProcessedData.findUnique({
    where: { asin }
  });

  if (processed) {
    console.log(`\n✅ Данные найдены в локальной БД (KeepaApiProcessedData):`);
    console.log(`📦 Упаковка: ${processed.packageLength} x ${processed.packageWidth} x ${processed.packageHeight} мм`);
    console.log(`⚖️ Вес: ${processed.packageWeight} г`);
    console.log(`📏 Вычисленный Size Tier: \x1b[32m${processed.sizeTier || 'Не удалось вычислить'}\x1b[0m`);
    return;
  }

  // 2. Ищем в сырых данных
  const raw = await prisma.keepaApiRawResponse.findUnique({
    where: { asin }
  });

  let payload: any = null;

  if (raw && raw.rawPayload) {
    console.log(`\n🔄 Обработанных данных нет, но найден сырой слепок JSON в KeepaApiRawResponse.`);
    payload = raw.rawPayload;
  } else {
    console.log(`\n🌐 Данных в БД нет. Делаем прямой запрос к Keepa API (Domain: 4 - ES)...`);
    const apiKey = process.env.KEEPA_API_KEY;
    if (!apiKey) {
      console.error('❌ Ошибка: KEEPA_API_KEY не задан в .env');
      return;
    }
    const response = await fetch(`https://api.keepa.com/product?key=${apiKey}&domain=4&asin=${asin}`);
    payload = await response.json();
    
    if (payload.error) {
      console.error(`❌ Ошибка Keepa API:`, payload.error);
      return;
    }
  }

  const product = payload?.products?.[0];
  if (!product) {
    console.error('❌ Ошибка: Keepa не вернула данные по этому товару.');
    return;
  }

  const pLength = product.packageLength || null;
  const pWidth = product.packageWidth || null;
  const pHeight = product.packageHeight || null;
  const pWeight = product.packageWeight || null;

  console.log(`\n📊 Сырые данные из Keepa:`);
  console.log(`- Package Length: ${pLength} мм`);
  console.log(`- Package Width: ${pWidth} мм`);
  console.log(`- Package Height: ${pHeight} мм`);
  console.log(`- Package Weight: ${pWeight} г`);

  const tier = calculateAmazonTier(pLength, pWidth, pHeight, pWeight);
  
  console.log(`\n📏 Наша калькуляция Amazon Size Tier: \x1b[32m${tier || 'Невозможно вычислить (нет габаритов)'}\x1b[0m`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
