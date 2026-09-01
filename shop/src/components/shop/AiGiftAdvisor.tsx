"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCTS_DATA } from "@/data/products";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/shop/ProductCard";
import {
  Bot,
  Sparkles,
  User,
  Heart,
  Briefcase,
  Home,
  Headphones,
  Laptop,
  Flame,
  Truck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Gift,
  Search,
  Zap,
  Sliders,
  DollarSign,
} from "lucide-react";

/**
 * Интерактивный компонент «AI Ассистент по подбору подарков» (Viasglobal AI Gift Advisor)
 * Позволяет покупателю в формате диалога или пошагового опросника выбрать кому предназначается подарок,
 * по какому поводу и в каком бюджете, после чего ИИ генерирует персональную подборку с обоснованием.
 */

// Типы вариантов выбора
type RecipientType = "him" | "her" | "kids_teens" | "coworker_pro" | "home_family" | "self";
type InterestType = "audio_music" | "workspace_productivity" | "smart_home_relax" | "travel_fiesta" | "any";
type BudgetType = "under_40" | "40_90" | "over_90" | "any";

export const AiGiftAdvisor = () => {
  const { language } = useCartStore();

  // Состояние шагов: 1 = Кому, 2 = Интересы, 3 = Бюджет, 4 = Результат (AI Рекомендация)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [recipient, setRecipient] = useState<RecipientType | null>(null);
  const [interest, setInterest] = useState<InterestType | null>(null);
  const [budget, setBudget] = useState<BudgetType | null>(null);

  // Свободный текстовый поиск через ИИ
  const [freeformQuery, setFreeformQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);

  // Варианты для шага 1: Кому подарок
  const recipientOptions = [
    {
      id: "him" as RecipientType,
      label: { es: "Para él", en: "For him" },
      sub: { es: "Pareja, padre, hermano o amigo", en: "Partner, father, brother or friend" },
      icon: "👨",
    },
    {
      id: "her" as RecipientType,
      label: { es: "Para ella", en: "For her" },
      sub: { es: "Pareja, madre, hermana o amiga", en: "Partner, mother, sister or friend" },
      icon: "👩",
    },
    {
      id: "kids_teens" as RecipientType,
      label: { es: "Niños o Estudiantes", en: "Kids or Students" },
      sub: { es: "Jóvenes, estudio y ocio", en: "Youth, gaming & study gear" },
      icon: "🎒",
    },
    {
      id: "coworker_pro" as RecipientType,
      label: { es: "Colega o Setup Profesional", en: "Coworker or Pro Setup" },
      sub: { es: "Teletrabajo, oficina y productividad", en: "Remote work & desk ergonomics" },
      icon: "💼",
    },
    {
      id: "home_family" as RecipientType,
      label: { es: "Para el Hogar o Familia", en: "For the Home & Family" },
      sub: { es: "Confort, bienestar y casa inteligente", en: "Smart living, comfort & wellness" },
      icon: "🏠",
    },
    {
      id: "self" as RecipientType,
      label: { es: "Para mí (Auto-regalo)", en: "For myself (Treat)" },
      sub: { es: "Mejorar mi setup o darme un capricho", en: "Upgrade my setup & personal tech" },
      icon: "🎁",
    },
  ];

  // Варианты для шага 2: Стиль и интересы
  const interestOptions = [
    {
      id: "audio_music" as InterestType,
      label: { es: "Sonido Hi-Res & Música", en: "Hi-Res Audio & Music" },
      sub: { es: "Auriculares ANC, altavoces y libertad inalámbrica", en: "ANC headphones, wireless speakers" },
      icon: Headphones,
    },
    {
      id: "workspace_productivity" as InterestType,
      label: { es: "Productividad & Ergonomía", en: "Productivity & Ergonomics" },
      sub: { es: "Teclados mecánicos, luz inteligente y orden", en: "Keyboards, desk lamps & organization" },
      icon: Laptop,
    },
    {
      id: "smart_home_relax" as InterestType,
      label: { es: "Hogar Inteligente & Relax", en: "Smart Home & Relaxation" },
      sub: { es: "Difusores de aroma, sensores climáticos y ambiente", en: "Aroma diffusers, climate sensors" },
      icon: Home,
    },
    {
      id: "travel_fiesta" as InterestType,
      label: { es: "Viajes, Puentes & Fiestas", en: "Travel, Holidays & Fiestas" },
      sub: { es: "Carga rápida GaN, organizadores y resistencia", en: "GaN chargers, travel pouches" },
      icon: Flame,
    },
  ];

  // Варианты для шага 3: Бюджет
  const budgetOptions = [
    {
      id: "under_40" as BudgetType,
      label: { es: "Menos de 40 €", en: "Under €40" },
      sub: { es: "Detalle económico y práctico", en: "Affordable & practical detail" },
      badge: "Económico",
    },
    {
      id: "40_90" as BudgetType,
      label: { es: "40 € a 90 €", en: "€40 to €90" },
      sub: { es: "Regalo equilibrado más popular", en: "Most popular balanced gift" },
      badge: "Popular",
    },
    {
      id: "over_90" as BudgetType,
      label: { es: "Más de 90 €", en: "Over €90" },
      sub: { es: "Gama alta y tecnología premium", en: "High-end & premium tier" },
      badge: "Premium",
    },
    {
      id: "any" as BudgetType,
      label: { es: "Cualquier presupuesto", en: "Any budget" },
      sub: { es: "Ver las mejores opciones valoradas", en: "Show the highest rated picks" },
      badge: "Top",
    },
  ];

  // Запуск симуляции размышлений ИИ
  const handleGenerateRecommendations = () => {
    setIsThinking(true);
    setCurrentStep(4);

    const steps = [
      language === "es" ? "🤖 Analizando el perfil del destinatario y estilo..." : "🤖 Analyzing recipient profile & style...",
      language === "es" ? "⚡ Cruzando valoraciones y filtros de compatibilidad..." : "⚡ Cross-referencing reviews and specs...",
      language === "es" ? "📦 Verificando stock con envío 24/48h desde Castellón/Valencia..." : "📦 Checking 24/48h stock in Castellón & Valencia...",
      language === "es" ? "✨ ¡Selección personalizada generada con éxito!" : "✨ Personalized curated selection ready!",
    ];

    steps.forEach((stepText, index) => {
      setTimeout(() => {
        setThinkingStatus(stepText);
        if (index === steps.length - 1) {
          setIsThinking(false);
          setHasGenerated(true);
        }
      }, (index + 1) * 450);
    });
  };

  // Обработка текстового запроса пользователя
  const handleFreeformSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!freeformQuery.trim()) return;

    const q = freeformQuery.toLowerCase();

    // Простое сопоставление ключевых слов
    if (q.includes("él") || q.includes("padre") || q.includes("novio") || q.includes("chico") || q.includes("hombre") || q.includes("him") || q.includes("dad")) {
      setRecipient("him");
    } else if (q.includes("ella") || q.includes("madre") || q.includes("novia") || q.includes("chica") || q.includes("mujer") || q.includes("her") || q.includes("mom")) {
      setRecipient("her");
    } else if (q.includes("teletrabajo") || q.includes("oficina") || q.includes("trabajo") || q.includes("work")) {
      setRecipient("coworker_pro");
    } else {
      setRecipient("self");
    }

    if (q.includes("audio") || q.includes("música") || q.includes("auriculares") || q.includes("sonido") || q.includes("music")) {
      setInterest("audio_music");
    } else if (q.includes("teclado") || q.includes("luz") || q.includes("escritorio") || q.includes("setup")) {
      setInterest("workspace_productivity");
    } else if (q.includes("difusor") || q.includes("hogar") || q.includes("casa") || q.includes("relax")) {
      setInterest("smart_home_relax");
    } else {
      setInterest("travel_fiesta");
    }

    if (q.includes("barato") || q.includes("económico") || q.includes("menos de 40") || q.includes("cheap")) {
      setBudget("under_40");
    } else if (q.includes("premium") || q.includes("caro") || q.includes("alta gama")) {
      setBudget("over_90");
    } else {
      setBudget("40_90");
    }

    handleGenerateRecommendations();
  };

  // Сброс и повторный подбор
  const handleReset = () => {
    setCurrentStep(1);
    setRecipient(null);
    setInterest(null);
    setBudget(null);
    setFreeformQuery("");
    setHasGenerated(false);
  };

  // Алгоритм фильтрации и подбора товаров по параметрам
  const getRecommendedProducts = (): Product[] => {
    let filtered = [...PRODUCTS_DATA];

    // Фильтр по интересам
    if (interest === "audio_music") {
      filtered = filtered.filter((p) => p.category === "audio" || p.id === "prod-7" || p.id === "prod-1");
    } else if (interest === "workspace_productivity") {
      filtered = filtered.filter((p) => p.category === "workspace" || p.id === "prod-2" || p.id === "prod-4" || p.id === "prod-6");
    } else if (interest === "smart_home_relax") {
      filtered = filtered.filter((p) => p.category === "smart-home" || p.id === "prod-5" || p.id === "prod-3" || p.id === "prod-2");
    } else if (interest === "travel_fiesta") {
      filtered = filtered.filter((p) => p.id === "prod-7" || p.id === "prod-6" || p.id === "prod-8" || p.id === "prod-9");
    }

    // Фильтр по получателю
    if (recipient === "him") {
      filtered.sort((a, b) => (b.category === "workspace" || b.category === "audio" ? 1 : -1));
    } else if (recipient === "her") {
      filtered.sort((a, b) => (a.id === "prod-5" || a.id === "prod-1" || a.id === "prod-2" ? -1 : 1));
    } else if (recipient === "coworker_pro") {
      filtered.sort((a, b) => (a.category === "workspace" ? -1 : 1));
    }

    // Фильтр по бюджету
    if (budget === "under_40") {
      filtered = filtered.filter((p) => p.price <= 45);
    } else if (budget === "40_90") {
      filtered = filtered.filter((p) => p.price >= 40 && p.price <= 95);
    } else if (budget === "over_90") {
      filtered = filtered.filter((p) => p.price >= 85);
    }

    // Если список пуст или мал, дополняем хитами
    if (filtered.length < 2) {
      const bestsellers = PRODUCTS_DATA.filter((p) => p.isBestseller && !filtered.some((f) => f.id === p.id));
      filtered = [...filtered, ...bestsellers];
    }

    return filtered.slice(0, 4);
  };

  const recommendedProducts = getRecommendedProducts();

  // Персонализированное сообщение от AI
  const getAiMessage = () => {
    const recipientName =
      recipient === "him"
        ? (language === "es" ? "para él" : "for him")
        : recipient === "her"
        ? (language === "es" ? "para ella" : "for her")
        : recipient === "coworker_pro"
        ? (language === "es" ? "para entorno profesional" : "for a professional setup")
        : recipient === "kids_teens"
        ? (language === "es" ? "para jóvenes y estudiantes" : "for youth & students")
        : recipient === "home_family"
        ? (language === "es" ? "para el hogar" : "for the home")
        : (language === "es" ? "para tu uso personal" : "for your personal setup");

    if (language === "es") {
      return `He analizado nuestro catálogo completo y seleccionado estas opciones ${recipientName}. Combinan alta durabilidad, diseño ergonómico y máxima puntuación de satisfacción de clientes en España. Todos los artículos se encuentran listos para expedición inmediata con envío en 24/48h desde los almacenes de Castellón y Valencia con 3 años de garantía oficial.`;
    } else {
      return `I have evaluated our complete product inventory and selected these top-rated gifts ${recipientName}. They balance premium durability, ergonomic aesthetics, and five-star customer feedback in Spain. All items are in stock with 24/48h dispatch from our Castellón and Valencia fulfillment hubs with a 3-year official warranty.`;
    }
  };

  const t = {
    badge: language === "es" ? "Asistente Inteligente • Viasglobal AI Concierge" : "Smart AI Advisor • Viasglobal AI Concierge",
    title: language === "es" ? "¿Buscas un regalo y no sabes qué elegir? Deja que la IA te ayude" : "Looking for a gift? Let our Smart AI Advisor guide you",
    subtitle:
      language === "es"
        ? "Responde 3 preguntas rápidas o escribe con tus propias palabras. Nuestro motor inteligente encontrará el regalo perfecto con envío en 24/48h desde Castellón y Valencia."
        : "Answer 3 quick questions or type in freeform. Our smart engine finds the ideal verified tech gift with 24/48h delivery from Castellón and Valencia.",
    step1Title: language === "es" ? "Paso 1 de 3: ¿Para quién es el regalo?" : "Step 1 of 3: Who is this gift for?",
    step2Title: language === "es" ? "Paso 2 de 3: ¿Qué estilo o interés tiene?" : "Step 2 of 3: What is their main interest or style?",
    step3Title: language === "es" ? "Paso 3 de 3: ¿Qué presupuesto tienes en mente?" : "Step 3 of 3: What is your preferred budget?",
    nextStep: language === "es" ? "Siguiente paso" : "Next step",
    generateBtn: language === "es" ? "Generar recomendación personalizada" : "Generate Custom Recommendations",
    resetBtn: language === "es" ? "Modificar respuestas / Nuevo test" : "Adjust answers / New search",
    freeformPlaceholder:
      language === "es"
        ? "O escribe: 'Un regalo para mi novia que le gusta escuchar música y viaja mucho'..."
        : "Or type: 'A gift for my girlfriend who loves music and travels often'...",
    freeformBtn: language === "es" ? "Consultar al Asistente" : "Ask AI Advisor",
    aiResultTitle: language === "es" ? "Recomendación Personalizada del Asistente IA" : "AI Advisor Personalized Curated Selection",
    proTipTitle: language === "es" ? "Consejo Pro de Viasglobal AI:" : "Viasglobal AI Pro-Tip:",
    proTipDesc:
      language === "es"
        ? "¿Tienes dudas sobre la elección exacta? Añade un Cheque Regalo Digital o aprovecha nuestra política de 30 días de prueba sin compromiso con devolución gratuita."
        : "Unsure about exact preferences? Pair your pick with a Digital Gift Voucher or take advantage of our 30-day trial with free EU returns.",
    viewAllGifts: language === "es" ? "Ver todos los regalos" : "View all gifts",
  };

  return (
    <section style={{ padding: "40px 0 60px", background: "#f8fafc" }}>
      <div className="container">
        {/* Главная карточка AI Ассистента */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #fed7aa",
            borderRadius: "var(--radius-lg)",
            padding: "36px",
            boxShadow: "0 10px 30px rgba(234, 88, 12, 0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Декоративный мягкий градиент в фоне */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(234, 88, 12, 0.06) 0%, rgba(2, 132, 199, 0.04) 50%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Заголовок секции AI */}
          <div style={{ textAlign: "center", maxWidth: "780px", margin: "0 auto 30px" }}>
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
              <Bot size={15} /> {t.badge}
            </div>

            <h2 style={{ fontSize: "clamp(1.7rem, 3.2vw, 2.3rem)", color: "var(--text-main)", fontWeight: 900, marginBottom: "10px", lineHeight: 1.25 }}>
              {t.title}
            </h2>

            <p style={{ color: "var(--text-muted)", fontSize: "0.98rem", lineHeight: 1.55 }}>
              {t.subtitle}
            </p>
          </div>

          {/* Поле свободного ввода запроса к ИИ */}
          <form
            onSubmit={handleFreeformSubmit}
            style={{
              maxWidth: "720px",
              margin: "0 auto 32px",
              display: "flex",
              gap: "8px",
              background: "#f8fafc",
              border: "1px solid var(--border-color)",
              padding: "6px 8px 6px 16px",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Search size={20} color="#ea580c" style={{ alignSelf: "center", flexShrink: 0 }} />
            <input
              type="text"
              placeholder={t.freeformPlaceholder}
              value={freeformQuery}
              onChange={(e) => setFreeformQuery(e.target.value)}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: "0.92rem",
                color: "var(--text-main)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              className="btn-accent"
              style={{ padding: "8px 18px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
            >
              <Sparkles size={15} /> {t.freeformBtn}
            </button>
          </form>

          {/* ШАГ 1: ВЫБОР ПОЛУЧАТЕЛЯ */}
          {currentStep === 1 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <User size={18} color="#ea580c" /> {t.step1Title}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-subtle)", fontWeight: 700 }}>1 / 3</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "24px",
                }}
              >
                {recipientOptions.map((opt) => {
                  const isSelected = recipient === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setRecipient(opt.id)}
                      style={{
                        padding: "16px",
                        borderRadius: "var(--radius-md)",
                        background: isSelected ? "#fff7ed" : "#ffffff",
                        border: isSelected ? "2px solid #ea580c" : "1px solid var(--border-color)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isSelected ? "0 4px 14px rgba(234, 88, 12, 0.2)" : "var(--shadow-sm)",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: isSelected ? "#c2410c" : "#0f172a" }}>
                          {opt.label[language] || opt.label.es}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {opt.sub[language] || opt.sub.es}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  disabled={!recipient}
                  onClick={() => setCurrentStep(2)}
                  className="btn-primary"
                  style={{
                    padding: "12px 28px",
                    opacity: recipient ? 1 : 0.5,
                    cursor: recipient ? "pointer" : "not-allowed",
                  }}
                >
                  {t.nextStep} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ШАГ 2: ВЫБОР ИНТЕРЕСА И СТИЛЯ */}
          {currentStep === 2 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sliders size={18} color="#ea580c" /> {t.step2Title}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-subtle)", fontWeight: 700 }}>2 / 3</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: "14px",
                  marginBottom: "24px",
                }}
              >
                {interestOptions.map((opt) => {
                  const isSelected = interest === opt.id;
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setInterest(opt.id)}
                      style={{
                        padding: "18px",
                        borderRadius: "var(--radius-md)",
                        background: isSelected ? "#fff7ed" : "#ffffff",
                        border: isSelected ? "2px solid #ea580c" : "1px solid var(--border-color)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isSelected ? "0 4px 14px rgba(234, 88, 12, 0.2)" : "var(--shadow-sm)",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: isSelected ? "#ea580c" : "#f1f5f9",
                          color: isSelected ? "#ffffff" : "#0284c7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: isSelected ? "#c2410c" : "#0f172a" }}>
                          {opt.label[language] || opt.label.es}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                          {opt.sub[language] || opt.sub.es}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="btn-secondary"
                  style={{ padding: "10px 20px" }}
                >
                  ← {language === "es" ? "Atrás" : "Back"}
                </button>
                <button
                  disabled={!interest}
                  onClick={() => setCurrentStep(3)}
                  className="btn-primary"
                  style={{
                    padding: "12px 28px",
                    opacity: interest ? 1 : 0.5,
                    cursor: interest ? "pointer" : "not-allowed",
                  }}
                >
                  {t.nextStep} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ШАГ 3: ВЫБОР БЮДЖЕТА */}
          {currentStep === 3 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <DollarSign size={18} color="#ea580c" /> {t.step3Title}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-subtle)", fontWeight: 700 }}>3 / 3</span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "14px",
                  marginBottom: "28px",
                }}
              >
                {budgetOptions.map((opt) => {
                  const isSelected = budget === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setBudget(opt.id)}
                      style={{
                        padding: "18px",
                        borderRadius: "var(--radius-md)",
                        background: isSelected ? "#fff7ed" : "#ffffff",
                        border: isSelected ? "2px solid #ea580c" : "1px solid var(--border-color)",
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isSelected ? "0 4px 14px rgba(234, 88, 12, 0.2)" : "var(--shadow-sm)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "1rem", fontWeight: 800, color: isSelected ? "#c2410c" : "#0f172a" }}>
                          {opt.label[language] || opt.label.es}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: isSelected ? "#ea580c" : "#f1f5f9",
                            color: isSelected ? "#fff" : "var(--text-muted)",
                          }}
                        >
                          {opt.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {opt.sub[language] || opt.sub.es}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn-secondary"
                  style={{ padding: "10px 20px" }}
                >
                  ← {language === "es" ? "Atrás" : "Back"}
                </button>
                <button
                  disabled={!budget}
                  onClick={handleGenerateRecommendations}
                  className="btn-accent"
                  style={{
                    padding: "14px 32px",
                    opacity: budget ? 1 : 0.5,
                    cursor: budget ? "pointer" : "not-allowed",
                  }}
                >
                  <Sparkles size={18} /> {t.generateBtn}
                </button>
              </div>
            </div>
          )}

          {/* ШАГ 4: СИМУЛЯЦИЯ РАЗМЫШЛЕНИЙ ИИ ИЛИ ВЫВОД РЕЗУЛЬТАТОВ */}
          {currentStep === 4 && (
            <div>
              {isThinking ? (
                <div style={{ padding: "60px 20px", textAlign: "center" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #ea580c, #d97706)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      margin: "0 auto 20px",
                      boxShadow: "0 0 24px rgba(234, 88, 12, 0.4)",
                      animation: "spin 2s infinite linear",
                    }}
                  >
                    <Sparkles size={32} />
                  </div>
                  <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>
                    {thinkingStatus || (language === "es" ? "El Asistente IA está buscando en el catálogo..." : "AI Advisor is evaluating the catalog...")}
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
                    {language === "es" ? "Filtrando por compatibilidad, valoraciones y disponibilidad en almacén local." : "Filtering by compatibility, ratings, and local warehouse availability."}
                  </p>
                </div>
              ) : (
                <div>
                  {/* Заголовок сгенерированного отчета */}
                  <div
                    style={{
                      padding: "24px",
                      borderRadius: "var(--radius-md)",
                      background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
                      border: "1px solid #fed7aa",
                      marginBottom: "28px",
                      boxShadow: "var(--shadow-sm)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flexWrap: "wrap" }}>
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #ea580c, #c2410c)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          flexShrink: 0,
                          boxShadow: "0 4px 12px rgba(234, 88, 12, 0.3)",
                        }}
                      >
                        <Bot size={26} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontSize: "0.78rem", fontWeight: 800, color: "#c2410c", textTransform: "uppercase" }}>
                            {t.aiResultTitle}
                          </span>
                          <span style={{ fontSize: "0.72rem", background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: "4px", fontWeight: 800 }}>
                            ✨ 98% Match
                          </span>
                        </div>

                        <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "12px" }}>
                          {getAiMessage()}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "0.82rem", color: "#047857", fontWeight: 700 }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={14} /> {language === "es" ? "Envío 24/48h desde Castellón/Valencia" : "24/48h delivery from Castellón/Valencia"}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={14} /> {language === "es" ? "3 Años de garantía oficial UE" : "3-Year Official EU Warranty"}
                          </span>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <CheckCircle2 size={14} /> {language === "es" ? "30 Días de devolución gratuita" : "30-Day Free EU Returns"}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={handleReset}
                        className="btn-secondary"
                        style={{ padding: "8px 16px", fontSize: "0.82rem", alignSelf: "flex-start" }}
                      >
                        <RotateCcw size={14} /> {t.resetBtn}
                      </button>
                    </div>
                  </div>

                  {/* Сетка рекомендованных товаров */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: "20px",
                      marginBottom: "28px",
                    }}
                  >
                    {recommendedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Блок совета Pro от AI и подарочных карт */}
                  <div
                    style={{
                      padding: "20px 24px",
                      borderRadius: "var(--radius-md)",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "16px",
                    }}
                  >
                    <div style={{ maxWidth: "680px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#15803d", fontWeight: 800, fontSize: "0.82rem", textTransform: "uppercase", marginBottom: "4px" }}>
                        <Zap size={14} color="#ea580c" /> {t.proTipTitle}
                      </div>
                      <div style={{ color: "#166534", fontSize: "0.88rem", lineHeight: 1.5 }}>
                        {t.proTipDesc}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <Link href="/gift-cards" className="btn-secondary" style={{ padding: "10px 18px", fontSize: "0.85rem" }}>
                        <Gift size={15} /> {language === "es" ? "Cheque Regalo" : "Gift Card"}
                      </Link>
                      <Link href="/regalos-originales" className="btn-primary" style={{ padding: "10px 18px", fontSize: "0.85rem" }}>
                        {t.viewAllGifts} <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
};
