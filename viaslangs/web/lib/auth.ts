import type { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "vias_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function secret(): string {
  return process.env.VIASLANGS_APP_SECRET || "";
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function passwordValid(password: string): boolean {
  const expected = process.env.VIASLANGS_APP_PASSWORD || "";
  return expected.length > 0 && timingSafeStringEqual(password, expected);
}

function signExpiry(expiryMs: number): string {
  const hmac = createHmac("sha256", secret());
  hmac.update(`vias-admin:${expiryMs}`);
  return hmac.digest().toString("hex");
}

export function createSessionToken(): string {
  return `${Date.now() + SESSION_TTL_MS}.${signExpiry(Date.now() + SESSION_TTL_MS)}`;
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
  return isSessionValid(req.cookies.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions(): {
  name: string;
  value: string;
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
} {
  return {
    name: SESSION_COOKIE,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}