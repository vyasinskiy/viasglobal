import { Product } from "@/types";

/**
 * Типы для годового календаря маркетинга на 52 недели и праздничных промо-кампаний
 */

// 4 слоя событий
export type EventLayer =
  | "festivo_puente"        // Официальные праздники и мосты (общеиспанские, автономии)
  | "fiesta_local_valencia" // Локальные фиесты Валенсийского сообщества (Кастельон, Валенсия, Буньоль, Беникасим)
  | "escolar_familia"       // Школьный и семейный календарь (каникулы, выпускные, свадьбы, Vuelta al Cole)
  | "temporada_hogar";      // Сезонно-бытовые триггеры (жара, холод, дожди, уборка, распродажи)

// Категории ассортимента магазина
export type ProductFocusCategory =
  | "audio"
  | "workspace"
  | "smart-home"
  | "charging"
  | "lifestyle"
  | "home_diy"
  | "auto"
  | "travel_outdoor";

// Недельное событие годового календаря (1–52)
export interface WeeklyCalendarEvent {
  weekNumber: number;          // Номер недели (1–52)
  monthNumber: number;         // Номер месяца (1–12)
  monthName: { es: string; en: string };
  dateRange: string;           // Например: "1–6 Enero"
  title: { es: string; en: string };
  subtitle: { es: string; en: string };
  description?: { es: string; en: string }; // Подробное культурно-историческое и прикладное описание события
  layer: EventLayer;
  isPuenteOrHoliday: boolean;
  focusCategories: string[];   // Категории товаров в фокусе недели
  recommendedProducts: { es: string; en: string };
  bannerHeadline: { es: string; en: string };
  bannerSubtext: { es: string; en: string };
  bannerBadge: { es: string; en: string };
  targetUrl: string;           // Постоянный SEO-URL (например: /especial-puentes, /regalos-originales)
  actionItems: string[];       // Оперативные задачи для маркетинга
}

// Стадии праздничной промо-кампании
export type CampaignStage = "stage1_collections" | "stage2_fast_delivery" | "stage3_gift_cards" | "standard";

// Фаза промо-кампании в календаре
export interface CampaignPhase {
  stage: CampaignStage;
  label: { es: string; en: string };
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysBeforeHoliday: number; // 21, 7, 2
  badge: { es: string; en: string };
  headline: { es: string; en: string };
  subtext: { es: string; en: string };
  ctaText: { es: string; en: string };
  ctaLink: string;
  actionItems: string[];
}

// Праздничное событие / Длинные выходные (Puente)
export interface HolidayEvent {
  id: string;
  name: { es: string; en: string };
  description: { es: string; en: string };
  type: "national_spain" | "regional_valencia" | "commercial_eu";
  targetDate: string; // YYYY-MM-DD
  isPuente: boolean;
  phases: {
    stage1_collections: CampaignPhase;
    stage2_fast_delivery: CampaignPhase;
    stage3_gift_cards: CampaignPhase;
  };
}

// Интерфейс подарочной карты (Cheque Regalo)
export interface GiftCardData {
  id: string;
  amount: number;
  recipientName: string;
  recipientEmail: string;
  senderName: string;
  message: string;
  deliveryDate?: string;
}

// Конфигурация подборок подарков
export interface GiftCollection {
  id: string;
  title: {
    es: string;
    en: string;
  };
  description: {
    es: string;
    en: string;
  };
  maxPrice?: number;
  category?: string;
  tag?: string;
}
