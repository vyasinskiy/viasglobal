import { WeeklyCalendarEvent } from "@/types/campaign";

/**
 * Полный годовой маркетинговый календарь на 52 недели для Испании и Валенсийского сообщества.
 * Объединяет 4 слоя событий:
 * 1. Официальные праздники и мосты (Festivos y Puentes)
 * 2. Локальные фиесты Валенсийского сообщества (Magdalena, Fallas, San Juan, Tomatina, 9 d'Octubre)
 * 3. Школьный и семейный календарь (Каникулы, Свадьбы, Vuelta al Cole)
 * 4. Сезонно-бытовые триггеры (Жара, Дожди, Отопление, Уборка, Распродажи)
 */

export const ANNUAL_52_WEEKS_CALENDAR: WeeklyCalendarEvent[] = [
  // ==========================================
  // 🔥 ЯНВАРЬ (ENERO)
  // ==========================================
  {
    weekNumber: 1,
    monthNumber: 1,
    monthName: { es: "Enero", en: "January" },
    dateRange: "1–6 Enero",
    title: { es: "Reyes Magos & Noche de Reyes", en: "Three Kings Day (Reyes Magos)" },
    subtitle: {
      es: "Pico de regalos de última hora en España, juguetes, electrónica y gadgets.",
      en: "Peak last-minute gift buying in Spain, tech toys and electronics.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "workspace", "lifestyle"],
    recommendedProducts: {
      es: "Auriculares inalámbricos, accesorios gaming, altavoces portátiles y Cheques Regalo.",
      en: "Wireless headphones, gaming accessories, portable speakers, and Digital Gift Cards.",
    },
    bannerBadge: { es: "Especial Reyes Magos", en: "Three Kings Special" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para Reyes Magos",
      en: "Fast dispatch from Castellón/Valencia — Get ready for Reyes Magos",
    },
    bannerSubtext: {
      es: "Regalos con entrega garantizada antes del 6 de enero y cheques regalo instantáneos.",
      en: "Gifts with guaranteed arrival before January 6th and instant digital gift cards.",
    },
    targetUrl: "/especial-navidad",
    actionItems: [
      "Фокус на экспресс-доставку в 24ч из Валенсии/Кастельона",
      "За 2 дня до 6 янв — пуш электронных сертификатов Cheque Regalo",
    ],
  },
  {
    weekNumber: 2,
    monthNumber: 1,
    monthName: { es: "Enero", en: "January" },
    dateRange: "7–14 Enero",
    title: { es: "Rebajas de Invierno & Orden en Casa", en: "Winter Sales & Home Organizing" },
    subtitle: {
      es: "Inicio de rebajas de invierno, organización del hogar y limpieza post-festivos.",
      en: "Official start of winter clearance, home tidying, and post-holiday storage.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["workspace", "smart-home", "lifestyle"],
    recommendedProducts: {
      es: "Organizadores de cables, soportes de monitor ergonómicos y cajas de almacenamiento.",
      en: "Cable organizers, ergonomic monitor risers, and storage solutions.",
    },
    bannerBadge: { es: "Rebajas de Invierno", en: "Winter Sales" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para las Rebajas de Invierno",
      en: "Fast dispatch from Castellón/Valencia — Prep for Winter Sales",
    },
    bannerSubtext: {
      es: "Descuentos en organización de espacio de trabajo y hogar inteligente.",
      en: "Discounts on ergonomic workspace essentials and smart home organizers.",
    },
    targetUrl: "/orden-en-casa",
    actionItems: [
      "Запуск скидок до 20% на органайзеры и аксессуары для рабочего места",
      "Email-рассылка: 'Renueva tu setup en las Rebajas de Invierno'",
    ],
  },
  {
    weekNumber: 3,
    monthNumber: 1,
    monthName: { es: "Enero", en: "January" },
    dateRange: "15–21 Enero",
    title: { es: "Fiestas de San Antonio Abad (San Antón)", en: "San Antonio Abad Animal Fiestas" },
    subtitle: {
      es: "Tradición valenciana de bendición de animales y hogueras en municipios del Mediterráneo.",
      en: "Valencian traditional blessing of pets and bonfires across Mediterranean towns.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: false,
    focusCategories: ["lifestyle", "smart-home"],
    recommendedProducts: {
      es: "Sensores ambientales, purificadores de aire, accesorios para mascotas y bienestar.",
      en: "Air quality monitors, diffusers, pet gadgets, and home comfort gear.",
    },
    bannerBadge: { es: "Fiestas de San Antón", en: "San Anton Fiestas" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para San Antonio Abad",
      en: "Fast dispatch from Castellón/Valencia — Get ready for San Anton Fiestas",
    },
    bannerSubtext: {
      es: "Productos para el bienestar del hogar y purificación del ambiente.",
      en: "Home wellness and ambient air purification devices.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "Таргет в соцсетях по Валенсийскому региону на товары для дома и животных",
    ],
  },
  {
    weekNumber: 4,
    monthNumber: 1,
    monthName: { es: "Enero", en: "January" },
    dateRange: "22–31 Enero",
    title: { es: "Frío de Enero & Confort Térmico", en: "January Cold & Thermal Comfort" },
    subtitle: {
      es: "Pico de bajas temperaturas del invierno. Calidez, teletrabajo y confort en el hogar.",
      en: "Peak winter cold snap. Focus on cozy home warmth and teleworking comfort.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["lifestyle", "workspace"],
    recommendedProducts: {
      es: "Difusores de aromas con efecto llama, lámparas cálidas, termos de acero y mantas.",
      en: "Flame-effect aroma diffusers, warm desk lights, insulated tumblers.",
    },
    bannerBadge: { es: "Especial Confort Térmico", en: "Cozy Winter Comfort" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Frío de Enero",
      en: "Fast dispatch from Castellón/Valencia — Beat the January Cold",
    },
    bannerSubtext: {
      es: "Crea un ambiente cálido y productivo en tu espacio de trabajo y hogar.",
      en: "Create a warm and productive atmosphere at your desk and home.",
    },
    targetUrl: "/orden-en-casa",
    actionItems: [
      "Продвижение диффузоров и ламп с регулировкой цветовой температуры",
    ],
  },

  // ==========================================
  // 🌿 ФЕВРАЛЬ (FEBRERO)
  // ==========================================
  {
    weekNumber: 5,
    monthNumber: 2,
    monthName: { es: "Febrero", en: "February" },
    dateRange: "1–7 Febrero",
    title: { es: "Preparación de Carnavales", en: "Carnival Preparations" },
    subtitle: {
      es: "Carnavales de Vinaròs (Castellón) y la Comunidad Valenciana. Fiestas y disfraces.",
      en: "Vinaròs Carnival (Castellón) & coastal festivals. Costumes, parties and music.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Altavoces Bluetooth portátiles resistentes al agua, Powerbanks 100W y luces LED.",
      en: "Waterproof Bluetooth speakers, 100W Powerbanks, and RGB mood lights.",
    },
    bannerBadge: { es: "Especial Carnavales", en: "Carnival Special" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para los Carnavales",
      en: "Fast dispatch from Castellón/Valencia — Get ready for Carnivals",
    },
    bannerSubtext: {
      es: "Sonido portátil, baterías externas y accesorios para disfrutar de la fiesta.",
      en: "Portable audio, powerbanks, and party accessories ready for fast dispatch.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "Промо-акция на портативную акустику и внешние аккумуляторы высокой емкости",
    ],
  },
  {
    weekNumber: 6,
    monthNumber: 2,
    monthName: { es: "Febrero", en: "February" },
    dateRange: "8–14 Febrero",
    title: { es: "San Valentín (Día de los Enamorados)", en: "Valentine's Day (San Valentín)" },
    subtitle: {
      es: "Regalos tecnológicos para parejas, gadgets de relajación y cheques regalo románticos.",
      en: "Tech gifts for couples, wellness gadgets, and instant romantic gift vouchers.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "lifestyle", "workspace"],
    recommendedProducts: {
      es: "Auriculares inalámbricos Hi-Res, difusores aromáticos y Cheques Regalo Digitales.",
      en: "Hi-Res wireless headphones, aroma diffusers, and Digital Gift Cards.",
    },
    bannerBadge: { es: "Especial San Valentín", en: "Valentine's Special" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para San Valentín",
      en: "Fast dispatch from Castellón/Valencia — Get ready for Valentine's Day",
    },
    bannerSubtext: {
      es: "Sorprende con tecnología y diseño. Entregas en 24h o cheque regalo digital al instante.",
      en: "Gift premium sound & wellness with 24h shipping or instant digital voucher.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "Подборки 'Regalos para él' и 'Regalos para ella'",
      "Пуш Cheque Regalo 13 и 14 февраля для опоздавших покупателей",
    ],
  },
  {
    weekNumber: 7,
    monthNumber: 2,
    monthName: { es: "Febrero", en: "February" },
    dateRange: "15–21 Febrero",
    title: { es: "Semana Blanca & Vacaciones Escolares", en: "Semana Blanca & School Break" },
    subtitle: {
      es: "Días no lectivos en colegios. Ocio familiar, viajes cortos y entretenimiento digital.",
      en: "School midterm holidays. Family entertainment and portable gaming gear.",
    },
    layer: "escolar_familia",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "charging", "workspace"],
    recommendedProducts: {
      es: "Soportes para tablets, cargadores múltiples GaN, auriculares con limitador de volumen.",
      en: "Tablet stands, multi-port GaN chargers, and comfortable headphones.",
    },
    bannerBadge: { es: "Semana Blanca", en: "School Midterm" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Semana Blanca",
      en: "Fast dispatch from Castellón/Valencia — Ready for School Midterm Break",
    },
    bannerSubtext: {
      es: "Accesorios y cargadores para viajes familiares y entretenimiento.",
      en: "Travel tech accessories and multi-device fast chargers for the family.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Реклама аксессуаров для зарядки нескольких устройств одновременно",
    ],
  },
  {
    weekNumber: 8,
    monthNumber: 2,
    monthName: { es: "Febrero", en: "February" },
    dateRange: "22–28 Febrero",
    title: { es: "Prep-Fallas & La Crida de Valencia", en: "Fallas Kickoff & La Crida Festival" },
    subtitle: {
      es: "El inicio oficial de las Fallas en Valencia. Vida en la calle, pólvora y reuniones al aire libre.",
      en: "Official Fallas festival opening in Valencia. Outdoor street life and music.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Baterías externas compactas, auriculares inalámbricos, termos de café y tapones de oído.",
      en: "Compact powerbanks, wireless earbuds, insulated drink bottles.",
    },
    bannerBadge: { es: "Rumbo a Fallas", en: "Fallas Kickoff" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Crida de Fallas",
      en: "Fast dispatch from Castellón/Valencia — Get ready for Fallas Crida",
    },
    bannerSubtext: {
      es: "Equípate con batería portátil y sonido para vivir las primeras 'mascletàs'.",
      en: "High-capacity powerbanks and portable audio ready for Valencia street life.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Локальный таргет на Валенсию и пригород на Powerbank и портативные наушники",
    ],
  },

  // ==========================================
  // 🎆 МАРТ (MARZO)
  // ==========================================
  {
    weekNumber: 9,
    monthNumber: 3,
    monthName: { es: "Marzo", en: "March" },
    dateRange: "1–7 Marzo",
    title: { es: "Fiestas de la Magdalena (Castellón)", en: "Magdalena Fiestas (Castellón)" },
    subtitle: {
      es: "Las fiestas fundacionales mayores de la provincia de Castellón (Declaradas de Interés Turístico).",
      en: "Major historical fiestas of Castellón province. Street parades and concerts.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Altavoces portátiles resistentes, cargadores rápidos 100W, mochilas ligeras.",
      en: "Rugged portable speakers, 100W fast chargers, lightweight tech packs.",
    },
    bannerBadge: { es: "Fiestas de la Magdalena", en: "Magdalena Castellón Fiestas" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Magdalena",
      en: "Fast dispatch from Castellón/Valencia — Get ready for Magdalena Fiestas",
    },
    bannerSubtext: {
      es: "Entrega urgente desde nuestro almacén en Castellón/Valencia para disfrutar de las fiestas.",
      en: "Direct express delivery from our Castellón hub for local festival season.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Специальный баннер для жителей провинции Кастельон и Валенсия",
    ],
  },
  {
    weekNumber: 10,
    monthNumber: 3,
    monthName: { es: "Marzo", en: "March" },
    dateRange: "8–14 Marzo",
    title: { es: "Día Internacional de la Mujer (8M)", en: "International Women's Day (8M)" },
    subtitle: {
      es: "Bienestar, ergonomía para profesionales y gadgets de cuidado personal y hogar.",
      en: "Wellness, ergonomic tech for professionals, and smart home self-care devices.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: false,
    focusCategories: ["workspace", "lifestyle", "smart-home"],
    recommendedProducts: {
      es: "Lámparas de escritorio con carga inalámbrica, difusores ultrasónicos, teclados estéticos.",
      en: "Wireless charging desk lamps, ultrasonic aroma diffusers, sleek keyboards.",
    },
    bannerBadge: { es: "Especial 8 de Marzo", en: "Women's Day Special" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Día de la Mujer",
      en: "Fast dispatch from Castellón/Valencia — Women's Day Gifting",
    },
    bannerSubtext: {
      es: "Gadgets de bienestar y elegancia para el espacio de trabajo.",
      en: "Design-forward workspace and wellness gadgets.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "Подборка 'Espacios de Trabajo con Estilo y Bienestar'",
    ],
  },
  {
    weekNumber: 11,
    monthNumber: 3,
    monthName: { es: "Marzo", en: "March" },
    dateRange: "15–19 Marzo",
    title: { es: "Las Fallas (Valencia) & Día del Padre", en: "Las Fallas (Valencia) & Father's Day" },
    subtitle: {
      es: "Doble acontecimiento: Semana Grande de Fallas y Día del Padre en toda España.",
      en: "Major dual event: Fallas peak celebration and Father's Day across Spain.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: true,
    focusCategories: ["workspace", "audio", "charging"],
    recommendedProducts: {
      es: "Teclados mecánicos, cargadores GaN 100W, auriculares ANC y gadgets de precisión.",
      en: "Mechanical ergonomic keyboards, 100W GaN chargers, ANC headphones.",
    },
    bannerBadge: { es: "Día del Padre & Fallas", en: "Father's Day & Fallas" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Día del Padre y Fallas",
      en: "Fast dispatch from Castellón/Valencia — Prep for Father's Day & Fallas",
    },
    bannerSubtext: {
      es: "Regalos que fascinan a papá con entrega directa en 24h desde Valencia.",
      en: "Top-tier tech gifts for Dad with express 24h doorstep dispatch.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "За 1 неделю — слоган 'Pídelo hoy y recíbelo antes de San José'",
      "За 2 дня — кампания электронных сертификатов Cheque Regalo",
    ],
  },
  {
    weekNumber: 12,
    monthNumber: 3,
    monthName: { es: "Marzo", en: "March" },
    dateRange: "20–27 Marzo",
    title: { es: "Llegada de la Primavera & Cambio de Hora", en: "Spring Arrival & Daylight Saving" },
    subtitle: {
      es: "Días más largos, renovación de terrazas, balcones y preparación del coche.",
      en: "Longer days, terrace setups, smart sensors, and spring lifestyle refresh.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["smart-home", "lifestyle"],
    recommendedProducts: {
      es: "Sensores inteligentes de temperatura/humedad, iluminación exterior LED y adaptadores.",
      en: "Smart temperature sensors, ambient LED lights, fast charging cables.",
    },
    bannerBadge: { es: "Bienvenida Primavera", en: "Spring Refresh" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Primavera",
      en: "Fast dispatch from Castellón/Valencia — Welcome the Spring",
    },
    bannerSubtext: {
      es: "Renueva tu hogar y terraza con sensores y tecnología eficiente.",
      en: "Upgrade your home and terrace with connected smart home gear.",
    },
    targetUrl: "/orden-en-casa",
    actionItems: [
      "Кампания на умные датчики климата и экологичное освещение",
    ],
  },
  {
    weekNumber: 13,
    monthNumber: 3,
    monthName: { es: "Marzo", en: "March" },
    dateRange: "28–31 Marzo",
    title: { es: "Preparación de Semana Santa & Operación Salida", en: "Semana Santa Pre-Holiday Prep" },
    subtitle: {
      es: "Primer éxodo vacacional del año. Viajes por carretera hacia costas y campings.",
      en: "First major holiday exodus. Road trips to Mediterranean coasts and cabins.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["charging", "audio", "lifestyle"],
    recommendedProducts: {
      es: "Cargadores rápidos para coche, soportes MagSafe, auriculares para viajes y powerbanks.",
      en: "Fast car chargers, MagSafe car mounts, travel headphones, and powerbanks.",
    },
    bannerBadge: { es: "Operación Salida", en: "Holiday Road Trip" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para Semana Santa",
      en: "Fast dispatch from Castellón/Valencia — Prep for Semana Santa",
    },
    bannerSubtext: {
      es: "Pídelo hoy y recíbelo antes del puente. Todo para tu viaje por carretera.",
      en: "Order today, receive before the holiday road trips kick off.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Активация слогана быстрой доставки из Кастельона/Валенсии перед Страстной неделей",
    ],
  },

  // ==========================================
  // ⛵ АПРЕЛЬ (ABRIL)
  // ==========================================
  {
    weekNumber: 14,
    monthNumber: 4,
    monthName: { es: "Abril", en: "April" },
    dateRange: "1–7 Abril",
    title: { es: "Semana Santa & Vacaciones de Pascua", en: "Semana Santa & Easter Break" },
    subtitle: {
      es: "Festivos nacionales (Jueves y Viernes Santo). Descanso, naturaleza y viajes.",
      en: "National Easter long weekend. Camping, outdoor trips, and family downtime.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Altavoces portátiles impermeables, baterías solares/powerbanks, termos térmicos.",
      en: "Waterproof Bluetooth speakers, outdoor powerbanks, thermal insulated tumblers.",
    },
    bannerBadge: { es: "Semana Santa Oficial", en: "Semana Santa Holiday" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para las Vacaciones de Pascua",
      en: "Fast dispatch from Castellón/Valencia — Enjoy Easter Holidays",
    },
    bannerSubtext: {
      es: "Disfruta al aire libre con el mejor sonido portátil y máxima autonomía.",
      en: "Outdoor sound and multi-device fast charging for your vacation.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Реклама подборки 'Escapadas y Naturaleza'",
    ],
  },
  {
    weekNumber: 15,
    monthNumber: 4,
    monthName: { es: "Abril", en: "April" },
    dateRange: "8–14 Abril",
    title: { es: "Pascua Valenciana & San Vicente Ferrer", en: "Valencian Easter & San Vicente" },
    subtitle: {
      es: "Tradición de 'la mona de pascua', meriendas en la montaña y puentes autonómicos.",
      en: "Traditional Valencian picnic afternoons, kite flying, and regional bridge.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: true,
    focusCategories: ["lifestyle", "audio", "charging"],
    recommendedProducts: {
      es: "Accesorios para meriendas al aire libre, altavoces compactos, powerbanks ligeros.",
      en: "Outdoor picnic tech, compact speakers, lightweight powerbanks.",
    },
    bannerBadge: { es: "Pascua Valenciana", en: "Valencian Easter" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para San Vicente y Pascua",
      en: "Fast dispatch from Castellón/Valencia — Prep for San Vicente Holiday",
    },
    bannerSubtext: {
      es: "Salidas a la naturaleza con sonido y energía ininterrumpida.",
      en: "Outdoor picnics with reliable portable power and wireless audio.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Локальный таргет на Comunidad Valenciana (merienda de Pascua)",
    ],
  },
  {
    weekNumber: 16,
    monthNumber: 4,
    monthName: { es: "Abril", en: "April" },
    dateRange: "15–21 Abril",
    title: { es: "Día del Libro (23 Abr) & Terrazas Abiertas", en: "Book Day (Sant Jordi) & Terraces" },
    subtitle: {
      es: "Celebración del libro y la rosa, iluminación cálida de terrazas y rincones de lectura.",
      en: "Book Day celebrations, cozy reading setups, and garden terrace illumination.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: false,
    focusCategories: ["workspace", "smart-home", "lifestyle"],
    recommendedProducts: {
      es: "Lámparas de lectura regulables, difusores ultrasónicos, soportes para libros/tablets.",
      en: "Dimmable reading lamps, ultrasonic aroma diffusers, tablet & book stands.",
    },
    bannerBadge: { es: "Especial Lectura y Terraza", en: "Reading & Terrace Special" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Día del Libro",
      en: "Fast dispatch from Castellón/Valencia — Book Day & Reading Nooks",
    },
    bannerSubtext: {
      es: "Iluminación ergonómica y difusores para tu rincón favorito de lectura.",
      en: "Eye-care lighting and quiet aroma diffusers for your reading space.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "Подборка 'Rincón de Lectura y Relax'",
    ],
  },
  {
    weekNumber: 17,
    monthNumber: 4,
    monthName: { es: "Abril", en: "April" },
    dateRange: "22–30 Abril",
    title: { es: "Preparación del Puente de Mayo", en: "May Day Bridge Prep (Puente de Mayo)" },
    subtitle: {
      es: "Anticipación al puente del 1 de Mayo (Día del Trabajador). Movilidad urbana y ciclismo.",
      en: "Preparation for May 1st long weekend. Urban mobility and outdoor activities.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["charging", "audio", "lifestyle"],
    recommendedProducts: {
      es: "Soportes de móvil para bicicleta/patinete, auriculares deportivos, cargadores ultrarrápidos.",
      en: "Bike/scooter phone mounts, sports earphones, high-speed fast chargers.",
    },
    bannerBadge: { es: "Rumbo al Puente de Mayo", en: "May Bridge Special" },
    bannerHeadline: {
      es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
      en: "Order today, get it before the holiday — 24/48h delivery from Castellón/Valencia",
    },
    bannerSubtext: {
      es: "Asegura la entrega en tu domicilio antes de salir de fin de semana.",
      en: "Guaranteed doorstep delivery before you head out for the long weekend.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Активация слогана срочной доставки 24/48h к 1 мая",
    ],
  },

  // ==========================================
  // ☀️ МАЙ (MAYO)
  // ==========================================
  {
    weekNumber: 18,
    monthNumber: 5,
    monthName: { es: "Mayo", en: "May" },
    dateRange: "1–7 Mayo",
    title: { es: "Día de la Madre & Puente de Mayo", en: "Mother's Day & May 1st Holiday" },
    subtitle: {
      es: "Primer domingo de Mayo: Día de la Madre en España. Gran pico de regalos familiares.",
      en: "First Sunday of May: Mother's Day across Spain. Peak family gifting.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["lifestyle", "smart-home", "workspace"],
    recommendedProducts: {
      es: "Difusores de roble macizo con aromaterapia, lámparas de diseño y Cheques Regalo.",
      en: "Solid oak aroma diffusers, designer lighting, and Digital Gift Cards.",
    },
    bannerBadge: { es: "Especial Día de la Madre", en: "Mother's Day Special" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Día de la Madre",
      en: "Fast dispatch from Castellón/Valencia — Mother's Day Gifts",
    },
    bannerSubtext: {
      es: "Sorprende a mamá con diseño, confort y tecnología para su día a día.",
      en: "Delight Mom with premium home wellness and smart lifestyle tech.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "Подборки 'El regalo perfecto para Mamá'",
      "За 2 дня до праздника — пуш мгновенных Cheque Regalo",
    ],
  },
  {
    weekNumber: 19,
    monthNumber: 5,
    monthName: { es: "Mayo", en: "May" },
    dateRange: "8–14 Mayo",
    title: { es: "Virgen de los Desamparados (Valencia)", en: "Virgen de los Desamparados (Valencia)" },
    subtitle: {
      es: "Festividad patronal mayor en Valencia (segundo domingo de Mayo). Salidas al río Turia.",
      en: "Patron saint fiesta of Valencia. Turia park outdoor gatherings and sunny walks.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Altavoces portátiles, botellas de acero inoxidable, baterías externas compactas.",
      en: "Portable Bluetooth speakers, insulated bottles, pocket powerbanks.",
    },
    bannerBadge: { es: "Fiesta de Valencia", en: "Valencia City Fiesta" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Fin de Semana de la Virgen",
      en: "Fast dispatch from Castellón/Valencia — Valencia Weekend Getaway",
    },
    bannerSubtext: {
      es: "Sonido y energía portátil para tus paseos por la ciudad y parques.",
      en: "Portable audio and fast charging for outdoor sunny weekends.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Локальная реклама на Валенсию и побережье",
    ],
  },
  {
    weekNumber: 20,
    monthNumber: 5,
    monthName: { es: "Mayo", en: "May" },
    dateRange: "15–21 Mayo",
    title: { es: "Primera Ola de Calor & Terrazas", en: "First Heatwave & Summer Prep" },
    subtitle: {
      es: "Subida térmica primaveral en el Mediterráneo. Climatización, ventiladores e hidratación.",
      en: "First Mediterranean warm days. USB desk cooling fans and hydration essentials.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["smart-home", "workspace", "lifestyle"],
    recommendedProducts: {
      es: "Mini ventiladores silenciosos USB, botellas térmicas frías, difusores con vapor fresco.",
      en: "Ultra-quiet USB desk fans, cold insulated bottles, cool mist diffusers.",
    },
    bannerBadge: { es: "Preparación de Verano", en: "Summer Ready" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Calor",
      en: "Fast dispatch from Castellón/Valencia — Beat the Early Heatwave",
    },
    bannerSubtext: {
      es: "Mantén tu espacio de trabajo fresco con ventiladores silenciosos y bebidas frías.",
      en: "Keep your workspace cool with whisper-quiet desk fans and cold hydration.",
    },
    targetUrl: "/ofertas-verano",
    actionItems: [
      "Запуск подборки 'Frescor y Productividad'",
    ],
  },
  {
    weekNumber: 21,
    monthNumber: 5,
    monthName: { es: "Mayo", en: "May" },
    dateRange: "22–31 Mayo",
    title: { es: "Temporada de Comuniones & Bodas", en: "First Communions & Wedding Season" },
    subtitle: {
      es: "Eventos familiares y celebraciones en España. Búsqueda de regalos útiles y modernos.",
      en: "Family celebrations, first communions and early summer weddings across Spain.",
    },
    layer: "escolar_familia",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "workspace", "lifestyle"],
    recommendedProducts: {
      es: "Auriculares inalámbricos premium, marcos digitales, accesorios ergonómicos, Cheques Regalo.",
      en: "Premium wireless headphones, digital frames, ergonomic accessories, Gift Vouchers.",
    },
    bannerBadge: { es: "Eventos y Celebraciones", en: "Family Celebrations" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Regalos para Comuniones y Bodas",
      en: "Fast dispatch from Castellón/Valencia — Wedding & Communion Gifts",
    },
    bannerSubtext: {
      es: "Tecnología de alta calidad y diseño ideal para regalar en ocasiones especiales.",
      en: "Certified high-quality tech accessories ideal for memorable gifts.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "Кампания 'Regalos inolvidables para eventos'",
    ],
  },

  // ==========================================
  // 🏖️ ИЮНЬ (JUNIO)
  // ==========================================
  {
    weekNumber: 22,
    monthNumber: 6,
    monthName: { es: "Junio", en: "June" },
    dateRange: "1–7 Junio",
    title: { es: "Operación Verano en Casa", en: "Summer Home Prep (Operación Verano)" },
    subtitle: {
      es: "Protección solar de interiores, gestión del calor en oficina y teletrabajo estival.",
      en: "Sun protection for indoor rooms, workspace heat reduction, and summer living.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["workspace", "smart-home"],
    recommendedProducts: {
      es: "Ventiladores de escritorio oscilantes, sensores de temperatura, regletas con protección.",
      en: "Oscillating desk fans, temperature sensors, surge-protected power strips.",
    },
    bannerBadge: { es: "Especial Verano en Casa", en: "Summer Home Specials" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Verano en Casa",
      en: "Fast dispatch from Castellón/Valencia — Summer Home Prep",
    },
    bannerSubtext: {
      es: "Optimiza tu espacio para trabajar fresco y cómodo durante los meses de calor.",
      en: "Stay cool and comfortable while working from home during warm summer days.",
    },
    targetUrl: "/ofertas-verano",
    actionItems: [
      "Продвижение товаров для летнего комфорта в офисе",
    ],
  },
  {
    weekNumber: 23,
    monthNumber: 6,
    monthName: { es: "Junio", en: "June" },
    dateRange: "8–14 Junio",
    title: { es: "Fin de Curso Escolar & Detalle para Profesores", en: "End of School Year & Teacher Gifts" },
    subtitle: {
      es: "Últimos días de colegio. Regalos de agradecimiento a profesores y premios por notas.",
      en: "Final week of school year. Teacher appreciation gifts and kid achievement rewards.",
    },
    layer: "escolar_familia",
    isPuenteOrHoliday: false,
    focusCategories: ["lifestyle", "workspace", "audio"],
    recommendedProducts: {
      es: "Botellas térmicas premium, bolígrafos táctiles, difusores de aromas, Cheques Regalo.",
      en: "Premium insulated bottles, stylus pens, aroma diffusers, and Digital Gift Cards.",
    },
    bannerBadge: { es: "Fin de Curso", en: "End of School Year" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Regalos para Profesores y Fin de Curso",
      en: "Fast dispatch from Castellón/Valencia — Teacher & Graduate Gifts",
    },
    bannerSubtext: {
      es: "Agradece su dedicación con detalles útiles y elegantes.",
      en: "Show appreciation with useful, design-forward desk and wellness gifts.",
    },
    targetUrl: "/regalos-originales",
    actionItems: [
      "Кампания 'Gracias Profe: Regalos elegantes'",
    ],
  },
  {
    weekNumber: 24,
    monthNumber: 6,
    monthName: { es: "Junio", en: "June" },
    dateRange: "15–21 Junio",
    title: { es: "Apertura Temporada de Playa & Noche de San Juan", en: "Beach Season Opening & Pre-San Juan" },
    subtitle: {
      es: "Primeros baños en el mar y preparación de la noche más mágica del verano.",
      en: "First beach weekends and countdown to the magical San Juan beach bonfire night.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Fundas impermeables IPX8, altavoces acuáticos, powerbanks con linterna integrada.",
      en: "IPX8 waterproof phone pouches, waterproof Bluetooth speakers, lantern powerbanks.",
    },
    bannerBadge: { es: "Rumbo a San Juan", en: "Pre-San Juan Festival" },
    bannerHeadline: {
      es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
      en: "Order today, receive before the holiday — 24/48h delivery from Castellón/Valencia",
    },
    bannerSubtext: {
      es: "Música y protección resistente al agua para la noche de San Juan en la playa.",
      en: "Waterproof sound and high-capacity battery power for beach celebrations.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Фокус на водонепроницаемые чехлы и влагозащитную акустику",
    ],
  },
  {
    weekNumber: 25,
    monthNumber: 6,
    monthName: { es: "Junio", en: "June" },
    dateRange: "22–30 Junio",
    title: { es: "Noche de San Juan (24 Jun) & Inicio de Vacaciones", en: "Noche de San Juan (June 24) & Summer" },
    subtitle: {
      es: "Festivo autonómico en la Comunidad Valenciana. Hogueras de San Juan en Alicante y Valencia.",
      en: "Valencian official holiday. Celebrations on beaches across Alicante and Valencia.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "lifestyle", "charging"],
    recommendedProducts: {
      es: "Altavoces potentes para exterior, luces LED portátiles, cables reforzados.",
      en: "High-power outdoor speakers, portable LED mood lights, rugged cables.",
    },
    bannerBadge: { es: "Noche de San Juan", en: "San Juan Fiesta" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para San Juan",
      en: "Fast dispatch from Castellón/Valencia — Ready for San Juan Night",
    },
    bannerSubtext: {
      es: "Celebra la noche más larga del año con el mejor sonido e iluminación.",
      en: "Celebrate summer solstice with crystal-clear wireless audio and portable power.",
    },
    targetUrl: "/ofertas-verano",
    actionItems: [
      "Срочная отгрузка заказов для побережья Валенсии и Кастельона",
    ],
  },

  // ==========================================
  // 🌞 ИЮЛЬ (JULIO)
  // ==========================================
  {
    weekNumber: 26,
    monthNumber: 7,
    monthName: { es: "Julio", en: "July" },
    dateRange: "1–7 Julio",
    title: { es: "Rebajas de Verano Oficiales", en: "Official Summer Sales (Rebajas de Verano)" },
    subtitle: {
      es: "Gran campaña de descuentos de verano en electrónica, viaje y accesorios para coche.",
      en: "Major summer clearance across travel gear, car chargers, and tech accessories.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["charging", "audio", "workspace"],
    recommendedProducts: {
      es: "Cargadores de coche 60W, auriculares Bluetooth para viajes, adaptadores universales.",
      en: "60W fast car chargers, noise cancelling travel headphones, universal adapters.",
    },
    bannerBadge: { es: "Rebajas de Verano", en: "Summer Clearance" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para las Rebajas de Verano",
      en: "Fast dispatch from Castellón/Valencia — Summer Clearance Deals",
    },
    bannerSubtext: {
      es: "Precios especiales en todo el catálogo para equiparte en tus vacaciones.",
      en: "Exclusive summer deals on travel gadgets with 24h dispatch in Spain.",
    },
    targetUrl: "/ofertas-verano",
    actionItems: [
      "Запуск промокода 'VERANO10' и баннеров летних распродаж",
    ],
  },
  {
    weekNumber: 27,
    monthNumber: 7,
    monthName: { es: "Julio", en: "July" },
    dateRange: "8–14 Julio",
    title: { es: "Ola de Calor de Julio & Hidratación", en: "Peak July Heat & Portable Cooling" },
    subtitle: {
      es: "Máximas temperaturas del verano. Gadgets de refresco y accesorios USB portátiles.",
      en: "Peak summer temperatures. USB cooling fans, cold tumblers, and heat relief.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["lifestyle", "workspace"],
    recommendedProducts: {
      es: "Ventiladores de cuello manos libres, termos fríos 24h, humidificadores de mesa.",
      en: "Hands-free neck fans, 24h cold thermal tumblers, personal cool mist humidifiers.",
    },
    bannerBadge: { es: "Combate el Calor", en: "Beat the Heat" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Ola de Calor",
      en: "Fast dispatch from Castellón/Valencia — Beat the Peak Summer Heat",
    },
    bannerSubtext: {
      es: "Envíos en 24h para mantenerte fresco en casa, oficina o playa.",
      en: "Stay cool with portable USB fans and 24h cold drinkware.",
    },
    targetUrl: "/ofertas-verano",
    actionItems: [
      "Рекламная кампания на вентиляторы и термосы в южных и восточных регионах Испании",
    ],
  },
  {
    weekNumber: 28,
    monthNumber: 7,
    monthName: { es: "Julio", en: "July" },
    dateRange: "15–21 Julio",
    title: { es: "Fiestas de la Virgen del Carmen (Pueblos Costeros)", en: "Virgen del Carmen Coastal Fiestas" },
    subtitle: {
      es: "Festividad marinera en Grau de Castellón, Valencia, Alicante y toda la costa española.",
      en: "Sailor and coastal town festivals. Water sports, boat trips, and beachside music.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Altavoces flotantes, fundas impermeables para móvil, soportes para barcos y bicis.",
      en: "Waterproof floating speakers, smartphone dive cases, action mount straps.",
    },
    bannerBadge: { es: "Fiestas del Carmen", en: "Coastal Festival Specials" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Virgen del Carmen",
      en: "Fast dispatch from Castellón/Valencia — Ready for Coastal Fiestas",
    },
    bannerSubtext: {
      es: "Sonido y protección acuática para tus escapadas en la costa.",
      en: "Waterproof gadgets for your boat days and beach weekends.",
    },
    targetUrl: "/ofertas-verano",
    actionItems: [
      "Таргет на прибрежные города Валенсии и Кастельона",
    ],
  },
  {
    weekNumber: 29,
    monthNumber: 7,
    monthName: { es: "Julio", en: "July" },
    dateRange: "22–31 Julio",
    title: { es: "Operación Salida de Agosto", en: "Great August Holiday Exodus (Operación Salida)" },
    subtitle: {
      es: "El mayor movimiento de coches del año. Accesorios para el coche, maletero y trayectos largos.",
      en: "The biggest road travel rush of the year. In-car fast charging and long-trip gear.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: true,
    focusCategories: ["charging", "audio", "lifestyle"],
    recommendedProducts: {
      es: "Cargadores GaN para mechero, soportes magnéticos de móvil, almohadillas de viaje.",
      en: "Fast multi-port car chargers, MagSafe phone mounts, travel memory pillows.",
    },
    bannerBadge: { es: "Operación Salida Agosto", en: "August Road Trips" },
    bannerHeadline: {
      es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
      en: "Order today, get it before your trip — 24/48h delivery from Castellón/Valencia",
    },
    bannerSubtext: {
      es: "Recibe tus accesorios para el coche a tiempo antes de salir a la carretera.",
      en: "Equip your car with fast charging and phone mounts before hitting the highway.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Акцент на авто-аксессуары и срочную доставку до 31 июля",
    ],
  },

  // ==========================================
  // 🌊 АВГУСТ (AGOSTO)
  // ==========================================
  {
    weekNumber: 30,
    monthNumber: 8,
    monthName: { es: "Agosto", en: "August" },
    dateRange: "1–7 Agosto",
    title: { es: "Mes Principal de Vacaciones de Verano", en: "Peak August Summer Holidays" },
    subtitle: {
      es: "Ciudades vacías, playas llenas. Desconexión, podcasts en la playa y fotos de vacaciones.",
      en: "Peak vacation month across Spain. Outdoor lounging, podcasts, and mobile photo gear.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "charging"],
    recommendedProducts: {
      es: "Auriculares con cancelación de ruido para vuelos/trenes, Powerbanks ultraligeros.",
      en: "Noise cancelling travel headphones, compact powerbanks, braided USB cables.",
    },
    bannerBadge: { es: "Vacaciones de Agosto", en: "August Vacation Hub" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para tus Vacaciones",
      en: "Fast dispatch from Castellón/Valencia — Enjoy your Summer Holidays",
    },
    bannerSubtext: {
      es: "Envíos directos a tu hotel o apartamento vacacional en 24h.",
      en: "Direct 24h delivery to your vacation home, apartment, or hotel in Spain.",
    },
    targetUrl: "/ofertas-verano",
    actionItems: [
      "Информирование о работе склада без перерывов на сиесту и отпуска",
    ],
  },
  {
    weekNumber: 31,
    monthNumber: 8,
    monthName: { es: "Agosto", en: "August" },
    dateRange: "8–14 Agosto",
    title: { es: "Puente de la Asunción (15 de Agosto)", en: "Assumption Day Mega-Bridge (15 Agosto)" },
    subtitle: {
      es: "El festivo nacional más celebrado del verano en toda España. Fiestas patronales y barbacoas.",
      en: "The biggest mid-summer national holiday in Spain. Village fiestas and BBQ gatherings.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Altavoces potentes para exteriores, iluminación decorativa de jardín, baterías solares.",
      en: "High-volume outdoor speakers, terrace ambient LED lights, powerbanks.",
    },
    bannerBadge: { es: "Puente del 15 de Agosto", en: "August 15 Bridge Special" },
    bannerHeadline: {
      es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
      en: "Order today, get it before August 15th — 24/48h from Castellón/Valencia",
    },
    bannerSubtext: {
      es: "Garantiza la entrega de tus pedidos antes del gran puente de agosto.",
      en: "Guaranteed pre-holiday delivery for the biggest long weekend of the summer.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Кампания 'Pídelo hoy y recíbelo antes del 15 de agosto'",
    ],
  },
  {
    weekNumber: 32,
    monthNumber: 8,
    monthName: { es: "Agosto", en: "August" },
    dateRange: "15–21 Agosto",
    title: { es: "Festivales de Música (Rototom Sunsplash Benicàssim)", en: "Summer Music Festivals (Rototom)" },
    subtitle: {
      es: "Grandes festivales en la provincia de Castellón y costa. Camping, música y energía portátil.",
      en: "Major music festivals in Benicàssim & Mediterranean coast. Camping & power essentials.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: false,
    focusCategories: ["charging", "audio", "lifestyle"],
    recommendedProducts: {
      es: "Powerbanks de 20.000mAh, tapones reductores de decibelios, altavoces compactos.",
      en: "20,000mAh high-capacity powerbanks, concert earplugs, compact speakers.",
    },
    bannerBadge: { es: "Especial Festivales", en: "Music Festival Essentials" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para los Festivales de Verano",
      en: "Fast dispatch from Castellón/Valencia — Festival Camping Gear",
    },
    bannerSubtext: {
      es: "No te quedes sin batería durante los conciertos con nuestras baterías de alta velocidad.",
      en: "Never run out of phone battery at festival concerts with ultra-fast powerbanks.",
    },
    targetUrl: "/ofertas-verano",
    actionItems: [
      "Реклама в молодежном сегменте на товары для фестивалей и кемпинга",
    ],
  },
  {
    weekNumber: 33,
    monthNumber: 8,
    monthName: { es: "Agosto", en: "August" },
    dateRange: "22–31 Agosto",
    title: { es: "La Tomatina (Buñol) & Pre-Vuelta al Cole", en: "La Tomatina (Buñol) & Early Back to School" },
    subtitle: {
      es: "Fiesta internacional de Buñol (Valencia) y primeros preparativos de la Vuelta al Cole.",
      en: "World-famous La Tomatina in Buñol & early Back to School shopping lists.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: false,
    focusCategories: ["workspace", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Fundas herméticas anti-manchas, mochilas ergonómicas, organizadores de escritorio.",
      en: "Heavy-duty waterproof cases, ergonomic backpacks, study desk organizers.",
    },
    bannerBadge: { es: "La Tomatina & Vuelta al Cole", en: "Tomatina & Early Study" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Vuelta a la Rutina",
      en: "Fast dispatch from Castellón/Valencia — Get ready for Back to School",
    },
    bannerSubtext: {
      es: "Adelanta tus compras de escritorio y tecnología antes de que suban los precios.",
      en: "Early bird savings on ergonomic desk accessories and school tech essentials.",
    },
    targetUrl: "/vuelta-al-cole",
    actionItems: [
      "Открытие лендинга /vuelta-al-cole и запуск кампании раннего бронирования",
    ],
  },

  // ==========================================
  // 🎒 СЕНТЯБРЬ (SEPTIEMBRE)
  // ==========================================
  {
    weekNumber: 34,
    monthNumber: 9,
    monthName: { es: "Septiembre", en: "September" },
    dateRange: "1–7 Septiembre",
    title: { es: "Vuelta al Cole & Universidad (Campaña Principal)", en: "Peak Back to School & University" },
    subtitle: {
      es: "El gran momento de equipamiento para estudiantes y teletrabajadores en septiembre.",
      en: "The major annual back-to-study and workspace upgrade season across Europe.",
    },
    layer: "escolar_familia",
    isPuenteOrHoliday: false,
    focusCategories: ["workspace", "charging", "audio"],
    recommendedProducts: {
      es: "Soportes de portátil ventilados, lámparas LED regulables, hubs USB-C 8 en 1.",
      en: "Adjustable laptop risers, eye-care LED desk lamps, 8-in-1 USB-C hubs.",
    },
    bannerBadge: { es: "Vuelta al Cole Oficial", en: "Official Back to School" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Vuelta al Cole",
      en: "Fast dispatch from Castellón/Valencia — Master your Back to School Setup",
    },
    bannerSubtext: {
      es: "Descuentos en ergonomía, iluminación y accesorios de estudio para sacar las mejores notas.",
      en: "Ergonomic workspace accessories, study lighting, and multi-port charging hubs.",
    },
    targetUrl: "/vuelta-al-cole",
    actionItems: [
      "Главный баннер витрины на тему 'Vuelta al Cole'",
      "Промокод 'ESTUDIO10' со скидкой 10% на категорию Workspace",
    ],
  },
  {
    weekNumber: 35,
    monthNumber: 9,
    monthName: { es: "Septiembre", en: "September" },
    dateRange: "8–14 Septiembre",
    title: { es: "Retorno a la Oficina & Gimnasio (Nuevos Hábitos)", en: "Back to Office & Fitness Reset" },
    subtitle: {
      es: "Reincorporación laboral plena tras las vacaciones. Productividad y bienestar en el trabajo.",
      en: "Full return to office work. Fitness habits, ergonomic desk postures, and health.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["workspace", "audio", "lifestyle"],
    recommendedProducts: {
      es: "Teclados mecánicos silenciosos, auriculares para llamadas con cancelación de voz.",
      en: "Quiet mechanical keyboards, noise cancelling office headsets, posture cushions.",
    },
    bannerBadge: { es: "Vuelta a la Oficina", en: "Back to Office Hub" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Retorno a la Oficina",
      en: "Fast dispatch from Castellón/Valencia — Upgrade your Office Setup",
    },
    bannerSubtext: {
      es: "Aumenta tu productividad con accesorios ergonómicos y sonido premium para videollamadas.",
      en: "Boost your daily productivity with ergonomic tools and crystal-clear call audio.",
    },
    targetUrl: "/vuelta-al-cole",
    actionItems: [
      "Таргетинг на B2B и фрилансеров: 'Renueva tu puesto de teletrabajo'",
    ],
  },
  {
    weekNumber: 36,
    monthNumber: 9,
    monthName: { es: "Septiembre", en: "September" },
    dateRange: "15–21 Septiembre",
    title: { es: "Orden en Casa & Limpieza de Otoño", en: "Home Organization & Autumn Reset" },
    subtitle: {
      es: "Cambio de armario estacional, organización de cables y optimización del espacio.",
      en: "Seasonal closet switch, cable management, and home workspace decluttering.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["workspace", "smart-home"],
    recommendedProducts: {
      es: "Canaletas de cables magnéticas, soportes adhesivos para regletas, cajas de almacenaje.",
      en: "Magnetic cable channels, under-desk power strip trays, minimalist organizers.",
    },
    bannerBadge: { es: "Orden en Casa", en: "Declutter & Organize" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para Organizar tu Hogar",
      en: "Fast dispatch from Castellón/Valencia — Declutter your Workspace & Home",
    },
    bannerSubtext: {
      es: "Soluciones minimalistas para eliminar el desorden de cables en tu escritorio.",
      en: "Clean cable management solutions for a distraction-free home office.",
    },
    targetUrl: "/orden-en-casa",
    actionItems: [
      "Кампания 'Desk Cable Management Essentials'",
    ],
  },
  {
    weekNumber: 37,
    monthNumber: 9,
    monthName: { es: "Septiembre", en: "September" },
    dateRange: "22–30 Septiembre",
    title: { es: "Equinoccio de Otoño & Primeras Lluvias", en: "Autumn Equinox & Rain Prep" },
    subtitle: {
      es: "Llegada del otoño y 'la gota fría' mediterránea. Accesorios resistentes al agua y coche.",
      en: "Autumn equinox and Mediterranean autumn rains. Water repellent gear and umbrella stands.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["lifestyle", "charging"],
    recommendedProducts: {
      es: "Mochilas repelentes al agua, cargadores resistentes, linternas LED de emergencia.",
      en: "Water-repellent tech backpacks, rugged powerbanks, emergency LED lights.",
    },
    bannerBadge: { es: "Bienvenido Otoño", en: "Autumn Essentials" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Otoño",
      en: "Fast dispatch from Castellón/Valencia — Autumn Rain & Weather Prep",
    },
    bannerSubtext: {
      es: "Mochilas y accesorios con protección impermeable para los días de lluvia.",
      en: "Weather-resistant tech backpacks and emergency gear delivered in 24h.",
    },
    targetUrl: "/orden-en-casa",
    actionItems: [
      "Реклама водозащитных рюкзаков и аксессуаров",
    ],
  },

  // ==========================================
  // 🍂 ОКТЯБРЬ (OCTUBRE)
  // ==========================================
  {
    weekNumber: 38,
    monthNumber: 10,
    monthName: { es: "Octubre", en: "October" },
    dateRange: "1–7 Octubre",
    title: { es: "Día de la Comunitat Valenciana (9 d'Octubre)", en: "Valencian Community Day (9 Octubre)" },
    subtitle: {
      es: "Fiesta autonómica mayor y tradición de la 'Mocadorà' de Sant Dionís (día de los enamorados valenciano).",
      en: "Regional holiday across Valencia. Traditional sweets and romantic Valencian gifts.",
    },
    layer: "fiesta_local_valencia",
    isPuenteOrHoliday: true,
    focusCategories: ["lifestyle", "audio", "workspace"],
    recommendedProducts: {
      es: "Difusores de diseño en madera, auriculares premium, detalles para regalar a la pareja.",
      en: "Wooden aroma diffusers, Hi-Res wireless audio, romantic tech gifts.",
    },
    bannerBadge: { es: "9 d'Octubre", en: "Valencian Holiday" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el 9 d'Octubre",
      en: "Fast dispatch from Castellón/Valencia — Celebrate 9 d'Octubre",
    },
    bannerSubtext: {
      es: "Entrega urgente en 24h para disfrutar del puente autonómico en Valencia.",
      en: "Local express delivery across the Valencian Community for the regional holiday.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Праздничный промокод 'VALENCIA9' для региона",
    ],
  },
  {
    weekNumber: 39,
    monthNumber: 10,
    monthName: { es: "Octubre", en: "October" },
    dateRange: "8–14 Octubre",
    title: { es: "Puente del Pilar / Día de la Hispanidad (12 Oct)", en: "Puente del Pilar / Hispanic Day (12 Oct)" },
    subtitle: {
      es: "Primer gran puente nacional del otoño. Desplazamientos familiares y escapadas de fin de semana.",
      en: "First major national autumn bridge. Family road trips and weekend nature escapes.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Auriculares con cancelación de ruido, cargadores rápidos 100W, powerbanks para viaje.",
      en: "ANC wireless headphones, 100W multi-chargers, travel fast powerbanks.",
    },
    bannerBadge: { es: "Puente del Pilar", en: "October 12 Bridge Special" },
    bannerHeadline: {
      es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
      en: "Order today, receive before the holiday — 24/48h delivery from Castellón/Valencia",
    },
    bannerSubtext: {
      es: "Stock garantizado en nuestro hub local para tener tu pedido antes de que empiece el puente.",
      en: "Guaranteed local stock in Valencia for doorstep delivery before the long weekend.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Срочная доставка 24/48h за неделю до 12 октября",
      "За 2 дня — Cheque Regalo Digital",
    ],
  },
  {
    weekNumber: 40,
    monthNumber: 10,
    monthName: { es: "Octubre", en: "October" },
    dateRange: "15–21 Octubre",
    title: { es: "Utopía del Hogar & Aislamiento Térmico", en: "Cozy Home & Thermal Comfort Prep" },
    subtitle: {
      es: "Bajada de temperaturas nocturnas. Confort en el salón y oficina en casa.",
      en: "Night temperature drops. Cozy lighting, ambient diffusers, and warm desktop setups.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["smart-home", "lifestyle"],
    recommendedProducts: {
      es: "Difusores con luz efecto chimenea, bombillas inteligentes de tono cálido, alfombrillas térmicas.",
      en: "Flame-effect aroma humidifiers, smart warm LED bulbs, desk mat accessories.",
    },
    bannerBadge: { es: "Hogar y Calidez", en: "Warm & Cozy Living" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Calidez en el Hogar",
      en: "Fast dispatch from Castellón/Valencia — Cozy Autumn Living",
    },
    bannerSubtext: {
      es: "Aroma difusores y luz ambiental para convertir tu casa en un refugio acogedor.",
      en: "Ambient lighting and warm mist diffusers to make your home cozy this autumn.",
    },
    targetUrl: "/orden-en-casa",
    actionItems: [
      "Кампания на аромадиффузоры и умное освещение",
    ],
  },
  {
    weekNumber: 41,
    monthNumber: 10,
    monthName: { es: "Octubre", en: "October" },
    dateRange: "22–31 Octubre",
    title: { es: "Halloween & Puente de Todos los Santos (1 Nov)", en: "Halloween & All Saints Bridge (1 Nov)" },
    subtitle: {
      es: "Fiestas de Halloween, reuniones familiares y puente de Todos los Santos en España.",
      en: "Halloween gatherings, family reunions, and All Saints national long weekend.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "lifestyle", "smart-home"],
    recommendedProducts: {
      es: "Altavoces Bluetooth con luces RGB, sensores de presencia, Cheques Regalo.",
      en: "RGB party speakers, smart motion sensors, digital gift vouchers.",
    },
    bannerBadge: { es: "Halloween & Todos los Santos", en: "Halloween & All Saints" },
    bannerHeadline: {
      es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
      en: "Order today, receive before the holiday — 24/48h delivery from Castellón/Valencia",
    },
    bannerSubtext: {
      es: "Entrega urgente garantizada para tus planes del puente de noviembre.",
      en: "Guaranteed 24/48h delivery for your November bridge weekend plans.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Активация баннера срочной доставки к 1 ноября",
    ],
  },

  // ==========================================
  // 🛍️ НОЯБРЬ (NOVIEMBRE)
  // ==========================================
  {
    weekNumber: 42,
    monthNumber: 11,
    monthName: { es: "Noviembre", en: "November" },
    dateRange: "1–7 Noviembre",
    title: { es: "Temporada de Lluvias & Humedad en Casa", en: "Rainy Season & Dehumidifying" },
    subtitle: {
      es: "Control de humedad en interiores, secadores de calzado y confort doméstico.",
      en: "Indoor humidity management, air freshness monitors, and cozy room tech.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["smart-home", "lifestyle"],
    recommendedProducts: {
      es: "Monitores de calidad del aire con sensor suizo, difusores ultrasónicos, deshumidificadores.",
      en: "Swiss-sensor air quality monitors, ultrasonic diffusers, humidity meters.",
    },
    bannerBadge: { es: "Clima y Confort", en: "Indoor Air Quality" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Confort en Días de Lluvia",
      en: "Fast dispatch from Castellón/Valencia — Indoor Comfort on Rainy Days",
    },
    bannerSubtext: {
      es: "Monitores de aire y sensores para un ambiente saludable y libre de humedad.",
      en: "Swiss-grade air quality monitors and sensors for a healthier indoor space.",
    },
    targetUrl: "/orden-en-casa",
    actionItems: [
      "Реклама умных датчиков воздуха Matter / HomeKit",
    ],
  },
  {
    weekNumber: 43,
    monthNumber: 11,
    monthName: { es: "Noviembre", en: "November" },
    dateRange: "8–14 Noviembre",
    title: { es: "11.11 (Día Mundial del Shopping)", en: "11.11 Global Singles' Day Shopping" },
    subtitle: {
      es: "El mayor evento de compras online previo al Black Friday. Ofertas flash en electrónica.",
      en: "Major global online shopping day ahead of Black Friday. Flash deals on tech gear.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["charging", "workspace", "audio"],
    recommendedProducts: {
      es: "Cargadores GaN 100W multipuerto, auriculares ANC, lámparas de escritorio inteligentes.",
      en: "100W multi-port GaN chargers, ANC wireless headphones, smart desk lamps.",
    },
    bannerBadge: { es: "Especial 11.11", en: "11.11 Flash Deals" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el 11.11",
      en: "Fast dispatch from Castellón/Valencia — 11.11 Global Shopping Fest",
    },
    bannerSubtext: {
      es: "Ofertas flash exclusivas en electrónica y carga ultrarrápida con entrega en 24h.",
      en: "Exclusive flash discounts on high-speed GaN charging and premium audio.",
    },
    targetUrl: "/products",
    actionItems: [
      "Запуск промокода 'SHOPPING11' на 24 часа",
    ],
  },
  {
    weekNumber: 44,
    monthNumber: 11,
    monthName: { es: "Noviembre", en: "November" },
    dateRange: "15–21 Noviembre",
    title: { es: "Calentamiento Black Friday & 'Regalos Anticipados'", en: "Black Friday Warm-up & Early Gifting" },
    subtitle: {
      es: "Preparación de carritos y listas de deseos para la gran semana del Black Friday.",
      en: "Wishlist building and early-bird gift shopping ahead of Black Friday week.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: false,
    focusCategories: ["audio", "workspace", "smart-home"],
    recommendedProducts: {
      es: "Top ventas de sonido Hi-Res, teclados ergonómicos, soportes de monitor.",
      en: "Best-selling Hi-Res headphones, ergonomic keyboards, dual monitor risers.",
    },
    bannerBadge: { es: "Pre-Black Friday", en: "Pre-Black Friday Access" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para el Black Friday",
      en: "Fast dispatch from Castellón/Valencia — Get ready for Black Friday",
    },
    bannerSubtext: {
      es: "Adelanta tus compras navideñas antes de que se agoten las unidades en stock.",
      en: "Lock in your holiday gifts early before warehouse inventory sells out.",
    },
    targetUrl: "/products",
    actionItems: [
      "Email-рассылка: 'Guarda tus favoritos antes de que empiece Black Friday'",
    ],
  },
  {
    weekNumber: 45,
    monthNumber: 11,
    monthName: { es: "Noviembre", en: "November" },
    dateRange: "22–30 Noviembre",
    title: { es: "Black Friday & Cyber Monday Oficial", en: "Official Black Friday & Cyber Monday" },
    subtitle: {
      es: "El pico comercial más alto del año en España. Descuentos máximos en todo el catálogo.",
      en: "The peak commercial week of the year across Europe. Maximum storewide savings.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "workspace", "smart-home", "charging", "lifestyle"],
    recommendedProducts: {
      es: "Todo el catálogo con precios reducidos, bundles de carga rápida y Cheques Regalo.",
      en: "Full catalog on promotional sale, GaN bundles, and Digital Gift Vouchers.",
    },
    bannerBadge: { es: "Black Friday Oficial", en: "Official Black Friday" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Black Friday con Envío Inmediato 24h",
      en: "Fast dispatch from Castellón/Valencia — Official Black Friday 24h Shipping",
    },
    bannerSubtext: {
      es: "Descuentos de hasta el 25% con stock garantizado en España y envío urgente 24/48h.",
      en: "Up to 25% off with guaranteed local stock in Spain and 24/48h express delivery.",
    },
    targetUrl: "/products",
    actionItems: [
      "Круглосуточная отгрузка заказов со склада",
      "Киберпонедельник — промокод на Cheque Regalo",
    ],
  },

  // ==========================================
  // 🎄 ДЕКАБРЬ (DICIEMBRE)
  // ==========================================
  {
    weekNumber: 46,
    monthNumber: 12,
    monthName: { es: "Diciembre", en: "December" },
    dateRange: "1–7 Diciembre",
    title: { es: "Puente de la Constitución y la Inmaculada (Macropuente)", en: "Constitution & Immaculate Mega-Bridge" },
    subtitle: {
      es: "El puente más largo de España (hasta 5-6 días). Salidas a la nieve, viajes y compras navideñas.",
      en: "The biggest holiday bridge in Spain (up to 5 days). Ski trips and holiday shopping.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["charging", "audio", "lifestyle"],
    recommendedProducts: {
      es: "Cargadores rápidos para viajes, auriculares ANC para trayectos en tren, powerbanks.",
      en: "Travel fast multi-chargers, ANC train travel headphones, high-density powerbanks.",
    },
    bannerBadge: { es: "Macropuente de Diciembre", en: "December Mega-Bridge" },
    bannerHeadline: {
      es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
      en: "Order today, receive before the holiday — 24/48h delivery from Castellón/Valencia",
    },
    bannerSubtext: {
      es: "Evita retrasos de paquetería recibiendo tus compras antes del puente festivo.",
      en: "Beat December courier delays by getting your orders safely before the bridge starts.",
    },
    targetUrl: "/especial-puentes",
    actionItems: [
      "Плашка срочной доставки до 5 декабря 17:00",
    ],
  },
  {
    weekNumber: 47,
    monthNumber: 12,
    monthName: { es: "Diciembre", en: "December" },
    dateRange: "8–14 Diciembre",
    title: { es: "Decoración Navideña & Ambiente en el Hogar", en: "Christmas Home Decor & Ambiance" },
    subtitle: {
      es: "Montaje del árbol de Navidad, iluminación acogedora y preparación de cenas familiares.",
      en: "Setting up Christmas trees, cozy ambient LED lights, and festive dinner prep.",
    },
    layer: "temporada_hogar",
    isPuenteOrHoliday: false,
    focusCategories: ["smart-home", "lifestyle"],
    recommendedProducts: {
      es: "Lámparas con sensor de movimiento, difusores aromáticos de canela/cedro, luces LED.",
      en: "Smart motion sensor nightlights, cedar/cinnamon aroma diffusers, mood LED lights.",
    },
    bannerBadge: { es: "Especial Navidad en Casa", en: "Holiday Home Decor" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para la Navidad en Casa",
      en: "Fast dispatch from Castellón/Valencia — Prep your Home for Christmas",
    },
    bannerSubtext: {
      es: "Crea una atmósfera mágica en tu hogar con aromas y luz ambiental relajante.",
      en: "Create a warm festive ambiance with gentle lighting and soothing winter aromas.",
    },
    targetUrl: "/especial-navidad",
    actionItems: [
      "Подборка 'Navidad Acogedora en Casa'",
    ],
  },
  {
    weekNumber: 48,
    monthNumber: 12,
    monthName: { es: "Diciembre", en: "December" },
    dateRange: "15–21 Diciembre",
    title: { es: "Pico de Compras de Navidad & Amigo Invisible", en: "Peak Christmas Shopping & Secret Santa" },
    subtitle: {
      es: "Última semana para garantizar envíos físicos debajo del árbol antes de Nochebuena.",
      en: "Final week for guaranteed physical deliveries under the tree before Christmas Eve.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "workspace", "lifestyle"],
    recommendedProducts: {
      es: "Regalos de Amigo Invisible (hasta 30€ y 50€), auriculares y accesorios para el setup.",
      en: "Secret Santa gifts (under €30 and €50), wireless earbuds, desk upgrades.",
    },
    bannerBadge: { es: "Llega Antes de Navidad", en: "Guaranteed Pre-Christmas Delivery" },
    bannerHeadline: {
      es: "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia",
      en: "Order today, get it before Christmas — 24/48h delivery from Castellón/Valencia",
    },
    bannerSubtext: {
      es: "Salidas diarias urgentes con Correos Express y SEUR. Fecha límite para Nochebuena.",
      en: "Daily express dispatch via Correos Express and SEUR. Christmas Eve shipping deadline.",
    },
    targetUrl: "/especial-navidad",
    actionItems: [
      "Таймер обратного отсчета до дедлайна доставки на 24 декабря",
      "Прием заказов до 21 декабря 17:00",
    ],
  },
  {
    weekNumber: 49,
    monthNumber: 12,
    monthName: { es: "Diciembre", en: "December" },
    dateRange: "22–27 Diciembre",
    title: { es: "Nochebuena & Navidad (Ocio Familiar)", en: "Christmas Eve, Christmas & Family Leisure" },
    subtitle: {
      es: "Días de celebración familiar. Juegos, sonido festivo y compras de Reyes Magos.",
      en: "Family holiday dinners, music, board games, and preparation for Three Kings Day.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "lifestyle"],
    recommendedProducts: {
      es: "Altavoces portátiles para villancicos, Cheques Regalo Digitales instantáneos.",
      en: "Bluetooth sound systems, portable speakers, and Instant Digital Gift Cards.",
    },
    bannerBadge: { es: "¡Feliz Navidad!", en: "Merry Christmas!" },
    bannerHeadline: {
      es: "¿Llegas tarde para el envío físico? Regala un Cheque Regalo Digital",
      en: "Too late for shipping? Send an Instant Digital Gift Voucher in 1 Minute",
    },
    bannerSubtext: {
      es: "El regalo perfecto que llega en 1 minuto a su correo para imprimir o reenviar.",
      en: "Instant email delivery, ready to forward or print nicely under the tree.",
    },
    targetUrl: "/gift-cards",
    actionItems: [
      "Главный фокус 23–25 декабря на электронные подарочные карты Cheque Regalo",
    ],
  },
  {
    weekNumber: 50,
    monthNumber: 12,
    monthName: { es: "Diciembre", en: "December" },
    dateRange: "28–31 Diciembre",
    title: { es: "Nochevieja, Año Nuevo & Final de Reyes Magos", en: "New Year's Eve & Three Kings Final Rush" },
    subtitle: {
      es: "Campanadas de fin de año, uvas de la suerte y el gran esprint final hacia la Noche de Reyes.",
      en: "New Year's Eve celebrations and the final shopping rush toward Three Kings Day.",
    },
    layer: "festivo_puente",
    isPuenteOrHoliday: true,
    focusCategories: ["audio", "workspace", "lifestyle"],
    recommendedProducts: {
      es: "Sonido de alta fidelidad, cargadores de alta potencia, accesorios de diseño y Cheques Regalo.",
      en: "Hi-Fi wireless sound, high-power GaN chargers, premium gifts, and Gift Cards.",
    },
    bannerBadge: { es: "Año Nuevo & Reyes", en: "New Year & Kings Rush" },
    bannerHeadline: {
      es: "Envío rápido desde Castellón/Valencia — Prepárate para Reyes Magos",
      en: "Fast dispatch from Castellón/Valencia — Final Kings Day Rush",
    },
    bannerSubtext: {
      es: "Últimos días para recibir tus regalos debajo del árbol antes del 6 de Enero.",
      en: "Final days for physical delivery before Three Kings morning on January 6th.",
    },
    targetUrl: "/especial-navidad",
    actionItems: [
      "Приоритетные отгрузки со склада 2-4 января для доставки до 5 января",
      "5 января — 100% переключение на Cheque Regalo Digital",
    ],
  },
];

/**
 * Получает событие по номеру недели (1-52)
 */
export function getWeekEvent(weekNumber: number): WeeklyCalendarEvent {
  const normalized = Math.max(1, Math.min(50, weekNumber));
  return ANNUAL_52_WEEKS_CALENDAR.find((w) => w.weekNumber === normalized) || ANNUAL_52_WEEKS_CALENDAR[0];
}

/**
 * Вычисляет номер текущей недели года и возвращает актуальное событие
 */
export function getCurrentWeekEvent(currentDate: Date = new Date()): WeeklyCalendarEvent {
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
  const pastDaysOfYear = (currentDate.getTime() - startOfYear.getTime()) / 86400000;
  const currentWeekNumber = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  
  // Возвращаем событие для текущей недели
  return getWeekEvent(Math.min(50, currentWeekNumber));
}

/**
 * Фильтрация событий по номеру месяца (1-12)
 */
export function getEventsByMonth(monthNumber: number): WeeklyCalendarEvent[] {
  return ANNUAL_52_WEEKS_CALENDAR.filter((w) => w.monthNumber === monthNumber);
}

/**
 * Фильтрация событий по слою (Layer)
 */
export function getEventsByLayer(layer: string): WeeklyCalendarEvent[] {
  return ANNUAL_52_WEEKS_CALENDAR.filter((w) => w.layer === layer);
}

export interface UpcomingCalendarEvent extends WeeklyCalendarEvent {
  relativeWeeks: number;
  isCurrent: boolean;
  relativeLabel: { es: string; en: string };
}

/**
 * Возвращает упорядоченный список ближайших событий года начиная от текущей недели
 * и далее по возрастанию удаленности во времени (хронологический порядок в будущее).
 */
export function getUpcomingEvents(
  startWeekNumber: number = getCurrentWeekEvent().weekNumber,
  count: number = ANNUAL_52_WEEKS_CALENDAR.length
): UpcomingCalendarEvent[] {
  const total = ANNUAL_52_WEEKS_CALENDAR.length;
  const result: UpcomingCalendarEvent[] = [];

  for (let offset = 0; offset < count; offset++) {
    // Циклический сдвиг недели (1..50)
    let targetWeek = ((startWeekNumber - 1 + offset) % total) + 1;
    const event = getWeekEvent(targetWeek);

    // Относительная временная метка для кнопок и бейджей без избыточных суффиксов (+1 sem, +2 sem и т.д.)
    let relativeLabel = { es: "", en: "" };
    if (offset === 0) {
      relativeLabel = { es: "🔥 Esta semana (En curso)", en: "🔥 This Week (Active)" };
    } else if (offset === 1) {
      relativeLabel = { es: "Próxima semana", en: "Next Week" };
    } else {
      relativeLabel = {
        es: `En ${offset} semanas`,
        en: `In ${offset} weeks`,
      };
    }

    result.push({
      ...event,
      relativeWeeks: offset,
      isCurrent: offset === 0,
      relativeLabel,
    });
  }

  return result;
}

/**
 * Возвращает полное культурно-историческое и прикладное описание события
 */
export function getEventFullDescription(event: WeeklyCalendarEvent, lang: "es" | "en" = "es"): string {
  if (event.description && event.description[lang]) {
    return event.description[lang];
  }

  const detailedDescriptions: Record<number, { es: string; en: string }> = {
    1: {
      es: "La Noche y Día de Reyes Magos (5 y 6 de enero) es el momento cumbre de la temporada navideña en toda España. Las familias asisten a las multitudinarias Cabalgatas de Reyes y los niños esperan con ilusión la llegada de Melchor, Gaspar y Baltasar. Es el pico absoluto de regalos tecnológicos, audio y gadgets de última hora con entrega rápida.",
      en: "Three Kings Day (January 5th & 6th) is the peak gift-giving moment across Spain. Families enjoy grand Kings Parades, and children wake up to presents. It marks the ultimate rush for tech toys, consumer audio, and instant electronic gift vouchers.",
    },
    2: {
      es: "El inicio oficial de las Rebajas de Invierno en España coincide con el regreso a la rutina laboral y escolar. Es el momento perfecto de reorganización del hogar, optimización del espacio de trabajo con brazos ergonómicos, gestión de cables y almacenamiento inteligente post-navideño.",
      en: "The kickoff of Winter Clearance in Spain coincides with resuming work and studies. It's the prime window for home decluttering, workspace ergonomics, cable tidying, and post-holiday storage optimization.",
    },
    3: {
      es: "Las Fiestas de San Antonio Abad (San Antón) son una arraigada tradición en Valencia, Castellón y pueblos del Mediterráneo, donde se encienden monumentales hogueras y se celebra la bendición de animales y mascotas. Una festividad comunitaria que da paso al confort del hogar y bienestar familiar.",
      en: "The Fiestas of San Antonio Abad celebrate Mediterranean pet blessing traditions and community bonfires across Valencian towns, focusing on home wellness, cozy heating, and pet-friendly smart devices.",
    },
    4: {
      es: "Las últimas semanas de enero registran históricamente las temperaturas más bajas del invierno en la península. El foco se traslada al confort térmico en interiores, teletrabajo acogedor, iluminación cálida, difusores de aromas y climatización eficiente del hogar.",
      en: "Late January brings the coldest winter temperatures across Spain. The spotlight shifts to indoor thermal comfort, cozy home office setups, warm ambient lighting, and smart climate control.",
    },
    5: {
      es: "Los Carnavales de la Comunidad Valenciana, con especial protagonismo del famoso Carnaval de Vinaròs (Castellón), llenan las calles de música, desfiles de comparsas y disfraces. Días de gran movilidad donde el audio portátil, las baterías externas y la iluminación LED son imprescindibles.",
      en: "Carnival celebrations across the Valencian Community, especially the renowned Vinaròs Carnival in Castellón, bring vibrant street parades, music, and costumes. High-capacity power banks and portable sound are essential.",
    },
    6: {
      es: "San Valentín es una de las fechas comerciales más relevantes del primer trimestre en España. Parejas de todas las edades buscan detalles originales de tecnología, auriculares de alta fidelidad, bienestar personal o cheques regalo electrónicos inmediatos para celebrar el amor.",
      en: "Valentine's Day is one of Spain's top Q1 gifting milestones. Couples seek thoughtful tech accessories, premium ANC headphones, wellness diffusers, and instant digital vouchers.",
    },
    7: {
      es: "La Semana Blanca es el periodo no lectivo en colegios durante febrero, ideal para escapadas a la nieve, viajes familiares por carretera y turismo rural. Los accesorios de carga para coches, soportes de tablet y auriculares infantiles son los grandes protagonistas.",
      en: "Semana Blanca represents the mid-term school break in Spain, sparking family ski trips and coastal getaways. Multi-device travel chargers, car mounts, and tablet holders take center stage.",
    },
    8: {
      es: "El último domingo de febrero, las Torres de Serranos de Valencia acogen 'La Crida', el emotivo pregón donde la Fallera Mayor proclama el inicio oficial de las Fallas. La ciudad entera sale a la calle para dar la bienvenida a la fiesta con pólvora, música y reuniones al aire libre.",
      en: "On the final Sunday of February, Valencia's Serranos Towers host 'La Crida', the grand opening proclamation of Las Fallas. Thousands celebrate in the streets with pyrotechnics, brass bands, and outdoor gatherings.",
    },
    9: {
      es: "Las Fiestas de la Magdalena son las fiestas mayores de Castellón de la Plana, declaradas de Interés Turístico Internacional. Conmemoran el traslado de la ciudad con la tradicional Romería de les Canyes, los monumentos luminosos de las 'Gaiates', conciertos y desfiles. Nueve días intensos en la calle que requieren sonido potente y baterías de carga rápida.",
      en: "Fiestas de la Magdalena in Castellón celebrate the city's historic foundation with the Romería de les Canyes pilgrimage, magnificent Gaiates light monuments, and lively street bands. Nine days of outdoor festivities powered by portable audio and rugged power banks.",
    },
    10: {
      es: "La semana previa a la gran semana fallera reúne a miles de visitantes en la Plaza del Ayuntamiento para las Mascletàs diarias a las 14:00. Las comisiones falleras preparan la 'Plantà' de sus monumentos y la vida en los casales no se detiene día ni noche.",
      en: "The week leading to Fallas peak draws thousands daily to Valencia's City Hall square for the thunderous 2:00 PM Mascletà. Fallas artists begin assembling monumental sculptures across neighborhoods.",
    },
    11: {
      es: "La Semana Grande de las Fallas de Valencia (Patrimonio de la Humanidad por la UNESCO). La 'Plantà', la emotiva Ofrenda de Flores a la Virgen de los Desamparados, la espectacular Nit del Foc y la mágica 'Cremà' donde arden más de 700 monumentos. Sonido portátil, auriculares y cargadores ultra-rápidos son esenciales para vivir la fiesta al máximo.",
      en: "The Grand Week of Las Fallas in Valencia (UNESCO World Heritage). Featuring monument unveilings, emotional flower offerings, the breathtaking Nit del Foc fireworks, and the iconic Cremà bonfires. Essential gear includes portable wireless speakers and 100W GaN power stations.",
    },
    12: {
      es: "El Día del Padre en España coincide con la festividad de San José. Es un momento clave para homenajear a los padres con regalos tecnológicos prácticos: cargadores multi-dispositivo, auriculares con cancelación de ruido, soportes de escritorio y tarjetas regalo.",
      en: "Father's Day in Spain coincides with Saint Joseph's Feast. A major gift milestone honoring dads with practical tech: multi-device charging hubs, ANC headphones, ergonomic workspace gear, and instant gift cards.",
    },
    13: {
      es: "La llegada de la primavera y el cambio de hora oficial amplían las horas de luz solar. Se reactivan las terrazas, los paseos por el cauce del río Turia y la costa de Castellón. Es tiempo de puesta a punto para el aire libre, sonido portátil e iluminación solar.",
      en: "Spring arrival and daylight savings time bring longer sunny afternoons across Mediterranean Spain. Perfect for outdoor park workouts, beach promenade strolls, and portable lifestyle gadgets.",
    },
    14: {
      es: "La Semana Santa y el Puente de Pascua suponen el primer gran éxodo vacacional del año en España. En la Comunidad Valenciana destaca la Semana Santa Marinera en los Poblados Marítimos de Valencia. Días de escapadas, viajes a la playa y descanso que disparan la demanda de gadgets de viaje y audio.",
      en: "Holy Week & Easter Bridge mark the year's first major travel holiday in Spain, alongside Valencia's coastal Semana Santa Marinera. A prime travel window requiring high-speed GaN chargers and travel audio gear.",
    },
    15: {
      es: "Tradición típicamente valenciana de salir al campo o a la playa en Pascua a 'menjar la mona' de pascua y volar el 'catxerulo' (cometa tradicional). Reencuentros familiares al aire libre donde la música y la fotografía móvil son protagonistas.",
      en: "The Easter Monday 'Mona de Pascua' tradition sees Valencian families gather in countryside parks and beaches to enjoy sweet pastries and fly traditional kites, backed by portable music and mobile accessories.",
    },
    16: {
      es: "Festividad del patrón de la Comunidad Valenciana, San Vicente Ferrer, con las tradicionales representaciones teatrales de los 'Miracles' en las plazas históricas de Valencia. Fin de las vacaciones pascuales y reactivación del comercio y la oficina.",
      en: "San Vicente Ferrer is the patron saint feast of the Valencian Community, featuring historic miracle plays in city plazas. A key moment for refreshing work equipment and home organization.",
    },
    17: {
      es: "El Puente de Mayo (1 de mayo - Día del Trabajo) abre una fantástica ventana de 3 a 4 días de descanso en toda España. Las playas de Valencia, Gandía, Cullera y Benicàssim reciben a los primeros veraneantes. Clave para envíos 24h antes del puente.",
      en: "The May 1st Labor Day Bridge provides a 3 to 4 day holiday weekend nationwide. Mediterranean beaches see their first wave of vacationers, making 24h fast dispatch before the bridge essential.",
    },
    18: {
      es: "El primer domingo de mayo se celebra el Día de la Madre en España. Uno de los mayores hitos de compras de regalos del año: auriculares premium, dispositivos de confort y bienestar, gadgets de belleza y cheques regalo con mensaje personalizado.",
      en: "Mother's Day in Spain is celebrated on the first Sunday of May. A major commercial gift event focused on premium audio, smart wellness gadgets, home comfort, and personalized gift cards.",
    },
    19: {
      es: "Festividad de la Patrona de Valencia, la 'Geperudeta', con la multitudinaria Missa de Descoberta y el emotivo Traslado de la Virgen en la Plaza de la Virgen. Inicio de la temporada alta de Primeras Comuniones y celebraciones familiares en toda España.",
      en: "Feast of the Virgen de los Desamparados, Valencia's beloved patroness, accompanied by the kickoff of communion and wedding season across Spain, driving demand for festive family gifting.",
    },
    20: {
      es: "Mayo es el mes cumbre de las Primeras Comuniones y bodas en España. Los familiares buscan regalos tecnológicos duraderos para los niños (auriculares, smartwatches, accesorios) y detalles de agradecimiento para los hogares.",
      en: "May is peak Communion and wedding season in Spain. Families search for memorable tech gifts for youth—headphones, gaming gear, smart home gadgets—and premium celebration accessories.",
    },
    25: {
      es: "La Noche de San Juan (23 al 24 de junio) es la noche más mágica del año en las playas del Mediterráneo (Malvarrosa, Grao de Castellón, Alicante). Miles de personas se congregan en la arena para encender hogueras, saltar las 7 olas a medianoche y pedir deseos. Altavoces impermeables IPX7, powerbanks y luces LED son indispensables.",
      en: "The magical Midsummer Night of San Juan (June 23-24) on Mediterranean beaches. Thousands gather around bonfires to jump midnight waves and celebrate. Rugged IPX7 waterproof speakers and powerbanks are top essentials.",
    },
    31: {
      es: "El Puente del 15 de Agosto (Asunción de la Virgen) es el fin de semana de mayor tráfico turístico del año en España. Todas las costas y pueblos celebran sus fiestas patronales. Garantizar la entrega en 24/48h directo al destino de vacaciones es la clave de ventas.",
      en: "The August 15th holiday bridge is Spain's busiest summer vacation weekend. Coastal towns celebrate patron saint festivals, requiring dependable fast dispatch directly to holiday accommodations.",
    },
    34: {
      es: "La 'Vuelta al Cole' y a la Universidad en septiembre supone la mayor renovación de material de estudio y oficina del año en España. Auriculares con cancelación activa de ruido para concentrarse, soportes de monitor, organizadores de cables y cargadores múltiples.",
      en: "The 'Back to School' and University season in September is the premier desk and study gear refresh window in Spain. Focus on ANC study headphones, ergonomic monitor stands, and multi-port charging stations.",
    },
    38: {
      es: "El 9 d'Octubre es el Día de la Comunitat Valenciana, en conmemoración de la entrada de Jaime I en 1238, y la festividad de Sant Donís (Día de los Enamorados valencianos con la tradicional 'Mocadorà' de mazapán). Jornada festiva de identidad regional y regalos especiales.",
      en: "October 9th is the National Day of the Valencian Community and Sant Donís, the Valencian Valentine's tradition featuring marzipan 'Mocadorà'. A celebrated regional holiday for family gatherings and tech treats.",
    },
    39: {
      es: "El Puente del Pilar y Fiesta Nacional de España (12 de Octubre) es uno de los puentes más esperados del otoño para escapadas culturales y turismo rural. Días de gran movimiento que premian las compras anticipadas con entrega antes del puente.",
      en: "The October 12th Hispanic Day Bridge is a major autumn holiday getaway across Spain, driving strong demand for travel accessories and rapid pre-holiday dispatch.",
    },
    45: {
      es: "El 'Viernes Negro' es la semana de mayor volumen de compras de todo el comercio electrónico en España y la Unión Europea. Ofertas récord en electrónica, audio y accesorios, sirviendo de pistoletazo de salida a las compras navideñas.",
      en: "Black Friday represents the peak commercial e-commerce week across Spain and the EU, delivering record volume for electronics, premium audio, and early Christmas shopping.",
    },
    46: {
      es: "El Macropuente de la Constitución y la Inmaculada Concepción (6 y 8 de Diciembre) paraliza el país durante 4-5 días. Marca el encendido oficial de las luces navideñas, compras de regalos y preparación de las casas para las fiestas.",
      en: "The December Constitution & Immaculate Conception Long Bridge creates a 4-5 day holiday nationwide. It sparks the official Christmas holiday decor setup, family gatherings, and gift shopping.",
    },
    49: {
      es: "Nochebuena y Navidad: días de máxima calidez hogareña y reuniones familiares. A partir del 23 de diciembre, el protagonismo pasa a los Cheques Regalo Digitales instantáneos que se envían por correo electrónico en 1 minuto para los rezagados.",
      en: "Christmas Eve & Christmas Day bring cozy family dinners. Starting December 23rd, focus shifts to Instant Digital Gift Cards delivered in 1 minute via email for last-minute shoppers.",
    },
    50: {
      es: "La gran Nochevieja con las tradicionales 12 uvas de la suerte al son de las campanadas, seguida de la última gran semana de compras para la Noche de Reyes del 5 de enero. Días decisivos con entrega urgente en 24h.",
      en: "New Year's Eve with the traditional 12 lucky grapes at midnight, followed by the final countdown to Three Kings Eve on January 5th with 24h express warehouse dispatch.",
    },
  };

  if (detailedDescriptions[event.weekNumber] && detailedDescriptions[event.weekNumber][lang]) {
    return detailedDescriptions[event.weekNumber][lang];
  }

  if (lang === "es") {
    return `${event.title.es} (${event.dateRange}) es una semana clave del calendario español y valenciano dentro del estrato "${event.layer === "festivo_puente" ? "Festivos y Puentes Nacionales" : event.layer === "fiesta_local_valencia" ? "Fiestas de la Comunidad Valenciana" : event.layer === "escolar_familia" ? "Calendario Escolar y Familiar" : "Temporada y Hogar"}". ${event.subtitle.es} Para disfrutar de cada momento con el máximo confort, Viasglobal ofrece tecnología certificada con envío urgente 24/48h desde los almacenes de Castellón y Valencia: ${event.recommendedProducts.es}`;
  } else {
    return `${event.title.en} (${event.dateRange}) is a key calendar milestone in Spain within the "${event.layer === "festivo_puente" ? "Spanish National Holidays & Bridges" : event.layer === "fiesta_local_valencia" ? "Valencian Regional Celebrations" : event.layer === "escolar_familia" ? "School & Family Calendar" : "Seasonal & Home Living"}" layer. ${event.subtitle.en} To experience every celebration with maximum comfort, Viasglobal provides verified smart gear with 24/48h express delivery from our Castellón and Valencia fulfillment hubs: ${event.recommendedProducts.en}`;
  }
}

