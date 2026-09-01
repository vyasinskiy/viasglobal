"use client";

import { useState } from "react";
import Link from "next/link";
import { ANNUAL_52_WEEKS_CALENDAR, getCurrentWeekEvent } from "@/data/annual52WeeksCalendar";
import { useCartStore } from "@/store/cartStore";
import {
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";

/**
 * Интерактивный годовой виджет 52 недель маркетинговых кампаний в светлой теме
 * с валенсийской палитрой (Naranja de Valencia, Blau Senyera, Verde Huerta, Dorado Fallero)
 */
export const MarketingCalendarWidget = () => {
  const { language } = useCartStore();
  const currentWeek = getCurrentWeekEvent();

  const [selectedMonth, setSelectedMonth] = useState<number>(0); // 0 = Все месяцы
  const [selectedLayer, setSelectedLayer] = useState<string>("all");
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(currentWeek.weekNumber);

  const months = [
    { num: 1, name: { es: "Ene", en: "Jan" }, full: { es: "Enero", en: "January" } },
    { num: 2, name: { es: "Feb", en: "Feb" }, full: { es: "Febrero", en: "February" } },
    { num: 3, name: { es: "Mar", en: "Mar" }, full: { es: "Marzo", en: "March" } },
    { num: 4, name: { es: "Abr", en: "Apr" }, full: { es: "Abril", en: "April" } },
    { num: 5, name: { es: "May", en: "May" }, full: { es: "Mayo", en: "May" } },
    { num: 6, name: { es: "Jun", en: "Jun" }, full: { es: "Junio", en: "June" } },
    { num: 7, name: { es: "Jul", en: "Jul" }, full: { es: "Julio", en: "July" } },
    { num: 8, name: { es: "Ago", en: "Aug" }, full: { es: "Agosto", en: "August" } },
    { num: 9, name: { es: "Sep", en: "Sep" }, full: { es: "Septiembre", en: "September" } },
    { num: 10, name: { es: "Oct", en: "Oct" }, full: { es: "Octubre", en: "October" } },
    { num: 11, name: { es: "Nov", en: "Nov" }, full: { es: "Noviembre", en: "November" } },
    { num: 12, name: { es: "Dic", en: "Dec" }, full: { es: "Diciembre", en: "December" } },
  ];

  const layerOptions = [
    { id: "all", label: { es: "Todos los 4 estratos", en: "All 4 Event Layers" }, color: "#0284c7", bg: "#e0f2fe", border: "#bae6fd" },
    { id: "festivo_puente", label: { es: "1. Festivos y Puentes", en: "1. Holidays & Bridges" }, color: "#0284c7", bg: "#e0f2fe", border: "#bae6fd" },
    { id: "fiesta_local_valencia", label: { es: "2. Fiestas Comunidad Valenciana", en: "2. Valencian Fiestas" }, color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
    { id: "escolar_familia", label: { es: "3. Escolar y Familiar", en: "3. School & Family" }, color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
    { id: "temporada_hogar", label: { es: "4. Temporada y Hogar", en: "4. Seasonal & Living" }, color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
  ];

  // Фильтрация событий
  let filteredEvents = [...ANNUAL_52_WEEKS_CALENDAR];
  if (selectedMonth > 0) {
    filteredEvents = filteredEvents.filter((w) => w.monthNumber === selectedMonth);
  }
  if (selectedLayer !== "all") {
    filteredEvents = filteredEvents.filter((w) => w.layer === selectedLayer);
  }

  const activeEvent =
    ANNUAL_52_WEEKS_CALENDAR.find((w) => w.weekNumber === selectedWeekNum) ||
    ANNUAL_52_WEEKS_CALENDAR[0];

  const t = {
    title: language === "es" ? "Calendario Anual 52 Semanas (4 Capas de Eventos)" : "52-Week Annual Calendar (4 Event Layers)",
    subtitle:
      language === "es"
        ? "Cronograma completo para 52 semanas con infoproyectos comerciales en España y la Comunidad Valenciana."
        : "Complete 52-week commercial marketing roadmap across Spain and the Valencian Community.",
    selectMonth: language === "es" ? "Filtrar por Mes:" : "Filter by Month:",
    allMonths: language === "es" ? "Todo el Año (12 Meses)" : "All Year (12 Months)",
    selectLayer: language === "es" ? "Filtrar por Capa de Evento:" : "Filter by Event Layer:",
    selectedWeekTitle: language === "es" ? "Detalle de la Semana Seleccionada" : "Selected Week Details",
    recommendedTitle: language === "es" ? "Productos en foco:" : "Focus products:",
    actionPlanTitle: language === "es" ? "Plan de acción operativo:" : "Operational marketing plan:",
    seoHub: language === "es" ? "Página SEO permanente:" : "Permanent SEO Landing:",
  };

  return (
    <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-sm)", marginBottom: "40px" }}>
      {/* Заголовок */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#fff7ed", display: "flex", alignItems: "center", justifyContent: "center", color: "#ea580c" }}>
          <Calendar size={20} />
        </div>
        <h2 style={{ fontSize: "1.5rem", color: "var(--text-main)", fontWeight: 800 }}>{t.title}</h2>
      </div>

      <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px", lineHeight: 1.5 }}>
        {t.subtitle}
      </p>

      {/* Фильтры: 12 Месяцев */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)", marginBottom: "8px", fontWeight: 800, textTransform: "uppercase" }}>
          {t.selectMonth}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          <button
            onClick={() => setSelectedMonth(0)}
            style={{
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 700,
              background: selectedMonth === 0 ? "linear-gradient(135deg, #ea580c, #c2410c)" : "#f8fafc",
              border: selectedMonth === 0 ? "1px solid #ea580c" : "1px solid var(--border-color)",
              color: selectedMonth === 0 ? "#fff" : "var(--text-main)",
              cursor: "pointer",
            }}
          >
            {t.allMonths}
          </button>
          {months.map((m) => (
            <button
              key={m.num}
              onClick={() => setSelectedMonth(m.num)}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: 700,
                background: selectedMonth === m.num ? "linear-gradient(135deg, #ea580c, #c2410c)" : "#f8fafc",
                border: selectedMonth === m.num ? "1px solid #ea580c" : "1px solid var(--border-color)",
                color: selectedMonth === m.num ? "#fff" : "var(--text-main)",
                cursor: "pointer",
              }}
            >
              {m.name[language] || m.name.es}
            </button>
          ))}
        </div>
      </div>

      {/* Фильтры: 4 Слоя событий с аутентичными валенсийскими цветами */}
      <div style={{ marginBottom: "24px" }}>
        <div style={{ fontSize: "0.8rem", color: "var(--text-subtle)", marginBottom: "8px", fontWeight: 800, textTransform: "uppercase" }}>
          {t.selectLayer}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {layerOptions.map((layer) => {
            const isSelected = selectedLayer === layer.id;
            return (
              <button
                key={layer.id}
                onClick={() => setSelectedLayer(layer.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                  background: isSelected ? layer.bg : "#f8fafc",
                  border: isSelected ? `1px solid ${layer.color}` : "1px solid var(--border-color)",
                  color: isSelected ? layer.color : "var(--text-muted)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Layers size={13} color={layer.color} />
                {layer.label[language] || layer.label.es}
              </button>
            );
          })}
        </div>
      </div>

      {/* Сетка недель (Таблица / Карточки 52 недель) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "12px",
          maxHeight: "420px",
          overflowY: "auto",
          paddingRight: "6px",
          marginBottom: "28px",
        }}
      >
        {filteredEvents.map((w) => {
          const isSelected = w.weekNumber === selectedWeekNum;
          return (
            <div
              key={w.weekNumber}
              onClick={() => setSelectedWeekNum(w.weekNumber)}
              style={{
                padding: "12px 14px",
                borderRadius: "var(--radius-sm)",
                background: isSelected ? "#fff7ed" : "#f8fafc",
                border: isSelected ? "1px solid #ea580c" : "1px solid var(--border-color)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: isSelected ? "#ea580c" : "#0284c7", textTransform: "uppercase" }}>
                  S.{w.weekNumber} • {w.dateRange}
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)", fontWeight: 600 }}>
                  {w.monthName[language] || w.monthName.es}
                </span>
              </div>

              <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)", lineHeight: 1.3, marginBottom: "4px" }}>
                {w.title[language] || w.title.es}
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {w.subtitle[language] || w.subtitle.es}
              </div>
            </div>
          );
        })}
      </div>

      {/* Детальная карточка выбранной недели */}
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #fed7aa",
          borderRadius: "var(--radius-md)",
          padding: "24px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase" }}>
              {language === "es" ? "Semana" : "Week"} {activeEvent.weekNumber} de 52 • {activeEvent.dateRange} ({activeEvent.monthName[language] || activeEvent.monthName.es})
            </span>
            <h3 style={{ fontSize: "1.4rem", color: "#0f172a", fontWeight: 800, marginTop: "4px" }}>
              {activeEvent.title[language] || activeEvent.title.es}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "4px" }}>
              {activeEvent.subtitle[language] || activeEvent.subtitle.es}
            </p>
          </div>

          <div>
            <Link
              href={activeEvent.targetUrl}
              className="btn-accent"
              style={{ padding: "8px 16px", fontSize: "0.85rem" }}
            >
              {t.seoHub} {activeEvent.targetUrl} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Шаблон баннера с теплым валенсийским оформлением */}
        <div
          style={{
            padding: "16px 20px",
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "var(--radius-sm)",
            marginBottom: "18px",
          }}
        >
          <div style={{ fontSize: "0.75rem", color: "#c2410c", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>
            Шаблон баннера недели («Envío rápido desde Castellón/Valencia»):
          </div>
          <div style={{ fontSize: "1.05rem", color: "#0f172a", fontWeight: 800, marginBottom: "4px" }}>
            «{activeEvent.bannerHeadline[language] || activeEvent.bannerHeadline.es}»
          </div>
          <div style={{ fontSize: "0.85rem", color: "#334155" }}>
            {activeEvent.bannerSubtext[language] || activeEvent.bannerSubtext.es}
          </div>
        </div>

        {/* Рекомендации и план действий */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.82rem", color: "#047857", fontWeight: 800, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap size={14} color="#ea580c" /> {t.recommendedTitle}
            </div>
            <p style={{ fontSize: "0.88rem", color: "var(--text-main)", lineHeight: 1.5 }}>
              {activeEvent.recommendedProducts[language] || activeEvent.recommendedProducts.es}
            </p>
          </div>

          <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
            <div style={{ fontSize: "0.82rem", color: "#0284c7", fontWeight: 800, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Target size={14} /> {t.actionPlanTitle}
            </div>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.82rem", color: "var(--text-muted)" }}>
              {activeEvent.actionItems.map((item, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                  <CheckCircle2 size={13} color="#0284c7" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
