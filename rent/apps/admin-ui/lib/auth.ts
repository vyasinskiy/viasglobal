// rent/apps/admin-ui/lib/auth.ts
// Модуль аутентификации и подписания сессий с использованием Web Crypto API (поддержка Edge Runtime и Node.js)
import type { NextRequest } from 'next/server';

// Название защищенной cookie сессии
export const SESSION_COOKIE = 'vias_rent_session';

// Время жизни сессии в токене: 20 лет в миллисекундах (бессрочная авторизация)
const SESSION_TTL_MS = 20 * 365 * 24 * 60 * 60 * 1000;

// Максимальный срок жизни cookie в браузере: 400 дней в секундах (верхний предел стандартов Chrome/WebKit)
// При каждом переходе по страницам middleware автоматически продлевает куку еще на 400 дней вперед (sliding session)
export const COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

// Секретный ключ для подписи
function getSecret(): string {
  return process.env.JWT_SECRET || process.env.VIASLANGS_APP_SECRET || 'vias-rent-secret-key-salt-2026';
}

// Константное по времени сравнение строк для защиты от timing-атак
export function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Проверка введенного пароля
export function passwordValid(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || process.env.VIASLANGS_APP_PASSWORD || 'viasglobal';
  return expected.length > 0 && timingSafeStringEqual(password, expected);
}

// Генерация HMAC-SHA256 подписи через стандартный Web Crypto API
async function signExpiry(expiryMs: number): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`vias-rent-admin:${expiryMs}`)
  );
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Создание токена сессии: {expiryMs}.{hmac_hex}
export async function createSessionToken(): Promise<string> {
  const expiry = Date.now() + SESSION_TTL_MS;
  const signature = await signExpiry(expiry);
  return `${expiry}.${signature}`;
}

// Проверка валидности сессионного токена
export async function isSessionValid(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expiryMs = Number(token.slice(0, dot));
  if (!Number.isFinite(expiryMs) || expiryMs < Date.now()) return false;
  const expected = await signExpiry(expiryMs);
  const actual = token.slice(dot + 1);
  return timingSafeStringEqual(actual, expected);
}

// Проверка авторизации входящего запроса
export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  return isSessionValid(req.cookies.get(SESSION_COOKIE)?.value);
}

// Параметры куки сессии (с поддержкой автоматического продления и обновления токена)
export async function sessionCookieOptions(existingToken?: string) {
  let token = existingToken;

  // Если токена нет или его срок жизни менее 180 дней (например, старый 30-дневный токен),
  // перевыпускаем долгосрочный 20-летний токен
  if (token) {
    const dot = token.indexOf('.');
    const expiryMs = dot > 0 ? Number(token.slice(0, dot)) : 0;
    if (!Number.isFinite(expiryMs) || expiryMs - Date.now() < 180 * 24 * 60 * 60 * 1000) {
      token = await createSessionToken();
    }
  } else {
    token = await createSessionToken();
  }

  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
    expires: new Date(Date.now() + COOKIE_MAX_AGE_SECONDS * 1000),
  };
}
