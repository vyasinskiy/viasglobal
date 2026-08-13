// Экспортируем для тестов
export const soft404Indicators = [
  "404 not found",
  "<title>404",
  "page not found",
  "couldn't find what you are looking for",
  "страница не найдена",
  "page you are looking for doesn't exist",
  "we can't find that page",
  "error 404",
  "we're sorry, but the page",
  "does not exist"
];

export function checkTextForSoft404(text: string): { isSoft404: boolean; reason?: string } {
  const lowerText = text.toLowerCase();
  for (const indicator of soft404Indicators) {
    if (lowerText.includes(indicator)) {
      return { isSoft404: true, reason: indicator };
    }
  }
  return { isSoft404: false };
}

export async function checkUrl(url: string): Promise<number> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`Status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      console.log("RESULT: HARD_ERROR");
      return 1;
    }
    
    const text = await res.text();
    const result = checkTextForSoft404(text);
    
    if (result.isSoft404) {
      console.log(`RESULT: SOFT_404_DETECTED (Reason: found "${result.reason}")`);
      return 2;
    } else {
      console.log("RESULT: PAGE_LOOKS_OK");
      return 0;
    }
  } catch (err: any) {
    console.error(`Fetch Error: ${err.message}`);
    return 1;
  }
}

// Запуск CLI, если файл запущен напрямую
if (require.main === module || (process.argv[1] && process.argv[1].endsWith('checkIfNot404.ts'))) {
  const url = process.argv[2];
  if (!url) {
    console.error("Использование: npx tsx checkIfNot404.ts <url>");
    process.exit(1);
  }

  checkUrl(url).then(code => {
    process.exit(code);
  });
}
