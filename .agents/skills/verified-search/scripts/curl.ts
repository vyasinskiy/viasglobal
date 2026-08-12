const url = process.argv[2];
if (!url) {
  console.error("Использование: npx tsx curl.ts <url>");
  process.exit(1);
}

async function run() {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`Status: ${res.status} ${res.statusText}`);
    
    if (res.ok || (res.status >= 200 && res.status < 400)) {
      process.exit(0); // Успех
    } else {
      process.exit(1); // Ошибка HTTP
    }
  } catch (err: any) {
    console.error(`Fetch Error: ${err.message}`);
    process.exit(1); // Ошибка сети или таймаут
  }
}

run();
