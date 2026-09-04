import { Product, ShippingMethod, Coupon } from "@/types";
import realProductsData from "./scraped_products.json";

/**
 * Каталог реальных товаров интернет-магазина Viasglobal Shop из базы данных Supabase / PostgreSQL.
 * Загружен напрямую из актуальной базы данных, без фиктивных или устаревших мок-товаров.
 */
export const PRODUCTS_DATA: Product[] = realProductsData as unknown as Product[];

/**
 * Категории товаров для фильтрации с переводами
 */
export const CATEGORIES_CONFIG = [
  { id: "all", label: { es: "Todos los productos", en: "All Products" }, count: 631 },
  { id: "lifestyle", label: { es: "Hogar y Estilo de Vida", en: "Home & Lifestyle" }, count: 320 },
  { id: "workspace", label: { es: "Papelería y Regalos", en: "Stationery & Gifts" }, count: 210 },
  { id: "smart-home", label: { es: "Decoración y Fiestas", en: "Decor & Parties" }, count: 101 },
];

/**
 * Способы доставки по Испании и странам ЕС
 */
export const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: "standard",
    title: {
      es: "Envío Estándar (Correos Express / SEUR)",
      en: "Standard Delivery (Correos Express / SEUR)",
    },
    description: {
      es: "Entrega a domicilio en España",
      en: "Door-to-door delivery across Spain",
    },
    price: 4.99,
    estimatedDays: {
      es: "2-4 días laborables",
      en: "2-4 business days",
    },
  },
  {
    id: "express",
    title: {
      es: "Envío Urgente Express (DHL Express / UPS)",
      en: "Express Delivery (DHL Express / UPS)",
    },
    description: {
      es: "Entrega prioritaria con seguimiento en tiempo real",
      en: "Priority dispatch with 24/7 tracking",
    },
    price: 9.99,
    estimatedDays: {
      es: "24-48 horas",
      en: "24-48 hours",
    },
  },
  {
    id: "free",
    title: {
      es: "Envío Gratuito",
      en: "Free EU Shipping",
    },
    description: {
      es: "Para pedidos a partir de 50€",
      en: "For all orders over €50",
    },
    price: 0,
    estimatedDays: {
      es: "2-4 días laborables",
      en: "2-4 business days",
    },
  },
];

/**
 * Доступные промокоды
 */
export const AVAILABLE_COUPONS: Coupon[] = [
  { code: "VIAS10", discountPercent: 10, minSubtotal: 30 },
  { code: "WELCOME15", discountPercent: 15, minSubtotal: 50 },
  { code: "SUMMER20", discountPercent: 20, minSubtotal: 100 },
];
