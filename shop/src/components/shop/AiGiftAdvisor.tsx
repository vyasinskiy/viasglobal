"use client";

import { useState, useEffect } from "react";
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
  BookOpen,
  Gamepad2,
  ShoppingBag,
  Zap,
  Headphones,
  Laptop,
  Flame,
  Truck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Gift,
  Search,
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
type InterestType = "hogar_decoracion" | "papeleria_creatividad" | "ninos_juegos" | "moda_accesorios" | "tecnologia_gadgets" | "any";
type BudgetType = "under_40" | "40_90" | "over_90" | "any";

interface AiGiftAdvisorProps {
  initialProducts?: Product[];
}

export const AiGiftAdvisor = ({ initialProducts }: AiGiftAdvisorProps = {}) => {
  const { language } = useCartStore();

  // Состояние шагов: 1 = Кому, 2 = Интересы/Категории, 3 = Бюджет, 4 = Результат (AI Рекомендация)
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

  // Динамические категории для шага 2, строго адаптированные под выбор адресата (Шаг 1)
  const getCategoryOptionsForRecipient = (rec: RecipientType | null) => {
    switch (rec) {
      case "kids_teens":
        return [
          {
            id: "ninos_juegos" as InterestType,
            label: { es: "Juguetes & Juegos Creativos", en: "Toys & Creative Games" },
            sub: { es: "Juegos educativos, cartas, peluches y manualidades", en: "Educational games, card games, plushies & crafts" },
            icon: Gamepad2,
          },
          {
            id: "papeleria_creatividad" as InterestType,
            label: { es: "Vuelta al Cole & Papelería", en: "Back to School & Stationery" },
            sub: { es: "Cuadernos escolares, libretas de dibujo y estuches", en: "School notebooks, sketchbooks & pencil cases" },
            icon: BookOpen,
          },
          {
            id: "tecnologia_gadgets" as InterestType,
            label: { es: "Gadgets & Novedades Tech", en: "Gadgets & Fun Tech" },
            sub: { es: "Luces nocturnas, accesorios curiosos y sonido portátil", en: "Night lamps, fun novelties & portable audio" },
            icon: Zap,
          },
          {
            id: "moda_accesorios" as InterestType,
            label: { es: "Mochilas & Accesorios Infantiles", en: "Kids Bags & Accessories" },
            sub: { es: "Bolsas de tela, botellas y detalles para el día a día", en: "Tote bags, bottles & daily lifestyle items" },
            icon: ShoppingBag,
          },
        ];

      case "coworker_pro":
        return [
          {
            id: "papeleria_creatividad" as InterestType,
            label: { es: "Oficina, Agendas & Papelería", en: "Office, Planners & Stationery" },
            sub: { es: "Cuadernos ejecutivos, agendas y bolígrafos de diseño", en: "Executive notebooks, planners & design pens" },
            icon: BookOpen,
          },
          {
            id: "tecnologia_gadgets" as InterestType,
            label: { es: "Gadgets & Productividad", en: "Gadgets & Productivity" },
            sub: { es: "Cargadores rápidos GaN, cables premium e iluminación", en: "GaN fast chargers, premium cables & desk lighting" },
            icon: Zap,
          },
          {
            id: "hogar_decoracion" as InterestType,
            label: { es: "Tazas & Bienestar de Escritorio", en: "Mugs & Desk Wellness" },
            sub: { es: "Tazas de café/té, velas antiestrés y confort para la oficina", en: "Coffee/tea mugs, relaxing candles & desk comfort" },
            icon: Home,
          },
        ];

      case "him":
        return [
          {
            id: "tecnologia_gadgets" as InterestType,
            label: { es: "Tecnología & Gadgets", en: "Tech & Gadgets" },
            sub: { es: "Cargadores rápidos, cables trenzados, sonido y gadgets útiles", en: "Fast chargers, braided cables, audio & useful gadgets" },
            icon: Zap,
          },
          {
            id: "papeleria_creatividad" as InterestType,
            label: { es: "Libretas de Diseño & Organización", en: "Design Notebooks & Planners" },
            sub: { es: "Cuadernos de viaje, agendas de trabajo y escritura", en: "Travel journals, work planners & fine writing" },
            icon: BookOpen,
          },
          {
            id: "moda_accesorios" as InterestType,
            label: { es: "Cuidado Personal & Accesorios", en: "Grooming & Accessories" },
            sub: { es: "Jabones artesanales, neceseres de viaje y complementos", en: "Artisan soaps, travel pouches & daily accessories" },
            icon: ShoppingBag,
          },
          {
            id: "hogar_decoracion" as InterestType,
            label: { es: "Gourmet, Café & Hogar", en: "Gourmet, Coffee & Home" },
            sub: { es: "Vasos Beldi marroquíes, tazas de autor y piezas de diseño", en: "Moroccan Beldi glasses, artisan mugs & design pieces" },
            icon: Home,
          },
        ];

      case "her":
        return [
          {
            id: "moda_accesorios" as InterestType,
            label: { es: "Belleza, Moda & Bienestar", en: "Beauty, Fashion & Wellness" },
            sub: { es: "Bolsos tote, neceseres bordados, jabones botánicos y autocuidado", en: "Tote bags, embroidered pouches, botanic soaps & self-care" },
            icon: ShoppingBag,
          },
          {
            id: "hogar_decoracion" as InterestType,
            label: { es: "Hogar, Velas & Decoración", en: "Home, Candles & Decor" },
            sub: { es: "Velas aromáticas, vajilla floral Primavera, vasos artesanales", en: "Scented candles, floral tableware & handmade glassware" },
            icon: Home,
          },
          {
            id: "papeleria_creatividad" as InterestType,
            label: { es: "Papelería Creativa & Escritura", en: "Creative Stationery & Writing" },
            sub: { es: "Agendas ilustradas, cuadernos bonitos y caligrafía", en: "Illustrated planners, pretty notebooks & calligraphy" },
            icon: BookOpen,
          },
          {
            id: "tecnologia_gadgets" as InterestType,
            label: { es: "Iluminación & Gadgets Chic", en: "Ambient Lights & Chic Gadgets" },
            sub: { es: "Luces ambientales relajantes, difusores y accesorios smart", en: "Relaxing ambient lights, diffusers & smart accessories" },
            icon: Zap,
          },
        ];

      case "home_family":
        return [
          {
            id: "hogar_decoracion" as InterestType,
            label: { es: "Mesa, Vajilla & Confort Familiar", en: "Dining, Tableware & Home Comfort" },
            sub: { es: "Vajilla artesanal, vasos Beldi, velas y piezas para compartir", en: "Handmade dinnerware, Beldi glasses, candles & dining" },
            icon: Home,
          },
          {
            id: "ninos_juegos" as InterestType,
            label: { es: "Juegos de Mesa & Ocio Familiar", en: "Board Games & Family Fun" },
            sub: { es: "Juegos educativos, cartas y dinámicas para toda la familia", en: "Educational games, card games & family activities" },
            icon: Gamepad2,
          },
          {
            id: "tecnologia_gadgets" as InterestType,
            label: { es: "Hogar Inteligente & Iluminación", en: "Smart Home & Ambient Lighting" },
            sub: { es: "Iluminación cálida, difusores y confort para el salón", en: "Warm lighting, diffusers & living room comfort" },
            icon: Zap,
          },
        ];

      case "self":
      default:
        return [
          {
            id: "hogar_decoracion" as InterestType,
            label: { es: "Hogar, Velas & Relax", en: "Home, Candles & Relaxation" },
            sub: { es: "Vajilla especial, velas perfumadas y confort personal", en: "Special tableware, scented candles & personal comfort" },
            icon: Home,
          },
          {
            id: "papeleria_creatividad" as InterestType,
            label: { es: "Papelería & Proyectos", en: "Stationery & Personal Projects" },
            sub: { es: "Cuadernos de ideas, agendas para metas y notas diarias", en: "Idea notebooks, goal planners & daily journals" },
            icon: BookOpen,
          },
          {
            id: "moda_accesorios" as InterestType,
            label: { es: "Moda & Autocuidado", en: "Fashion & Self-Care" },
            sub: { es: "Bolsos tote, jabones botánicos y accesorios con estilo", en: "Tote bags, botanic soaps & stylish accessories" },
            icon: ShoppingBag,
          },
          {
            id: "tecnologia_gadgets" as InterestType,
            label: { es: "Tecnología & Caprichos Tech", en: "Tech & Gadget Treats" },
            sub: { es: "Gadgets modernos, cargadores ultrarrápidos y sonido", en: "Modern gadgets, ultra-fast chargers & audio" },
            icon: Zap,
          },
          {
            id: "ninos_juegos" as InterestType,
            label: { es: "Juegos de Mesa & Kidult", en: "Board Games & Kidult" },
            sub: { es: "Juegos de cartas, retos de ingenio y coleccionables", en: "Card games, brain puzzles & creative novelties" },
            icon: Gamepad2,
          },
        ];
    }
  };

  const interestOptions = getCategoryOptionsForRecipient(recipient);
  const activeRecipientOption = recipientOptions.find((r) => r.id === recipient);

  // Смена адресата с проверкой совместимости выбранной ранее категории
  const handleSelectRecipient = (recId: RecipientType) => {
    setRecipient(recId);
    const available = getCategoryOptionsForRecipient(recId);
    if (interest && !available.some((opt) => opt.id === interest)) {
      setInterest(null);
    }
  };

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
    let targetRecipient: RecipientType = "self";
    if (q.includes("niño") || q.includes("hijo") || q.includes("estudiante") || q.includes("bebé") || q.includes("peque") || q.includes("kid")) {
      targetRecipient = "kids_teens";
    } else if (q.includes("él") || q.includes("padre") || q.includes("novio") || q.includes("chico") || q.includes("hombre") || q.includes("him") || q.includes("dad")) {
      targetRecipient = "him";
    } else if (q.includes("ella") || q.includes("madre") || q.includes("novia") || q.includes("chica") || q.includes("mujer") || q.includes("her") || q.includes("mom")) {
      targetRecipient = "her";
    } else if (q.includes("teletrabajo") || q.includes("oficina") || q.includes("trabajo") || q.includes("work") || q.includes("compañero")) {
      targetRecipient = "coworker_pro";
    } else if (q.includes("familia") || q.includes("casa familiar")) {
      targetRecipient = "home_family";
    }
    setRecipient(targetRecipient);

    const availableForRecipient = getCategoryOptionsForRecipient(targetRecipient);
    let matchedInterest: InterestType = availableForRecipient[0].id;

    if (q.includes("casa") || q.includes("hogar") || q.includes("cocina") || q.includes("vela") || q.includes("decor") || q.includes("taza") || q.includes("home")) {
      matchedInterest = "hogar_decoracion";
    } else if (q.includes("papeler") || q.includes("cuaderno") || q.includes("agenda") || q.includes("boli") || q.includes("oficina") || q.includes("stationery")) {
      matchedInterest = "papeleria_creatividad";
    } else if (q.includes("juguete") || q.includes("juego") || q.includes("peluche") || q.includes("craft")) {
      matchedInterest = "ninos_juegos";
    } else if (q.includes("moda") || q.includes("bolso") || q.includes("belleza") || q.includes("jabón") || q.includes("neceser") || q.includes("beauty")) {
      matchedInterest = "moda_accesorios";
    } else if (q.includes("tech") || q.includes("gadget") || q.includes("cargador") || q.includes("luz")) {
      matchedInterest = "tecnologia_gadgets";
    }

    // Проверяем, валиден ли matchedInterest для этого адресата, иначе берем первую опцию
    if (availableForRecipient.some((o) => o.id === matchedInterest)) {
      setInterest(matchedInterest);
    } else {
      setInterest(availableForRecipient[0].id);
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

  const [allProducts, setAllProducts] = useState<Product[]>(
    initialProducts && initialProducts.length > 0 ? initialProducts : PRODUCTS_DATA
  );

  useEffect(() => {
    // Если товары переданы с сервера, повторный сетевой запрос не требуется
    if (initialProducts && initialProducts.length > 0) return;

    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllProducts(data);
        }
      })
      .catch(() => {});
  }, [initialProducts]);

  // Алгоритм фильтрации и подбора товаров по параметрам
  const getRecommendedProducts = (): Product[] => {
    let filtered = [...allProducts];

    // 1. Фильтр по реальным категориям каталога с поддержкой тегов
    if (interest === "hogar_decoracion") {
      filtered = filtered.filter((p) => p.tags?.some((t) => ["hogar-decoracion", "hogar", "decoracion", "cocina"].includes(t)));
    } else if (interest === "papeleria_creatividad") {
      filtered = filtered.filter((p) => p.tags?.some((t) => ["papeleria-creatividad", "papeleria", "colegio", "oficina"].includes(t)) || p.category === "workspace");
    } else if (interest === "ninos_juegos") {
      filtered = filtered.filter((p) => p.tags?.some((t) => ["ninos-juegos", "ninos", "juguetes", "infantil", "kidult"].includes(t)));
    } else if (interest === "moda_accesorios") {
      filtered = filtered.filter((p) => p.tags?.some((t) => ["moda-accesorios", "accesorios", "bolso", "belleza"].includes(t)));
    } else if (interest === "tecnologia_gadgets") {
      filtered = filtered.filter((p) => p.tags?.some((t) => ["tecnologia-gadgets", "gadgets"].includes(t)) || p.category === "electronics");
    }

    // 2. Дополнительная приоритизация и фильтрация по адресату (recipient)
    if (recipient === "kids_teens") {
      // Для детей категорически исключаем взрослую посуду, вино и свечи
      filtered = filtered.filter((p) => !p.tags?.some((t) => ["vino", "copas", "vajilla"].includes(t)));
      filtered.sort((a, b) => {
        const aKid = a.tags?.some((t) => ["ninos", "infantil", "juguetes", "colegio", "kidult"].includes(t)) ? 2 : 0;
        const bKid = b.tags?.some((t) => ["ninos", "infantil", "juguetes", "colegio", "kidult"].includes(t)) ? 2 : 0;
        return (bKid + (b.isBestseller ? 1 : 0)) - (aKid + (a.isBestseller ? 1 : 0));
      });
    } else if (recipient === "him") {
      filtered.sort((a, b) => {
        const aScore = (a.tags?.includes("para-el") ? 3 : 0) + (a.tags?.some((t) => ["tecnologia", "gadgets", "cafe", "escritorio"].includes(t)) ? 1 : 0);
        const bScore = (b.tags?.includes("para-el") ? 3 : 0) + (b.tags?.some((t) => ["tecnologia", "gadgets", "cafe", "escritorio"].includes(t)) ? 1 : 0);
        return (bScore + (b.isBestseller ? 1 : 0)) - (aScore + (a.isBestseller ? 1 : 0));
      });
    } else if (recipient === "her") {
      filtered.sort((a, b) => {
        const aScore = (a.tags?.includes("para-ella") ? 3 : 0) + (a.tags?.some((t) => ["belleza", "decoracion", "velas", "bolso"].includes(t)) ? 1 : 0);
        const bScore = (b.tags?.includes("para-ella") ? 3 : 0) + (b.tags?.some((t) => ["belleza", "decoracion", "velas", "bolso"].includes(t)) ? 1 : 0);
        return (bScore + (b.isBestseller ? 1 : 0)) - (aScore + (a.isBestseller ? 1 : 0));
      });
    } else if (recipient === "coworker_pro") {
      filtered.sort((a, b) => {
        const aScore = a.category === "workspace" || a.tags?.some((t) => ["oficina", "escritorio", "papeleria", "colegio"].includes(t)) ? 2 : 0;
        const bScore = b.category === "workspace" || b.tags?.some((t) => ["oficina", "escritorio", "papeleria", "colegio"].includes(t)) ? 2 : 0;
        return (bScore + (b.isBestseller ? 1 : 0)) - (aScore + (a.isBestseller ? 1 : 0));
      });
    } else if (recipient === "home_family") {
      filtered.sort((a, b) => {
        const aScore = a.tags?.some((t) => ["hogar", "decoracion", "cocina", "familia"].includes(t)) ? 2 : 0;
        const bScore = b.tags?.some((t) => ["hogar", "decoracion", "cocina", "familia"].includes(t)) ? 2 : 0;
        return (bScore + (b.isBestseller ? 1 : 0)) - (aScore + (a.isBestseller ? 1 : 0));
      });
    }

    // 3. Фильтр по бюджету
    if (budget === "under_40") {
      filtered = filtered.filter((p) => p.price <= 45);
    } else if (budget === "40_90") {
      filtered = filtered.filter((p) => p.price >= 40 && p.price <= 95);
    } else if (budget === "over_90") {
      filtered = filtered.filter((p) => p.price >= 85);
    }

    // 4. Если список пуст или мал, дополняем хитами с учетом адресата
    if (filtered.length < 2) {
      let candidateBestsellers = allProducts.filter((p) => p.isBestseller && !filtered.some((f) => f.id === p.id));
      if (recipient === "kids_teens") {
        const kidBestsellers = candidateBestsellers.filter((p) =>
          p.tags?.some((t) => ["ninos-juegos", "ninos", "juguetes", "infantil", "colegio", "papeleria"].includes(t))
        );
        if (kidBestsellers.length > 0) {
          candidateBestsellers = kidBestsellers;
        }
      }
      filtered = [...filtered, ...candidateBestsellers];
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
      return `He analizado nuestro catálogo completo y seleccionado estas opciones ${recipientName}. Combinan alta durabilidad, diseño ergonómico y máxima puntuación de satisfacción de clientes en España. Todos los artículos se encuentran listos para expedición inmediata con envío en 24/48h desde los almacenes de Castellón y Valencia con 30 días de devolución gratuita.`;
    } else {
      return `I have evaluated our complete product inventory and selected these top-rated gifts ${recipientName}. They balance premium durability, ergonomic aesthetics, and five-star customer feedback in Spain. All items are in stock with 24/48h dispatch from our Castellón and Valencia fulfillment hubs with 30-day free returns.`;
    }
  };

  // Динамический заголовок шага 2, отражающий выбор адресата
  const getStep2Title = () => {
    if (language === "es") {
      switch (recipient) {
        case "kids_teens":
          return "Paso 2 de 3: ¿Qué tipo de regalo buscas para niños o estudiantes?";
        case "coworker_pro":
          return "Paso 2 de 3: ¿Qué categoría prefieres para su entorno de trabajo?";
        case "him":
          return "Paso 2 de 3: ¿Qué categoría encaja mejor con su estilo?";
        case "her":
          return "Paso 2 de 3: ¿Qué categoría va más con sus gustos?";
        case "home_family":
          return "Paso 2 de 3: ¿Qué rincón o momento de la casa quieres mejorar?";
        case "self":
          return "Paso 2 de 3: ¿Qué capricho o categoría te apetece hoy?";
        default:
          return "Paso 2 de 3: ¿Qué categoría de producto buscas?";
      }
    } else {
      switch (recipient) {
        case "kids_teens":
          return "Step 2 of 3: What gift category are you looking for for kids or students?";
        case "coworker_pro":
          return "Step 2 of 3: Which category fits their workspace best?";
        case "him":
          return "Step 2 of 3: Which category best matches his style?";
        case "her":
          return "Step 2 of 3: Which category best matches her tastes?";
        case "home_family":
          return "Step 2 of 3: What area of the home do you want to upgrade?";
        case "self":
          return "Step 2 of 3: What treat or category are you looking for today?";
        default:
          return "Step 2 of 3: Which product category are you looking for?";
      }
    }
  };

  const t = {
    badge: language === "es" ? "Asistente Inteligente • Viasglobal AI Concierge" : "Smart AI Advisor • Viasglobal AI Concierge",
    title: language === "es" ? "¿Buscas un regalo y no sabes qué elegir? Deja que la IA te ayude" : "Looking for a gift? Let our Smart AI Advisor guide you",
    subtitle:
      language === "es"
        ? "Responde 3 preguntas rápidas o escribe con tus propias palabras. Nuestro motor inteligente encontrará el regalo perfecto con envío en 24/48h desde Castellón y Valencia."
        : "Answer 3 quick questions or type in freeform. Our smart engine finds the ideal verified gift with 24/48h delivery from Castellón and Valencia.",
    step1Title: language === "es" ? "Paso 1 de 3: ¿Para quién es el regalo?" : "Step 1 of 3: Who is this gift for?",
    step2Title: language === "es" ? "Paso 2 de 3: ¿Qué categoría de producto buscas?" : "Step 2 of 3: Which product category are you looking for?",
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
                      onClick={() => handleSelectRecipient(opt.id)}
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sliders size={18} color="#ea580c" /> {getStep2Title()}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-subtle)", fontWeight: 700 }}>2 / 3</span>
              </div>

              {/* Бейдж выбранного адресата для прозрачности связи шагов */}
              {activeRecipientOption && (
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
                    {language === "es" ? "Destinatario seleccionado:" : "Selected recipient:"}
                  </span>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      background: "#ffedd5",
                      color: "#c2410c",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      border: "1px solid #fed7aa",
                    }}
                  >
                    <span>{activeRecipientOption.icon}</span>
                    <span>{activeRecipientOption.label[language] || activeRecipientOption.label.es}</span>
                  </span>
                </div>
              )}

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
                            <CheckCircle2 size={14} /> {language === "es" ? "Calidad Certificada" : "Certified Quality"}
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
