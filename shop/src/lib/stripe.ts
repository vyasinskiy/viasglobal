import Stripe from "stripe";
import path from "path";
import dotenv from "dotenv";

// Гарантируем загрузку переменных окружения
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Инициализация серверного экземпляра Stripe SDK
 */
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

// Проверяем, задан ли валидный ключ Stripe (не заглушка)
export const isStripeConfigured = Boolean(
  stripeSecretKey &&
  !stripeSecretKey.includes("placeholder") &&
  stripeSecretKey.startsWith("sk_")
);

/**
 * Серверный клиент Stripe
 * Если ключ не задан, создается заглушка для предотвращения падений при билде
 */
export const stripe = new Stripe(stripeSecretKey || "sk_test_dummy_key_for_build", {
  apiVersion: "2025-02-24.acacia" as any,
  appInfo: {
    name: "Viasglobal Shop",
    version: "1.0.0",
  },
});
