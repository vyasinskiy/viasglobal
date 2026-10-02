import { Pool } from "pg";

const globalForPg = globalThis as unknown as { viasLangsPool?: Pool };

export const pool =
  globalForPg.viasLangsPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production" &&
      !process.env.DATABASE_URL?.includes("localhost")
        ? { rejectUnauthorized: false }
        : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.viasLangsPool = pool;
}

export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    if (value !== undefined) {
      result[snake] = value;
    }
  }
  return result;
}

export function toCamelCase<T = Record<string, unknown>>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camel] = value;
  }
  return result as T;
}

export function mapRows<T>(rows: Record<string, unknown>[]): T[] {
  return rows.map((row) => toCamelCase<T>(row));
}