/**
 * Скрипт первоначального входа в Keepa и сохранения сессии (cookies + localStorage).
 * Открывает системный Google Chrome, ждет пока пользователь авторизуется на keepa.com,
 * и сохраняет session state в auth/storage_state.json.
 */
import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

// Целевой путь для сохранения файла сессии
const storageStatePath = path.resolve(__dirname, '../auth/storage_state.json');

// Вспомогательная функция для интерактивного ожидания подтверждения от пользователя в консоли
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

  // Создаем папку auth при необходимости
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

  // Запуск браузера в видимом режиме
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'es-ES',
  });

  const page = await context.newPage();
  console.log('Переход на страницу Keepa Product Finder (https://keepa.com/#!finder)...');
  await page.goto('https://keepa.com/#!finder');

  console.log('\n=============================================================');
  console.log('Пожалуйста, войдите в свой аккаунт Keepa в открывшемся окне браузера.');
  console.log('Убедитесь, что вы авторизованы и выбран флаг Испании (amazon.es).');
  console.log('=============================================================\n');

  // Ожидаем нажатия клавиши Enter
  await askUser('После успешного входа нажмите ENTER в терминале для сохранения сессии: ');

  // Сохраняем состояние сессии
  await context.storageState({ path: storageStatePath });
  console.log(`\nСессия успешно сохранена в: ${storageStatePath}`);

  await browser.close();
  console.log('Браузер закрыт. Сессия готова к автономному использованию.');
}

main().catch((err) => {
  console.error('Ошибка авторизации:', err);
  process.exit(1);
});
