"use client";

import { useState } from "react";
import Link from "next/link";
import { getCurrentWeekEvent, getWeekEvent } from "@/data/annual52WeeksCalendar";
import { useCartStore } from "@/store/cartStore";
import {
  Sparkles,
  Truck,
  ArrowRight,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";

/**
 * Единый универсальный баннер «Подборка недели / La Selección de la Semana» в светлой теме
 * с валенсийской цветовой палитрой (Naranja de Valencia, Blau Senyera, Dorado Fallero)
 */
export const WeeklyPromoBanner = () => {
  const { language } = useCartStore();
  const currentWeek = getCurrentWeekEvent();
  const [activeWeekNum, setActiveWeekNum] = useState<number>(currentWeek.weekNumber);

  const event = getWeekEvent(activeWeekNum);

  const layerLabels: Record<string, { es: string; en: string; color: string; bg: string; border: string }> = {
    festivo_puente: { es: "Festivo & Puente Nacional", en: "National Holiday & Bridge", color: "#0284c7", bg: "#e0f2fe", border: "#bae6fd" },
    fiesta_local_valencia: { es: "Fiesta Comunidad Valenciana", en: "Valencian Local Fiesta", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
    escolar_familia: { es: "Calendario Escolar & Familiar", en: "School & Family Calendar", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
    temporada_hogar: { es: "Temporada & Hogar", en: "Seasonal & Home Living", color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
  };

  const currentLayer = layerLabels[event.layer] || layerLabels.festivo_puente;

  return (
    <div style={{ marginBottom: "36px" }}>
      {/* Верхняя контрольная панель с навигацией по 52 неделям */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "10px",
          fontSize: "0.82rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 10px",
              borderRadius: "6px",
              background: currentLayer.bg,
              color: currentLayer.color,
              fontWeight: 800,
              border: `1px solid ${currentLayer.border}`,
            }}
          >
            <Layers size={13} /> {currentLayer[language] || currentLayer.es}
          </span>

          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>
            {language === "es" ? "Semana" : "Week"} {event.weekNumber}/52 • {event.dateRange}
          </span>
        </div>

        {/* Переключатель недели */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            onClick={() => setActiveWeekNum((prev) => (prev > 1 ? prev - 1 : 50))}
            className="btn-icon"
            style={{ width: "32px", height: "32px" }}
            title="Semana anterior"
          >
            <ChevronLeft size={16} />
          </button>

          <span style={{ fontSize: "0.82rem", color: "var(--text-main)", fontWeight: 800, minWidth: "90px", textAlign: "center" }}>
            {event.monthName[language] || event.monthName.es} (S.{event.weekNumber})
          </span>

          <button
            onClick={() => setActiveWeekNum((prev) => (prev < 50 ? prev + 1 : 1))}
            className="btn-icon"
            style={{ width: "32px", height: "32px" }}
            title="Semana siguiente"
          >
            <ChevronRight size={16} />
          </button>

          <Link
            href="/campaigns"
            style={{
              marginLeft: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#ea580c",
              fontWeight: 800,
              fontSize: "0.8rem",
            }}
          >
            <Calendar size={13} /> {language === "es" ? "Ver 52 Semanas" : "View 52 Weeks"}
          </Link>
        </div>
      </div>

      {/* Главная карточка баннера недели с валенсийской каймой */}
      <div
        style={{
          padding: "28px 32px",
          borderRadius: "var(--radius-lg)",
          background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)",
          border: "1px solid #fed7aa",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        <div style={{ flex: "1 1 500px" }}>
          {/* Универсальный бейдж доставки с оранжево-золотым акцентом */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              background: "#fff7ed",
              color: "#c2410c",
              border: "1px solid #fed7aa",
              fontSize: "0.78rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              marginBottom: "10px",
            }}
          >
            <Truck size={14} />
            {event.bannerBadge[language] || event.bannerBadge.es}
          </div>

          {/* Заголовок по утвержденному шаблону */}
          <h2 style={{ fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)", color: "#0f172a", lineHeight: 1.3, marginBottom: "8px", fontWeight: 900 }}>
            {event.bannerHeadline[language] || event.bannerHeadline.es}
          </h2>

          {/* Описание и рекомендованные категории */}
          <p style={{ color: "#334155", fontSize: "0.92rem", lineHeight: 1.5, marginBottom: "12px" }}>
            {event.bannerSubtext[language] || event.bannerSubtext.es}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", color: "#047857", fontWeight: 700 }}>
            <Zap size={14} color="#ea580c" />
            <span>{language === "es" ? "En foco esta semana:" : "In focus this week:"}</span>
            <span style={{ color: "#0f172a" }}>{event.recommendedProducts[language] || event.recommendedProducts.es}</span>
          </div>
        </div>

        {/* Кнопка перехода на постоянную SEO страницу */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
          <Link
            href={event.targetUrl}
            className="btn-accent"
            style={{
              padding: "14px 26px",
              fontSize: "0.95rem",
              whiteSpace: "nowrap",
            }}
          >
            <Sparkles size={16} /> {language === "es" ? "Ver Selección de la Semana" : "Explore Weekly Selection"} <ArrowRight size={16} />
          </Link>

          <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-subtle)", fontWeight: 600 }}>
            {language === "es" ? "Envío 24/48h desde Castellón/Valencia" : "24/48h delivery from Castellón/Valencia"}
          </div>
        </div>
      </div>
    </div>
  );
};
