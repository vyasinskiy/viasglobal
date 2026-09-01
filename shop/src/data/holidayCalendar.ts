import { HolidayEvent, CampaignStage, CampaignPhase } from "@/types/campaign";

/**
 * Структурированный годовой календарь праздников и коммерческих событий Испании и ЕС (Puentes y Festivos).
 * Каждое событие строго разбито на 3 маркетинговые фазы:
 * 1. За 3 недели (T-21 дней): Подборки товаров и запуск таргетированной рекламы
 * 2. За 1 неделю (T-7 дней): Акцент на доставку 24/48ч из Валенсии/Кастельона перед мостом (puente)
 * 3. За 2 дня (T-2 дня): Фокус на электронные подарочные сертификаты (Cheque Regalo Digital)
 */

/**
 * Вспомогательная функция для генерации дат относительно целевой даты
 */
function createPhaseDates(targetDateStr: string, daysBeforeStart: number, daysBeforeEnd: number) {
  const target = new Date(targetDateStr);
  const start = new Date(target);
  start.setDate(target.getDate() - daysBeforeStart);
  const end = new Date(target);
  end.setDate(target.getDate() - daysBeforeEnd);

  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  };
}

/**
 * Полный реестр праздников и длинных выходных Испании
 */
export const SPANISH_HOLIDAY_CALENDAR: HolidayEvent[] = [
  // 1. Puente de la Hispanidad / Fiesta Nacional (12 de Octubre)
  {
    id: "hispanidad",
    name: {
      es: "Puente del Pilar / Día de la Hispanidad",
      en: "Hispanic Day / National Holiday Bridge",
    },
    description: {
      es: "Primer gran puente de otoño en España. Alta demanda en viajes, audio portátil y accesorios.",
      en: "First major autumn long weekend in Spain. High demand for portable audio and travel accessories.",
    },
    type: "national_spain",
    targetDate: "2026-10-12",
    isPuente: true,
    phases: {
      stage1_collections: {
        stage: "stage1_collections",
        daysBeforeHoliday: 21,
        ...createPhaseDates("2026-10-12", 21, 8),
        label: {
          es: "Fase 1: Colecciones de Otoño y Tráfico (3 semanas antes)",
          en: "Phase 1: Autumn Guides & Ad Traffic (3 weeks before)",
        },
        badge: {
          es: "Guía de Regalos de Otoño",
          en: "Autumn Gift Collections",
        },
        headline: {
          es: "Equípate para el Puente de Octubre: Gadgets, Audio y Productividad",
          en: "Gear up for October Holiday: Audio, Gadgets & Workspace",
        },
        subtext: {
          es: "Selección especial de tecnología y accesorios con entrega garantizada en España.",
          en: "Curated electronics and accessories with verified stock in Spain.",
        },
        ctaText: { es: "Ver Colección del Puente", en: "Explore Collection" },
        ctaLink: "/products?filter=bestsellers",
        actionItems: [
          "Запуск рекламных кампаний в Meta/Google Ads с подборками гаджетов для поездок",
          "Публикация тематического каталога 'Escapada del Pilar' в соцсетях",
          "Проверка складских запасов в Валенсии и Кастельоне",
        ],
      },
      stage2_fast_delivery: {
        stage: "stage2_fast_delivery",
        daysBeforeHoliday: 7,
        ...createPhaseDates("2026-10-12", 7, 3),
        label: {
          es: "Fase 2: Urgencia y Entrega 24/48h (1 semana antes)",
          en: "Phase 2: Fast 24/48h Dispatch Urgency (1 week before)",
        },
        badge: {
          es: "Entrega Garantizada Antes del Puente",
          en: "Guaranteed Pre-Holiday Delivery",
        },
        headline: {
          es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
          en: "Order today, get it before the holiday — 24/48h delivery from Castellón/Valencia",
        },
        subtext: {
          es: "Salida urgente desde nuestro hub logístico. Pedidos antes de las 17:00 salen en el día.",
          en: "Express same-day dispatch from Valencia hub for all orders placed before 17:00.",
        },
        ctaText: { es: "Comprar con Envío Urgente", en: "Order with 24h Delivery" },
        ctaLink: "/products",
        actionItems: [
          "Включение плашки срочной доставки на главной и в карточках товаров",
          "Email-рассылка: 'Últimos días para recibir tu pedido antes del puente'",
          "Координация с курьерскими службами SEUR и Correos Express",
        ],
      },
      stage3_gift_cards: {
        stage: "stage3_gift_cards",
        daysBeforeHoliday: 2,
        ...createPhaseDates("2026-10-12", 2, 0),
        label: {
          es: "Fase 3: Última Hora y Cheque Regalo Digital (2 días antes)",
          en: "Phase 3: Last-Minute Digital Gift Cards (2 days before)",
        },
        badge: {
          es: "Regalo de Última Hora",
          en: "Last-Minute Gift",
        },
        headline: {
          es: "¿Llegas tarde para el envío físico? Regala un Cheque Regalo Digital",
          en: "Too late for physical delivery? Send an Instant Digital Gift Card",
        },
        subtext: {
          es: "Entrega instantánea por email en 1 minuto con tu mensaje personalizado.",
          en: "Instant 1-minute email delivery with personalized greeting.",
        },
        ctaText: { es: "Comprar Cheque Regalo", en: "Buy Digital Gift Card" },
        ctaLink: "/gift-cards",
        actionItems: [
          "Переключение главного Hero-баннера на Cheque Regalo Digital",
          "Push-уведомление в соцсетях: 'Tarjeta regalo digital en 1 minuto'",
          "Проверка работы шлюза Stripe и автогенерации подарочных кодов",
        ],
      },
    },
  },

  // 2. Puente de Todos los Santos (1 de Noviembre)
  {
    id: "todos-los-santos",
    name: {
      es: "Puente de Todos los Santos",
      en: "All Saints Long Weekend",
    },
    description: {
      es: "Festivo nacional en España con descanso de 3-4 días. Foco en confort para el hogar y teletrabajo.",
      en: "National long weekend across Spain. Focus on home wellness and ergonomic desk setups.",
    },
    type: "national_spain",
    targetDate: "2026-11-01",
    isPuente: true,
    phases: {
      stage1_collections: {
        stage: "stage1_collections",
        daysBeforeHoliday: 21,
        ...createPhaseDates("2026-11-01", 21, 8),
        label: {
          es: "Fase 1: Colección Hogar y Confort (3 semanas antes)",
          en: "Phase 1: Home & Living Collection (3 weeks before)",
        },
        badge: { es: "Hogar y Confort Otoñal", en: "Autumn Living Essentials" },
        headline: {
          es: "Prepara tu hogar para el Puente de Noviembre: Sensores, Luz y Calidez",
          en: "Upgrade your home for November Holiday: Smart sensors & Ambient lights",
        },
        subtext: {
          es: "Aroma difusores de roble, lámparas con sensor y monitores de calidad del aire.",
          en: "Solid oak aroma diffusers, smart desk lighting, and air monitors.",
        },
        ctaText: { es: "Ver Colección Hogar", en: "Explore Home Tech" },
        ctaLink: "/products?category=lifestyle",
        actionItems: [
          "Запуск таргета на категории 'Smart Home' и 'Lifestyle'",
          "Настройка подборки 'Bienestar y Confort en Casa'",
        ],
      },
      stage2_fast_delivery: {
        stage: "stage2_fast_delivery",
        daysBeforeHoliday: 7,
        ...createPhaseDates("2026-11-01", 7, 3),
        label: {
          es: "Fase 2: Envío 24/48h antes del 1 de Noviembre (1 semana antes)",
          en: "Phase 2: 24/48h Pre-Holiday Dispatch (1 week before)",
        },
        badge: {
          es: "Envío Rápido Castellón / Valencia",
          en: "Fast Valencia Hub Delivery",
        },
        headline: {
          es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
          en: "Order today, receive before the holiday — 24/48h delivery from Castellón/Valencia",
        },
        subtext: {
          es: "Garantiza la entrega en tu domicilio antes de que empiece el puente festivo.",
          en: "Guaranteed doorstep delivery before the long weekend starts.",
        },
        ctaText: { es: "Comprar Ahora", en: "Shop Now" },
        ctaLink: "/products",
        actionItems: [
          "Активация таймера обратного отсчета до дедлайна курьерских служб",
          "SMS / Email напоминание зарегистрированным клиентам",
        ],
      },
      stage3_gift_cards: {
        stage: "stage3_gift_cards",
        daysBeforeHoliday: 2,
        ...createPhaseDates("2026-11-01", 2, 0),
        label: {
          es: "Fase 3: Cheque Regalo Digital Inmediato (2 días antes)",
          en: "Phase 3: Instant Digital Gift Vouchers (2 days before)",
        },
        badge: { es: "Envío por Email en 1 Min", en: "Email in 1 Min" },
        headline: {
          es: "¿Llegas tarde para el envío físico? Regala un Cheque Regalo Digital",
          en: "Too late for shipping? Send a Digital Gift Card in 60 seconds",
        },
        subtext: {
          es: "El regalo perfecto para acertar siempre, válido para todo el catálogo.",
          en: "The ideal gift with no expiration date, redeemable across the entire store.",
        },
        ctaText: { es: "Comprar Cheque Regalo", en: "Get Gift Card" },
        ctaLink: "/gift-cards",
        actionItems: [
          "Фокусировка баннеров витрины на Cheque Regalo",
          "Ретаргетинг на брошенные корзины с предложением подарочной карты",
        ],
      },
    },
  },

  // 3. Black Friday & Cyber Week (Finales de Noviembre)
  {
    id: "black-friday",
    name: {
      es: "Black Friday & Cyber Week",
      en: "Black Friday & Cyber Week",
    },
    description: {
      es: "El mayor evento comercial del año en España y Europa. Máximo volumen de pedidos y descuentos.",
      en: "Biggest commercial event of the year across Europe. Highest conversion and volume.",
    },
    type: "commercial_eu",
    targetDate: "2026-11-27",
    isPuente: false,
    phases: {
      stage1_collections: {
        stage: "stage1_collections",
        daysBeforeHoliday: 21,
        ...createPhaseDates("2026-11-27", 21, 8),
        label: {
          es: "Fase 1: Pre-Black Friday y Listas de Deseos (3 semanas antes)",
          en: "Phase 1: Pre-Black Friday Wishlists (3 weeks before)",
        },
        badge: { es: "Adelanto Black Friday", en: "Black Friday Early Access" },
        headline: {
          es: "Prepara tu lista de deseos Black Friday: Auriculares Hi-Res, Ergonomía y Smart Home",
          en: "Build your Black Friday Wishlist: Hi-Res Audio, Ergonomics and Smart Tech",
        },
        subtext: {
          es: "Guarda tus productos favoritos para acceder primero a las unidades limitadas.",
          en: "Save your favorite tech to secure limited stock first.",
        },
        ctaText: { es: "Ver Catálogo Black Friday", en: "Browse Catalog" },
        ctaLink: "/products",
        actionItems: [
          "Сбор лидов и подписок на закрытый доступ к скидкам Black Friday",
          "Увеличение складских запасов бестселлеров в 3 раза",
        ],
      },
      stage2_fast_delivery: {
        stage: "stage2_fast_delivery",
        daysBeforeHoliday: 7,
        ...createPhaseDates("2026-11-27", 7, 3),
        label: {
          es: "Fase 2: Semana Black Friday y Envío Express (1 semana antes)",
          en: "Phase 2: Black Friday Week & Express Dispatch (1 week before)",
        },
        badge: { es: "Black Friday Oficial", en: "Official Black Friday" },
        headline: {
          es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
          en: "Order today, receive in 24/48h — Express dispatch from Castellón/Valencia",
        },
        subtext: {
          es: "Descuentos de hasta el 25% con stock garantizado y 2 años de garantía europea.",
          en: "Discounts up to 25% with immediate fulfillment from Spain.",
        },
        ctaText: { es: "Comprar Ofertas Black Friday", en: "Shop Black Friday Deals" },
        ctaLink: "/products?filter=bestsellers",
        actionItems: [
          "Активация промокодов и скидок на сайте",
          "Приоритетная отгрузка заказов со склада 2 раза в день",
        ],
      },
      stage3_gift_cards: {
        stage: "stage3_gift_cards",
        daysBeforeHoliday: 2,
        ...createPhaseDates("2026-11-27", 2, 0),
        label: {
          es: "Fase 3: Cyber Monday y Cheques Regalo (Fin de campaña)",
          en: "Phase 3: Cyber Monday & Digital Gift Cards (Final days)",
        },
        badge: { es: "Últimas Horas Cyber", en: "Final Cyber Hours" },
        headline: {
          es: "¿Llegas tarde para el envío físico? Regala un Cheque Regalo Digital",
          en: "Missed the physical shipping cutoff? Send an Instant Digital Gift Card",
        },
        subtext: {
          es: "Aprovecha los precios Cyber con un bono digital canjeable al instante.",
          en: "Lock in deals with instant digital vouchers redeemable anytime.",
        },
        ctaText: { es: "Cheque Regalo Digital", en: "Digital Gift Voucher" },
        ctaLink: "/gift-cards",
        actionItems: [
          "Финальный пуш по Cyber Monday с акцентом на Cheque Regalo",
        ],
      },
    },
  },

  // 4. Puente de la Constitución y la Inmaculada (6-8 de Diciembre)
  {
    id: "constitucion-inmaculada",
    name: {
      es: "Puente de la Constitución y la Inmaculada",
      en: "Constitution & Immaculate Conception Bridge",
    },
    description: {
      es: "El 'Macropuente' de Diciembre en España (hasta 5-6 días festivos). Inicio de compras navideñas.",
      en: "Major December mega-bridge in Spain (up to 5 days). Kicks off peak holiday gifting.",
    },
    type: "national_spain",
    targetDate: "2026-12-06",
    isPuente: true,
    phases: {
      stage1_collections: {
        stage: "stage1_collections",
        daysBeforeHoliday: 21,
        ...createPhaseDates("2026-12-06", 21, 8),
        label: {
          es: "Fase 1: Guía de Regalos de Navidad (3 semanas antes)",
          en: "Phase 1: Holiday Gift Catalog (3 weeks before)",
        },
        badge: { es: "Guía de Regalos de Navidad", en: "Christmas Gift Guide" },
        headline: {
          es: "Anticípate al Macropuente de Diciembre: Colecciones y Regalos Especiales",
          en: "Get ahead of the December Bridge: Curated Christmas Selections",
        },
        subtext: {
          es: "Encuentra el detalle perfecto para familiares y amigos con envío seguro.",
          en: "Find the ideal gift with safe tracked shipping across Spain & EU.",
        },
        ctaText: { es: "Ver Guía Navideña", en: "Browse Christmas Guide" },
        ctaLink: "/products",
        actionItems: [
          "Запуск таргетированной рекламы 'Regala Tecnología esta Navidad'",
          "Продвижение коллекций 'Regalos hasta 50€' и 'Regalos hasta 100€'",
        ],
      },
      stage2_fast_delivery: {
        stage: "stage2_fast_delivery",
        daysBeforeHoliday: 7,
        ...createPhaseDates("2026-12-06", 7, 3),
        label: {
          es: "Fase 2: Envío 24/48h antes del Macropuente (1 semana antes)",
          en: "Phase 2: 24/48h Delivery before Mega-Bridge (1 week before)",
        },
        badge: {
          es: "Entrega Garantizada Antes del Puente",
          en: "Guaranteed Pre-Bridge Delivery",
        },
        headline: {
          es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
          en: "Order today, receive before the holiday — 24/48h delivery from Castellón/Valencia",
        },
        subtext: {
          es: "Evita colapsos de paquetería de diciembre recibiendo tus compras a tiempo.",
          en: "Avoid December courier backlogs by receiving your package on time.",
        },
        ctaText: { es: "Pedir con Envío 24h", en: "Order with 24h Shipping" },
        ctaLink: "/products",
        actionItems: [
          "Активация бейджей срочной доставки на всех товарах",
          "Информирование о дедлайне оформления для получения до 6 декабря",
        ],
      },
      stage3_gift_cards: {
        stage: "stage3_gift_cards",
        daysBeforeHoliday: 2,
        ...createPhaseDates("2026-12-06", 2, 0),
        label: {
          es: "Fase 3: Cheques Regalo Digitales de Navidad (2 días antes)",
          en: "Phase 3: Digital Christmas Vouchers (2 days before)",
        },
        badge: { es: "Regalo Inmediato", en: "Instant Gift" },
        headline: {
          es: "¿Llegas tarde para el envío físico? Regala un Cheque Regalo Digital",
          en: "Too late for shipping? Send an Instant Digital Gift Card",
        },
        subtext: {
          es: "Recíbelo en tu email al instante para imprimirlo o reenviarlo.",
          en: "Instant email delivery, ready to forward or print nicely at home.",
        },
        ctaText: { es: "Comprar Cheque Regalo", en: "Buy Digital Gift Card" },
        ctaLink: "/gift-cards",
        actionItems: [
          "Фокус кампании на подарки 'Last-minute' по email",
        ],
      },
    },
  },

  // 5. Reyes Magos & Navidad (24 Diciembre - 6 Enero)
  {
    id: "navidad-reyes",
    name: {
      es: "Navidad & Noche de Reyes Magos",
      en: "Christmas & Three Kings Day (Reyes Magos)",
    },
    description: {
      es: "Tradición principal de regalos en España (Noche de Reyes el 5 de Enero). Pico absoluto de compras.",
      en: "Peak gift-giving season in Spain culminating on Three Kings Day (January 5-6).",
    },
    type: "national_spain",
    targetDate: "2027-01-05",
    isPuente: true,
    phases: {
      stage1_collections: {
        stage: "stage1_collections",
        daysBeforeHoliday: 21,
        ...createPhaseDates("2027-01-05", 21, 8),
        label: {
          es: "Fase 1: Colecciones de Reyes Magos (3 semanas antes)",
          en: "Phase 1: Three Kings Gift Guides (3 weeks before)",
        },
        badge: { es: "Especial Reyes Magos", en: "Three Kings Special" },
        headline: {
          es: "Los Reyes Magos eligen Viasglobal: Tecnología, Sonido y Hogar Inteligente",
          en: "Three Kings Gifts at Viasglobal: Premium Tech & Sound",
        },
        subtext: {
          es: "Garantía europea de 2 años y devoluciones ampliadas hasta 30 días.",
          en: "Official 2-year warranty and extended 30-day returns.",
        },
        ctaText: { es: "Ver Guía de Reyes", en: "View Kings Catalog" },
        ctaLink: "/products?filter=bestsellers",
        actionItems: [
          "Запуск таргета 'Carta a los Reyes Magos con Viasglobal'",
          "Выделение в каталоге подборок для него, для неё и для дома",
        ],
      },
      stage2_fast_delivery: {
        stage: "stage2_fast_delivery",
        daysBeforeHoliday: 7,
        ...createPhaseDates("2027-01-05", 7, 3),
        label: {
          es: "Fase 2: Envío Urgente 24/48h antes de Reyes (1 semana antes)",
          en: "Phase 2: 24/48h Delivery before Kings Night (1 week before)",
        },
        badge: {
          es: "Llega Antes de la Noche de Reyes",
          en: "Arrives before Kings Night",
        },
        headline: {
          es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
          en: "Order today, receive in 24/48h — Direct delivery from Castellón/Valencia",
        },
        subtext: {
          es: "Últimas salidas garantizadas para colocar tu paquete debajo del árbol el 6 de Enero.",
          en: "Guaranteed shipping to have gifts under the tree on January 6th.",
        },
        ctaText: { es: "Pedir Ahora", en: "Order Now" },
        ctaLink: "/products",
        actionItems: [
          "Контроль дедлайнов отгрузки с курьерами SEUR / Correos Express",
          "Оперативное информирование клиентов о трек-номерах",
        ],
      },
      stage3_gift_cards: {
        stage: "stage3_gift_cards",
        daysBeforeHoliday: 2,
        ...createPhaseDates("2027-01-05", 2, 0),
        label: {
          es: "Fase 3: Cheque Regalo Digital de Reyes (2 días antes)",
          en: "Phase 3: Digital Kings Gift Voucher (2 days before)",
        },
        badge: { es: "Regalo Express 1 Min", en: "Express 1-Min Gift" },
        headline: {
          es: "¿Llegas tarde para el envío físico? Regala un Cheque Regalo Digital",
          en: "Too late for package delivery? Send an Instant Digital Gift Card",
        },
        subtext: {
          es: "Sorprende en la Noche de Reyes con un bono electrónico inmediato.",
          en: "Instant digital voucher delivered directly to their email.",
        },
        ctaText: { es: "Comprar Cheque Regalo", en: "Get Gift Card" },
        ctaLink: "/gift-cards",
        actionItems: [
          "Финальный призыв к покупке Cheque Regalo 4 и 5 января",
        ],
      },
    },
  },

  // 6. San José / Fallas en Valencia (19 de Marzo)
  {
    id: "fallas-valencia",
    name: {
      es: "Puente de San José & Fallas de Valencia",
      en: "Fallas Festival & Father's Day Bridge",
    },
    description: {
      es: "Festividad mayor en la Comunidad Valenciana y Día del Padre en España. Foco regional y regalos de hombre.",
      en: "Major regional festival in Valencia & Father's Day in Spain. Focus on local hub and gifts for men.",
    },
    type: "regional_valencia",
    targetDate: "2027-03-19",
    isPuente: true,
    phases: {
      stage1_collections: {
        stage: "stage1_collections",
        daysBeforeHoliday: 21,
        ...createPhaseDates("2027-03-19", 21, 8),
        label: {
          es: "Fase 1: Regalos Día del Padre y Fallas (3 semanas antes)",
          en: "Phase 1: Father's Day & Fallas Guides (3 weeks before)",
        },
        badge: { es: "Especial Día del Padre", en: "Father's Day Special" },
        headline: {
          es: "Regalos que sorprenden en el Día del Padre: Tecnología y Espacio de Trabajo",
          en: "Father's Day Gift Tech: Keyboards, Fast Chargers & Audio",
        },
        subtext: {
          es: "Teclados mecánicos ergonómicos, cargadores GaN 100W y auriculares de alta fidelidad.",
          en: "Ergonomic mechanical keyboards, 100W GaN chargers, and Hi-Fi wireless headphones.",
        },
        ctaText: { es: "Ver Colección", en: "Explore Collection" },
        ctaLink: "/products?category=workspace",
        actionItems: [
          "Запуск таргета на подарки к Дню отца в Испании",
          "Подборка 'Para el teletrabajo de Papá'",
        ],
      },
      stage2_fast_delivery: {
        stage: "stage2_fast_delivery",
        daysBeforeHoliday: 7,
        ...createPhaseDates("2027-03-19", 7, 3),
        label: {
          es: "Fase 2: Envío 24/48h desde Valencia (1 semana antes)",
          en: "Phase 2: 24/48h Local Valencia Dispatch (1 week before)",
        },
        badge: { es: "Almacén Local Valencia", en: "Local Valencia Stock" },
        headline: {
          es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
          en: "Order today, receive in 24/48h — Direct from Castellón/Valencia",
        },
        subtext: {
          es: "Entrega urgente en 24h para Valencia, Castellón y toda España.",
          en: "Express 24h doorstep delivery across Spain and Valencia region.",
        },
        ctaText: { es: "Comprar para el 19 de Marzo", en: "Shop with 24h Delivery" },
        ctaLink: "/products",
        actionItems: [
          "Акцент на локальный склад в Валенсии",
        ],
      },
      stage3_gift_cards: {
        stage: "stage3_gift_cards",
        daysBeforeHoliday: 2,
        ...createPhaseDates("2027-03-19", 2, 0),
        label: {
          es: "Fase 3: Cheque Regalo Digital Día del Padre (2 días antes)",
          en: "Phase 3: Father's Day Digital Gift Card (2 days before)",
        },
        badge: { es: "Sin Esperas", en: "Instant Delivery" },
        headline: {
          es: "¿Llegas tarde para el envío físico? Regala un Cheque Regalo Digital",
          en: "Running late? Send Dad an Instant Digital Gift Card",
        },
        subtext: {
          es: "Envío inmediato a su email para que él elija su dispositivo favorito.",
          en: "Instant email delivery so he can pick his favorite tech gear.",
        },
        ctaText: { es: "Comprar Cheque Regalo", en: "Buy Gift Card" },
        ctaLink: "/gift-cards",
        actionItems: [
          "Email рассылка с акцентом на Cheque Regalo к 19 марта",
        ],
      },
    },
  },
];

/**
 * Определяет текущую активную праздничную кампанию и фазу для заданной даты
 */
export function getCampaignForDate(currentDate: Date = new Date()): {
  event: HolidayEvent;
  phase: CampaignPhase;
  daysRemaining: number;
} | null {
  const nowTime = currentDate.getTime();

  for (const event of SPANISH_HOLIDAY_CALENDAR) {
    const targetDate = new Date(event.targetDate).getTime();
    const diffDays = Math.ceil((targetDate - nowTime) / (1000 * 60 * 60 * 24));

    // Проверяем стадии:
    // Фаза 3: от 0 до 2 дней до праздника
    if (diffDays >= 0 && diffDays <= 2) {
      return {
        event,
        phase: event.phases.stage3_gift_cards,
        daysRemaining: diffDays,
      };
    }

    // Фаза 2: от 3 до 7 дней до праздника
    if (diffDays >= 3 && diffDays <= 7) {
      return {
        event,
        phase: event.phases.stage2_fast_delivery,
        daysRemaining: diffDays,
      };
    }

    // Фаза 1: от 8 до 21 дня до праздника
    if (diffDays >= 8 && diffDays <= 21) {
      return {
        event,
        phase: event.phases.stage1_collections,
        daysRemaining: diffDays,
      };
    }
  }

  // Если нет активного праздника в интервале 21 день, возвращаем дефолтное ближайшее событие в режиме Фазы 2
  const defaultEvent = SPANISH_HOLIDAY_CALENDAR[0];
  return {
    event: defaultEvent,
    phase: defaultEvent.phases.stage2_fast_delivery,
    daysRemaining: 7,
  };
}
