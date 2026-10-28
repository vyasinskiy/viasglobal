"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { MarketingCalendarWidget } from "@/components/shop/MarketingCalendarWidget";
import { HolidayCampaignBanner } from "@/components/shop/HolidayCampaignBanner";
import { Calendar, ArrowLeft } from "lucide-react";

/**
 * Страница годового календаря маркетинговых кампаний по неделям (Puentes y Festivos España) в светлой теме
 */
export default function CampaignsPage() {
  const { language } = useCartStore();

  const t = {
    back: language === "es" ? "Volver a la tienda" : "Back to shop",
    badge: language === "es" ? "Estrategia Operativa de Ventas" : "Operational Sales Strategy",
    title: language === "es" ? "Calendario Semanal de Campañas y Puentes" : "Weekly Campaign & Bridge Calendar",
    subtitle:
      language === "es"
        ? "Cronograma estructurado en 3 fases para cada festivo en España: 3 semanas antes (Tráfico), 1 semana antes (Envío 24/48h) y 2 días antes (Cheque Regalo)."
        : "Structured 3-phase timeline for every holiday in Spain: -3 weeks (Traffic), -1 week (24/48h Dispatch) and -2 days (Digital Gift Cards).",
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container">
        {/* Хлебные крошки */}
        <div style={{ marginBottom: "28px" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#0284c7",
              fontSize: "0.9rem",
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={16} /> {t.back}
          </Link>
        </div>

        {/* Заголовок */}
        <div style={{ textAlign: "center", maxWidth: "800px", margin: "0 auto 40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 14px",
              borderRadius: "var(--radius-full)",
              background: "#e0f2fe",
              border: "1px solid #bae6fd",
              color: "#0284c7",
              fontSize: "0.82rem",
              fontWeight: 800,
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <Calendar size={14} /> {t.badge}
          </div>
          <h1 style={{ fontSize: "2.5rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "12px" }}>{t.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.6 }}>
            {t.subtitle}
          </p>
        </div>

        {/* Интерактивный предпросмотр текущего баннера */}
        <HolidayCampaignBanner />

        {/* Полный годовой календарь по неделям */}
        <MarketingCalendarWidget />
      </div>
    </div>
  );
}
