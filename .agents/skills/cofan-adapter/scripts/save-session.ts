/**
 * Скрипт авторизации на портале Cofan и сохранения сессии.
 * Открывает системный Google Chrome, ожидает входа пользователя и сохраняет куки в storage_state.json.
 */
import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as readline from 'readline';

const storageStatePath = path.resolve(__dirname, '../../../../contractors/COFAN/auth/storage_state.json');

async function askUser(query: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function main() {
  console.log('Запуск Google Chrome для авторизации в портале Cofan...');
  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });

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
  console.log('Пожалуйста, войдите в свой личный кабинет Cofan в открывшемся окне Chrome.');
  console.log('=============================================================\n');

  await askUser('После успешного входа нажмите ENTER в терминале для сохранения сессии: ');

  await context.storageState({ path: storageStatePath });
  console.log(`\nСессия Cofan успешно сохранена: ${storageStatePath}`);

  await browser.close();
  console.log('Браузер закрыт.');
}

main().catch(console.error);
