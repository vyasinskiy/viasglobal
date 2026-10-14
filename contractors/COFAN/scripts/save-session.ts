/**
 * Скрипт первоначального входа в портал поставщика Cofan и сохранения сессии (cookies + localStorage).
 * Открывает системный Google Chrome, ждет авторизации пользователя на cofan.es/es/privatearea/login/
 * и сохраняет session state в contractors/COFAN/auth/storage_state.json.
 */
import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

// Целевой путь для сохранения файла сессии Cofan
const storageStatePath = path.resolve(__dirname, '../auth/storage_state.json');

// Вспомогательная функция для интерактивного ожидания нажатия клавиши Enter
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
  console.log('Запуск Google Chrome для авторизации в портале Cofan...');

  // Создаем папку auth при необходимости
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

  // Запуск браузера в видимом режиме (headless: false)
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,
  });

  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    locale: 'es-ES',
  });

  const page = await context.newPage();
  console.log('Переход на страницу входа Cofan: https://www.cofan.es/es/privatearea/login/ ...');
  await page.goto('https://www.cofan.es/es/privatearea/login/');

  console.log('\n=============================================================');
  console.log('Пожалуйста, введите ваш логин и пароль в открывшемся окне Chrome.');
  console.log('После успешного входа в личный кабинет Cofan вернитесь в терминал.');
  console.log('=============================================================\n');

  // Ждем нажатия клавиши Enter от пользователя
  await askUser('После успешного входа нажмите ENTER для сохранения сессии: ');

  // Сохраняем состояние авторизации (cookies, localStorage)
  await context.storageState({ path: storageStatePath });
  console.log(`\nСессия Cofan успешно сохранена в: ${storageStatePath}`);

  await browser.close();
  console.log('Браузер закрыт. Теперь сессия готова для автоматического поиска прайс-листов.');
}

main().catch((err) => {
  console.error('Ошибка авторизации Cofan:', err);
  process.exit(1);
});
