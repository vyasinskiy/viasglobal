/**
 * Скрипт первоначального входа в Keepa и сохранения сессии (cookies + localStorage).
 * Открывает системный Chrome, ждет пока пользователь залогинится,
 * и сохраняет state в файл .agents/skills/fetch-keepa-viewer/auth/storage_state.json.
 */
import { chromium } from 'playwright';
import * as path from 'path';
import * as readline from 'readline';

// Путь для сохранения состояния сессии (cookies, localStorage)
const storageStatePath = path.resolve(__dirname, '../auth/storage_state.json');

async function askUser(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function main() {
  console.log('Запуск системного Google Chrome для авторизации в Keepa...');
  
  // Запускаем видимый браузер без старых кук, чтобы чисто войти и захватить сессию
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'es-ES',
  });

  const page = await context.newPage();
  console.log('Переход на https://keepa.com/#!viewer ...');
  await page.goto('https://keepa.com/#!viewer');

  console.log('\n=============================================================');
  console.log('Пожалуйста, войдите в свой аккаунт Keepa в открывшемся окне браузера.');
  console.log('Убедитесь, что вы авторизованы и выбран флаг Испании (amazon.es).');
  console.log('=============================================================\n');

  // Ожидаем подтверждения от пользователя в консоли
  await askUser('После того как вы успешно вошли в Keepa, нажмите ENTER здесь в терминале для сохранения сессии: ');

  // Сохраняем состояние контекста (cookies, localStorage, origins)
  await context.storageState({ path: storageStatePath });
  console.log(`\nСессия успешно сохранена в: ${storageStatePath}`);

  await browser.close();
  console.log('Браузер закрыт. Теперь скилл сможет работать автономно без повторного ввода пароля!');
}

main().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
