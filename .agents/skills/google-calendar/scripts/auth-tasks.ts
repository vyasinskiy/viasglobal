/**
 * @file auth-tasks.ts
 * @description Скрипт однократной авторизации пользователя через OAuth 2.0 для прямого доступа к личному Google Tasks
 */

import { google } from 'googleapis';
import * as http from 'http';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

const CREDENTIALS_PATH = path.resolve(process.cwd(), '.secrets/google-oauth-credentials.json');
const TOKENS_PATH = path.resolve(process.cwd(), '.secrets/google-oauth-tokens.json');
const PORT = 8085;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error(`❌ Файл ${CREDENTIALS_PATH} не найден!`);
    process.exit(1);
  }

  const rawCreds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf-8'));
  const clientInfo = rawCreds.installed || rawCreds.web || rawCreds;
  const clientId = clientInfo.client_id;
  const clientSecret = clientInfo.client_secret;

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/tasks',
      'https://www.googleapis.com/auth/calendar',
    ],
  });

  console.log('\n======================================================');
  console.log('🔑 АВТОРИЗАЦИЯ В GOOGLE TASKS & CALENDAR');
  console.log('======================================================');
  console.log('Сейчас в браузере откроется страница авторизации Google.');
  console.log('Если браузер не открылся автоматически, перейдите по ссылке вручную:\n');
  console.log(authUrl);
  console.log('\nОжидание подтверждения авторизации в браузере...\n');

  // Запуск локального сервера для приема кода подтверждения
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url?.startsWith('/oauth2callback')) {
        const queryParams = new url.URL(req.url, `http://localhost:${PORT}`).searchParams;
        const code = queryParams.get('code');
        const error = queryParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h2>❌ Ошибка авторизации: ${error}</h2><p>Попробуйте снова.</p>`);
          server.close();
          process.exit(1);
        }

        if (code) {
          const { tokens } = await oauth2Client.getToken(code);
          fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2), 'utf-8');

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <body style="font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8fafc;">
                <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center; max-width: 480px;">
                  <h1 style="color: #16a34a; margin-top: 0;">✅ Авторизация успешна!</h1>
                  <p style="color: #475569; font-size: 16px;">Доступ к вашему Google Tasks и Календарю успешно подключен.</p>
                  <p style="color: #64748b; font-size: 14px;">Вы можете закрыть эту вкладку и вернуться в IDE.</p>
                </div>
              </body>
            </html>
          `);

          console.log('✅ Токены успешно получены и сохранены в .secrets/google-oauth-tokens.json!');
          server.close();
          process.exit(0);
        }
      }
    } catch (err: any) {
      console.error('❌ Ошибка при получении токенов:', err.message || err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Внутренняя ошибка авторизации');
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    // Автоматическое открытие ссылки в браузере macOS
    exec(`open "${authUrl}"`);
  });
}

main().catch((err) => {
  console.error('Ошибка:', err);
  process.exit(1);
});
