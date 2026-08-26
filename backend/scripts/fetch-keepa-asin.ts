async function main() {
  const asin = process.argv[2];
  if (!asin) {
    console.error('❌ Ошибка: Не указан ASIN. Использование: npx tsx scripts/fetch-keepa-asin.ts <ASIN>');
    process.exit(1);
  }

  console.log(`\n🚀 Отправляем запрос к локальному бэкенду для ASIN: ${asin}...`);
  
  try {
    const url = `http://localhost:3001/keepa/enqueue/${asin}`;
    const response = await fetch(url, { method: 'POST' });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ Ошибка от бэкенда (${response.status}):`, errorText);
      process.exit(1);
    }

    const data = await response.json();
    console.log(`\n✅ Успешно! Данные из чистовика:`);
    console.log(`- Title: ${data.title}`);
    console.log(`- Brand: ${data.brand}`);
    console.log(`- Size Tier: \x1b[32m${data.sizeTier || 'N/A'}\x1b[0m`);
    console.log(`- Dimensions (Pkg): ${data.packageLength}x${data.packageWidth}x${data.packageHeight} mm, ${data.packageWeight}g`);
    console.log(`- Monthly Sold: ${data.monthlySold || 'N/A'}`);
    console.log(`- Pick & Pack Fee: ${data.pickAndPackFee || 'N/A'}`);

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Ошибка: Не удалось подключиться к локальному серверу.');
      console.error('👉 Пожалуйста, убедитесь, что бэкенд запущен! (Вкладка терминала с `npm run start:dev`)');
    } else {
      console.error('\n❌ Произошла непредвиденная ошибка:', error.message);
    }
    process.exit(1);
  }
}

main();
