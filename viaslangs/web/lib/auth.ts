import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

// Название защищенной cookie сессии
export const SESSION_COOKIE = "vias_session";

// Время жизни сессии в токене: 20 лет в миллисекундах (бессрочная авторизация)
const SESSION_TTL_MS = 20 * 365 * 24 * 60 * 60 * 1000;

// Максимальный срок жизни cookie в браузере: 400 дней в секундах (верхний предел стандартов Chrome/WebKit)
// При каждом переходе по страницам proxy автоматически продлевает куку еще на 400 дней вперед (sliding session)
export const COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;

function secret(): string {
  return (
    process.env.VIASLANGS_APP_SECRET ||
    process.env.JWT_SECRET ||
    "e4201cba41a7cddd45d1a0e6ffff3b30d610c98a2d4f50c4d24f6d4b9513916c"
  );
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Проверка пароля администратора (дефолт: viasglobal)
export function passwordValid(password: string): boolean {
  const expected =
    process.env.VIASLANGS_APP_PASSWORD ||
    process.env.ADMIN_PASSWORD ||
    "viasglobal";
  return expected.length > 0 && timingSafeStringEqual(password, expected);
}

function signExpiry(expiryMs: number): string {
  const hmac = createHmac("sha256", secret());
  hmac.update(`vias-admin:${expiryMs}`);
  return hmac.digest().toString("hex");
}

export function createSessionToken(): string {
  const expiry = Date.now() + SESSION_TTL_MS;
  return `${expiry}.${signExpiry(expiry)}`;
}

export function isSessionValid(token: string | undefined): boolean {
  if (!token || !secret()) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expiryMs = Number(token.slice(0, dot));
  if (!Number.isFinite(expiryMs) || expiryMs < Date.now()) return false;
  const expected = signExpiry(expiryMs);
  const actual = new TextEncoder().encode(token.slice(dot + 1));
  const expectedEncoded = new TextEncoder().encode(expected);
  return (
    actual.length === expectedEncoded.length && timingSafeEqual(actual, expectedEncoded)
  );
}

export function isAuthenticated(req: NextRequest): boolean {
  // 1. Проверка защищенной cookie сессии браузера
  if (isSessionValid(req.cookies.get(SESSION_COOKIE)?.value)) {
    return true;
  }

  // 2. Проверка заголовка x-app-password (для вызовов от OpenClaw / curl)
  const headerPassword = req.headers.get("x-app-password");
  if (headerPassword && passwordValid(headerPassword)) {
    return true;
  }

  // 3. Проверка заголовка Authorization: Bearer <password_или_token>
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    if (passwordValid(token) || isSessionValid(token)) {
      return true;
    }
  }

  return false;
}

// Параметры куки сессии (с поддержкой автоматического продления и обновления токена)
export function sessionCookieOptions(existingToken?: string): {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
  expires: Date;
} {
  let token = existingToken;

  // Если токена нет или его срок жизни менее 180 дней (например, старый 30-дневный токен),
  // перевыпускаем долгосрочный 20-летний токен
  if (token) {
    const dot = token.indexOf(".");
    const expiryMs = dot > 0 ? Number(token.slice(0, dot)) : 0;
    if (!Number.isFinite(expiryMs) || expiryMs - Date.now() < 180 * 24 * 60 * 60 * 1000) {
      token = createSessionToken();
    }
  } else {
    token = createSessionToken();
  }

  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    expires: new Date(Date.now() + COOKIE_MAX_AGE_SECONDS * 1000),
  };
}