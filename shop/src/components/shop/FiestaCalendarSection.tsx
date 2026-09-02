"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  getCurrentWeekEvent,
  getWeekEvent,
  getUpcomingEvents,
  getEventFullDescription,
  UpcomingCalendarEvent,
} from "@/data/annual52WeeksCalendar";
import { PRODUCTS_DATA } from "@/data/products";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/shop/ProductCard";
import {
  Calendar,
  Sparkles,
  Truck,
  ArrowRight,
  Zap,
  Info,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react";

/**
 * Второй экран сайта — Интерактивный хронологический календарь событий с подборками товаров и подробными описаниями
 * События упорядочены от ближайших к будущим с валенсийской колористикой (Naranja de Valencia & Blau Senyera).
 */
export const FiestaCalendarSection = () => {
  const { language } = useCartStore();
  const currentWeek = getCurrentWeekEvent();

  // Получаем упорядоченный список ближайших событий года (начиная от текущей недели и далее в будущее)
  const upcomingEvents = getUpcomingEvents(currentWeek.weekNumber, 20);

  // Выбранное событие в календаре (по умолчанию — текущая неделя / ближайшее событие)
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(currentWeek.weekNumber);

  // Ссылка на DOM-контейнер карусели для программной прокрутки кнопками-стрелками
  const carouselRef = useRef<HTMLDivElement>(null);

  // Функция плавной горизонтальной прокрутки карусели
  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollOffset = direction === "left" ? -460 : 460;
      carouselRef.current.scrollBy({ left: scrollOffset, behavior: "smooth" });
    }
  };

  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS_DATA);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllProducts(data);
        }
      })
      .catch(() => {});
  }, []);

  const activeEvent = getWeekEvent(selectedWeekNum);
  const activeUpcoming = upcomingEvents.find((e) => e.weekNumber === selectedWeekNum) || upcomingEvents[0];

  // Подбираем подходящие товары для выбранного события
  const curatedProducts = allProducts.filter((p) => {
    if (activeEvent.focusCategories.includes(p.category)) return true;
    return false;
  }).slice(0, 4);

  const layerLabels: Record<string, { es: string; en: string; color: string; bg: string; border: string }> = {
    festivo_puente: { es: "Festivo & Puente Nacional", en: "National Holiday & Bridge", color: "#0284c7", bg: "#e0f2fe", border: "#bae6fd" },
    fiesta_local_valencia: { es: "Fiesta Comunidad Valenciana", en: "Valencian Fiesta", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
    escolar_familia: { es: "Escolar & Familiar", en: "School & Family", color: "#7c3aed", bg: "#ede9fe", border: "#ddd6fe" },
    temporada_hogar: { es: "Temporada & Hogar", en: "Seasonal & Living", color: "#047857", bg: "#ecfdf5", border: "#a7f3d0" },
  };

  const currentLayer = layerLabels[activeEvent.layer] || layerLabels.festivo_puente;
  const fullDescription = getEventFullDescription(activeEvent, language);

  const t = {
    screenBadge: language === "es" ? "Calendario Cronológico de Fiestas" : "Chronological Fiesta Calendar",
    title: language === "es" ? "Próximas Fiestas y Colecciones Semanales" : "Upcoming Fiestas & Weekly Curated Gear",
    subtitle:
      language === "es"
        ? "Explora las celebraciones en orden cronológico: desde los eventos más inminentes de esta semana hasta los próximos puentes del año. Conoce la historia de cada fiesta y equípate con entrega 24/48h desde Castellón y Valencia."
        : "Explore celebrations in chronological order: from this week's immediate events to upcoming holiday bridges. Discover the history behind each fiesta and gear up with 24/48h delivery from Castellón and Valencia.",
    upcomingLabel: language === "es" ? "Cronología de eventos" : "Upcoming events timeline",
    aboutTitle: language === "es" ? "Sobre esta celebración y tradición:" : "About this celebration & tradition:",
    gearTitle: language === "es" ? "Equipamiento recomendado para este evento:" : "Recommended gear for this event:",
    viewFullSelection: language === "es" ? "Ver Colección Completa" : "View Full Collection",
    view52Weeks: language === "es" ? "Ver Calendario Completo (52 Semanas)" : "View Complete 52-Week Calendar",
    curatedTitle: language === "es" ? "Selección de productos para este evento:" : "Curated gear for this celebration:",
  };

  return (
    <section id="calendario-fiestas" style={{ padding: "40px 0 70px", scrollMarginTop: "110px" }}>
      <div className="container">
        {/* Заголовок второго экрана */}
        <div style={{ textAlign: "center", maxWidth: "840px", margin: "0 auto 36px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 14px",
              borderRadius: "var(--radius-full)",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              color: "#ea580c",
              fontSize: "0.82rem",
              fontWeight: 800,
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <Calendar size={15} /> {t.screenBadge}
          </div>
          <h2 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.5rem)", color: "var(--text-main)", fontWeight: 900, marginBottom: "12px" }}>
            {t.title}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.6 }}>
            {t.subtitle}
          </p>
        </div>

        {/* Хронологическая лента ближайших событий (по возрастанию удаленности) */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-subtle)", textTransform: "uppercase", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={14} color="#ea580c" /> {t.upcomingLabel}
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              {/* Кнопки листания карусели влево / вправо */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <button
                  type="button"
                  onClick={() => scrollCarousel("left")}
                  aria-label="Desplazar a la izquierda"
                  title="Anterior"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-main)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ea580c";
                    e.currentTarget.style.color = "#ea580c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.color = "var(--text-main)";
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel("right")}
                  aria-label="Desplazar a la derecha"
                  title="Siguiente"
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--text-main)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ea580c";
                    e.currentTarget.style.color = "#ea580c";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.color = "var(--text-main)";
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <Link
                href="/campaigns"
                style={{ fontSize: "0.82rem", color: "#0284c7", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                {t.view52Weeks} <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div
            ref={carouselRef}
            style={{
              display: "flex",
              gap: "12px",
              overflowX: "auto",
              paddingBottom: "14px",
              scrollbarWidth: "thin",
              scrollBehavior: "smooth",
              alignItems: "stretch",
            }}
          >
            {upcomingEvents.map((event) => {
              const isSelected = event.weekNumber === selectedWeekNum;
              const isCurrent = event.isCurrent;

              return (
                <button
                  key={event.weekNumber}
                  onClick={() => setSelectedWeekNum(event.weekNumber)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    background: isSelected
                      ? "linear-gradient(135deg, #ea580c 0%, #d97706 100%)"
                      : isCurrent
                      ? "#fff7ed"
                      : "#ffffff",
                    border: isSelected
                      ? "1px solid #ea580c"
                      : isCurrent
                      ? "1px solid #fed7aa"
                      : "1px solid var(--border-color)",
                    color: isSelected ? "#fff" : isCurrent ? "#c2410c" : "var(--text-main)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: isSelected
                      ? "0 4px 14px rgba(234, 88, 12, 0.35)"
                      : "var(--shadow-sm)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "8px",
                    flex: "0 0 240px", // Фиксированная ширина карточки без нежелательного сплющивания
                    minWidth: "240px",
                    maxWidth: "260px",
                    textAlign: "left",
                  }}
                >
                  {/* Верхний бейдж срока */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      opacity: isSelected ? 0.95 : 0.85,
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isCurrent ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: isSelected ? "#fef08a" : "#ea580c" }}>
                        <Flame size={12} /> {event.relativeLabel[language] || event.relativeLabel.es}
                      </span>
                    ) : (
                      <span>{event.relativeLabel[language] || event.relativeLabel.es}</span>
                    )}
                  </div>

                  {/* Название события с поддержкой двухстрочного переноса текста */}
                  <div
                    style={{
                      fontSize: "0.92rem",
                      fontWeight: 800,
                      lineHeight: 1.35,
                      color: isSelected ? "#ffffff" : "var(--text-main)",
                      whiteSpace: "normal",
                      minHeight: "2.7em",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {event.title[language] || event.title.es}
                  </div>

                  {/* Дата события */}
                  <div
                    style={{
                      fontSize: "0.76rem",
                      opacity: isSelected ? 0.9 : 0.7,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {event.dateRange}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Главная карточка события с подробным описанием и доставкой */}
        <div
          style={{
            padding: "36px",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)",
            border: "1px solid #fed7aa",
            boxShadow: "var(--shadow-md)",
            marginBottom: "36px",
          }}
        >
          {/* Верхняя строка статуса события */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                {/* Бейдж близости события во времени */}
                <span
                  style={{
                    padding: "4px 12px",
                    borderRadius: "var(--radius-full)",
                    background: activeUpcoming.isCurrent ? "#ea580c" : "#fff7ed",
                    color: activeUpcoming.isCurrent ? "#ffffff" : "#c2410c",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    border: "1px solid #fed7aa",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Clock size={12} />
                  {activeUpcoming.relativeLabel[language] || activeUpcoming.relativeLabel.es}
                </span>

                {/* Бейдж слоя */}
                <span
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: currentLayer.bg,
                    color: currentLayer.color,
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    border: `1px solid ${currentLayer.border}`,
                  }}
                >
                  {currentLayer[language] || currentLayer.es}
                </span>

                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>
                  {language === "es" ? "Semana" : "Week"} {activeEvent.weekNumber} de 52 • {activeEvent.dateRange}
                </span>
              </div>

              {/* Название события */}
              <h3 style={{ fontSize: "clamp(1.5rem, 3vw, 2.1rem)", color: "#0f172a", fontWeight: 900, marginBottom: "8px", lineHeight: 1.2 }}>
                {activeEvent.title[language] || activeEvent.title.es}
              </h3>

              <p style={{ color: "#475569", fontSize: "1rem", lineHeight: 1.5, maxWidth: "780px" }}>
                {activeEvent.subtitle[language] || activeEvent.subtitle.es}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Link
                href={activeEvent.targetUrl}
                className="btn-accent"
                style={{ padding: "14px 28px", fontSize: "0.95rem", whiteSpace: "nowrap" }}
              >
                <Sparkles size={16} /> {t.viewFullSelection} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* ПОДРОБНОЕ КУЛЬТУРНОЕ И КОНТЕКСТНОЕ ОПИСАНИЕ СОБЫТИЯ */}
          <div
            style={{
              padding: "20px 24px",
              background: "#ffffff",
              border: "1px solid #fed7aa",
              borderRadius: "var(--radius-md)",
              marginBottom: "20px",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#c2410c", fontWeight: 800, fontSize: "0.88rem", textTransform: "uppercase", marginBottom: "8px" }}>
              <Info size={16} />
              {t.aboutTitle}
            </div>
            <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: 1.65 }}>
              {fullDescription}
            </p>
          </div>

          {/* Плашка срочной доставки по стандартизированному шаблону */}
          <div
            style={{
              padding: "16px 20px",
              background: "#fff7ed",
              border: "1px solid #fed7aa",
              borderRadius: "var(--radius-md)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              marginBottom: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: "38px", height: "38px", borderRadius: "8px", background: "#ea580c", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                <Truck size={20} />
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase" }}>
                  {activeEvent.bannerBadge[language] || activeEvent.bannerBadge.es}
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                  {activeEvent.bannerHeadline[language] || activeEvent.bannerHeadline.es}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "0.85rem", color: "#047857", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 size={16} />
              <span>{language === "es" ? "Stock local garantizado en almacén" : "Guaranteed local warehouse stock"}</span>
            </div>
          </div>

          {/* Рекомендации по категориям товаров */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.88rem", color: "#047857", fontWeight: 700 }}>
            <Zap size={16} color="#ea580c" />
            <span style={{ color: "#c2410c" }}>{t.gearTitle}</span>
            <span style={{ color: "#0f172a" }}>{activeEvent.recommendedProducts[language] || activeEvent.recommendedProducts.es}</span>
          </div>
        </div>

        {/* Сетка подборки товаров для этого события */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.3rem", color: "var(--text-main)", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} color="#ea580c" /> {t.curatedTitle}
            </h3>
            <Link
              href={activeEvent.targetUrl}
              style={{ fontSize: "0.88rem", color: "#ea580c", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}
            >
              {t.viewFullSelection} <ArrowRight size={15} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))",
              gap: "24px",
            }}
          >
            {curatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
