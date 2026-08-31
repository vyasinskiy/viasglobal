import { Product, ShippingMethod, Coupon } from "@/types";

/**
 * Каталог товаров интернет-магазина Viasglobal Shop с поддержкой испанского (основной) и английского языков
 */
export const PRODUCTS_DATA: Product[] = [
  {
    id: "prod-1",
    slug: "vias-aura-noise-cancelling-headphones",
    title: {
      es: "Vias Aura Pro Auriculares Inalámbricos ANC",
      en: "Vias Aura Pro Wireless ANC Headphones",
    },
    description: {
      es: "Auriculares inalámbricos de alta fidelidad con cancelación activa de ruido adaptativa de última generación, soporte Hi-Res Audio, LDAC y sonido espacial 360°. Hasta 45 horas de autonomía con carga rápida USB-C.",
      en: "Flagship wireless headphones with next-gen adaptive active noise cancellation, Hi-Res Audio certification, LDAC codec, and 360° spatial audio. Up to 45 hours battery life with fast USB-C charging.",
    },
    shortDescription: {
      es: "Auriculares inalámbricos con ANC adaptativo, Hi-Res Audio y 45h de batería",
      en: "Wireless headphones with adaptive ANC, Hi-Res Audio, and 45h battery life",
    },
    price: 249.99,
    originalPrice: 299.99,
    currency: "EUR",
    category: "audio",
    brand: "Vias Acoustics",
    sku: "VA-ANC-01-BLK",
    ean: "8437021980012",
    mainImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
    ],
    rating: 4.9,
    reviewCount: 128,
    inStock: true,
    stockCount: 42,
    isBestseller: true,
    isFeatured: true,
    specs: {
      es: {
        "Conectividad": "Bluetooth 5.3 + Jack 3.5mm AUX",
        "Autonomía": "Hasta 45h (ANC activado), 65h (ANC apagado)",
        "Cancelación de Ruido": "Cancelación Híbrida Adaptativa (-42dB)",
        "Códecs compatibles": "LDAC, AAC, SBC, aptX HD",
        "Peso": "250 g",
        "Garantía": "2 años oficial UE",
      },
      en: {
        "Connectivity": "Bluetooth 5.3 + 3.5mm AUX Jack",
        "Battery Life": "Up to 45h (ANC On), 65h (ANC Off)",
        "Noise Cancellation": "Hybrid Adaptive ANC (-42dB)",
        "Audio Codecs": "LDAC, AAC, SBC, aptX HD",
        "Weight": "250 g",
        "Warranty": "2 Years Official EU",
      },
    },
    features: {
      es: [
        "Cancelación activa híbrida adaptativa con 4 micrófonos dedicados",
        "Certificación Hi-Res Audio Wireless con códec de alta resolución LDAC",
        "Almohadillas viscoelásticas con memoria de forma y piel sintética transpirable",
        "Conexión multipunto simultánea para alternar entre móvil y ordenador",
        "Carga rápida: 10 minutos proporcionan 5 horas de reproducción",
      ],
      en: [
        "Adaptive hybrid active noise cancellation with 4 external microphones",
        "Hi-Res Audio Wireless certified with LDAC codec support",
        "Memory foam ear cushions wrapped in breathable eco-leather",
        "Multipoint dual device connection for laptop and smartphone",
        "Fast USB-C charging: 10 minutes gives 5 hours of playback",
      ],
    },
    reviews: [
      {
        id: "rev-1",
        author: "Marco Rossi",
        rating: 5,
        date: "2026-02-14",
        comment: {
          es: "¡Sonido espectacular y una cancelación de ruido increíble! En el avión y transporte público aíslan de maravilla.",
          en: "Incredible sound and top-notch ANC! Perfect for flights and working in noisy environments.",
        },
        verifiedPurchase: true,
      },
      {
        id: "rev-2",
        author: "Elena García",
        rating: 5,
        date: "2026-01-28",
        comment: {
          es: "Muy cómodos, no molestan ni aprietan después de 8 horas continuas de teletrabajo.",
          en: "Extremely comfortable, no ear fatigue even after 8 hours of continuous work.",
        },
        verifiedPurchase: true,
      },
    ],
  },
  {
    id: "prod-2",
    slug: "vias-smart-desk-lamp-pro",
    title: {
      es: "Vias Lumina Lámpara de Escritorio Ergonómica Smart",
      en: "Vias Lumina Smart Ergonomic Desk Lamp",
    },
    description: {
      es: "Lámpara de sobremesa inteligente con sensor de luminosidad automático, base de carga inalámbrica rápida Qi 15W y temperatura de color regulable (2700K - 6500K). Índice de reproducción cromática profesional CRI > 95.",
      en: "Smart ergonomic desk lamp featuring ambient light sensor, built-in 15W Qi wireless charger, and adjustable color temperature (2700K - 6500K). Professional color rendering index CRI > 95.",
    },
    shortDescription: {
      es: "Lámpara inteligente con sensor ambiental, CRI>95 y carga Qi 15W",
      en: "Smart desk lamp with auto-brightness sensor, CRI>95 and 15W Qi charging",
    },
    price: 89.0,
    originalPrice: 119.0,
    currency: "EUR",
    category: "workspace",
    brand: "Vias Workspace",
    sku: "VW-LUM-02-SLV",
    ean: "8437021980029",
    mainImage: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80",
    ],
    rating: 4.8,
    reviewCount: 94,
    inStock: true,
    stockCount: 18,
    isBestseller: false,
    isFeatured: true,
    specs: {
      es: {
        "Temperatura de color": "2700K - 6500K (ajuste continuo)",
        "Índice de reproducción cromática": "CRI Ra ≥ 95",
        "Carga inalámbrica": "Qi Fast Charge 15W",
        "Control": "Panel táctil + Sensor de luz ambiental",
        "Material": "Aluminio anodizado aeroespacial",
        "Garantía": "2 años oficial UE",
      },
      en: {
        "Color Temperature": "2700K - 6500K (smooth dimming)",
        "Color Rendering Index": "CRI Ra ≥ 95",
        "Wireless Charger": "Qi Fast Charge 15W",
        "Controls": "Touch panel + Ambient auto-dimming sensor",
        "Material": "Aerospace-grade anodized aluminum",
        "Warranty": "2 Years Official EU",
      },
    },
    features: {
      es: [
        "Protección ocular sin parpadeo (Certificación TÜV Rheinland)",
        "Base integrada con carga rápida Qi para smartphones y auriculares",
        "Brazo articulado de doble eje con rotación de 180°",
        "Ajuste automático inteligente según la luz natural del día",
      ],
      en: [
        "Eye-comfort flicker-free lighting (TÜV Rheinland Certified)",
        "Integrated fast wireless Qi charging pad in the base",
        "Dual-axis articulated arm with 180° flexibility",
        "Automatic light level adjustment based on room brightness",
      ],
    },
  },
  {
    id: "prod-3",
    slug: "vias-smart-climate-sensor-hub",
    title: {
      es: "Vias Sense Monitor de Calidad del Aire y Hub Climático",
      en: "Vias Sense Smart Climate Hub & Air Monitor",
    },
    description: {
      es: "Sensor integral para la calidad del aire y clima interior. Mide CO2, partículas PM2.5, temperatura, humedad y compuestos orgánicos volátiles (VOC). Compatible con Apple HomeKit, Google Home y Home Assistant mediante protocolo Matter over Thread.",
      en: "Comprehensive indoor air quality and climate monitor. Measures CO2, PM2.5 particles, temperature, humidity, and VOC levels. Integrates with Apple HomeKit, Google Home, and Home Assistant via Matter over Thread.",
    },
    shortDescription: {
      es: "Monitor de CO2, PM2.5, humedad y temperatura compatible con Matter",
      en: "Air quality monitor tracking CO2, PM2.5, humidity and Matter protocol",
    },
    price: 129.5,
    originalPrice: 149.0,
    currency: "EUR",
    category: "smart-home",
    brand: "Vias IoT",
    sku: "VIOT-SNS-03-WHT",
    ean: "8437021980036",
    mainImage: "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
    ],
    rating: 4.7,
    reviewCount: 76,
    inStock: true,
    stockCount: 29,
    isNew: true,
    isFeatured: true,
    specs: {
      es: {
        "Protocolos": "Matter, Thread, Wi-Fi 2.4GHz, Bluetooth 5.0",
        "Sensores": "CO2 (Láser óptico NDIR), PM2.5, Temperatura, Humedad, VOC",
        "Pantalla": "E-Ink de ultra bajo consumo de 3.2 pulgadas",
        "Alimentación": "USB-C + Batería de respaldo (hasta 10h)",
        "Garantía": "2 años oficial UE",
      },
      en: {
        "Protocols": "Matter, Thread, Wi-Fi 2.4GHz, Bluetooth 5.0",
        "Sensors": "CO2 (NDIR Laser), PM2.5, Temperature, Humidity, VOC",
        "Display": "3.2-inch ultra-low power E-Ink screen",
        "Power": "USB-C + built-in battery backup (up to 10h)",
        "Warranty": "2 Years Official EU",
      },
    },
    features: {
      es: [
        "Estándar universal Matter para integración directa sin pasarelas adicionales",
        "Sensor óptico NDIR de alta precisión para niveles de dióxido de carbono",
        "Pantalla E-Ink nítida legible desde cualquier ángulo",
        "Alertas instantáneas al smartphone ante picos de contaminación interior",
      ],
      en: [
        "Universal Matter standard for seamless smart home ecosystem pairing",
        "High-accuracy optical NDIR sensor for carbon dioxide levels",
        "Glare-free crisp E-Ink display visible from all angles",
        "Instant push notifications when air quality thresholds are exceeded",
      ],
    },
  },
  {
    id: "prod-4",
    slug: "vias-ergonomic-split-keyboard",
    title: {
      es: "Vias ErgoType Teclado Mecánico Dividido Ergonómico",
      en: "Vias ErgoType Split Mechanical Keyboard",
    },
    description: {
      es: "Teclado mecánico ergonómico dividido con switches lineales silenciosos hot-swap, chasis de aluminio, soporte para perfiles Bluetooth y 2.4GHz para hasta 3 dispositivos simultáneos.",
      en: "Split ergonomic mechanical keyboard with silent hot-swappable switches, aluminum body, and multi-device connection for up to 3 devices via Bluetooth & 2.4GHz wireless.",
    },
    shortDescription: {
      es: "Teclado ergonómico dividido inalámbrico con switches hot-swap",
      en: "Split wireless ergonomic keyboard with silent hot-swap switches",
    },
    price: 179.99,
    originalPrice: 219.99,
    currency: "EUR",
    category: "workspace",
    brand: "Vias Workspace",
    sku: "VW-KB-04-GRY",
    ean: "8437021980043",
    mainImage: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800&auto=format&fit=crop&q=80",
    ],
    rating: 4.9,
    reviewCount: 63,
    inStock: true,
    stockCount: 15,
    isBestseller: true,
    specs: {
      es: {
        "Interruptores": "Silent Linear Hot-swap (compatibles con 5 pines)",
        "Conectividad": "Bluetooth 5.2 (3 dispositivos) + 2.4GHz + USB-C",
        "Iluminación": "LED blanca cálida con 12 patrones",
        "Batería": "4000 mAh (hasta 3 meses sin retroiluminación)",
        "Sistemas": "macOS, Windows, Linux, iOS, Android",
        "Garantía": "2 años oficial UE",
      },
      en: {
        "Switch Type": "Custom Silent Linear (5-pin Hot-swappable)",
        "Connectivity": "Bluetooth 5.2 (3 profiles) + 2.4GHz + USB-C",
        "Backlight": "Warm white LED with 12 lighting modes",
        "Battery": "4000 mAh (up to 3 months without backlight)",
        "OS Compatibility": "macOS, Windows, Linux, iOS, Android",
        "Warranty": "2 Years Official EU",
      },
    },
    features: {
      es: [
        "Diseño partido anatómico para mantener una postura natural de muñecas",
        "Reposamuñecas magnéticos de madera de roble natural",
        "Totalmente programable vía configurador web sin software pesado",
        "Capas de amortiguación de silicona y espuma Poron para pulsación silenciosa",
      ],
      en: [
        "Split ergonomic layout reducing shoulder and wrist strain",
        "Detachable magnetic wrist rests made from solid natural oak",
        "Fully customizable keys and macros via web-based configurator",
        "Multi-layer acoustic dampening for ultra-quiet office typing",
      ],
    },
  },
  {
    id: "prod-5",
    slug: "vias-ultrasonic-glass-diffuser",
    title: {
      es: "Vias PureMist Difusor Ultrasónico de Cristal y Madera",
      en: "Vias PureMist Ultrasonic Glass & Wood Aroma Diffuser",
    },
    description: {
      es: "Difusor de aromas ultrasónico premium fabricado en vidrio soplado mate y madera de roble. Humidificación silenciosa por niebla fría, modo de iluminación ambiente tipo vela y apagado automático de seguridad.",
      en: "Premium ultrasonic aroma diffuser crafted from frosted blown glass and solid natural oak. Silent cold mist humidification, warm amber glow ambient light mode, and auto safety shut-off.",
    },
    shortDescription: {
      es: "Difusor aromático de cristal mate y roble con luz cálida",
      en: "Aroma diffuser with frosted glass, oak wood, and ambient warm light",
    },
    price: 54.9,
    currency: "EUR",
    category: "lifestyle",
    brand: "Vias Living",
    sku: "VL-DIF-05-OAK",
    ean: "8437021980050",
    mainImage: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1546554137-f86b9593a222?w=800&auto=format&fit=crop&q=80",
    ],
    rating: 4.8,
    reviewCount: 88,
    inStock: true,
    stockCount: 35,
    isNew: false,
    specs: {
      es: {
        "Capacidad del depósito": "280 ml (hasta 10 horas continuas)",
        "Área de cobertura": "Hasta 35 m²",
        "Nivel sonoro": "< 20 dB (completamente silencioso)",
        "Materiales": "Vidrio soplado mate, madera de roble, polímero libre de BPA",
        "Garantía": "2 años oficial UE",
      },
      en: {
        "Tank Capacity": "280 ml (up to 10 hours continuous mist)",
        "Coverage Area": "Up to 35 m²",
        "Noise Level": "< 20 dB (whisper quiet)",
        "Materials": "Frosted blown glass, solid oak, BPA-free polymer",
        "Warranty": "2 Years Official EU",
      },
    },
    features: {
      es: [
        "Vibración ultrasónica de 2.4 MHz para preservar las propiedades de aceites esenciales",
        "Luz ambiental ámbar con efecto suave de respiración",
        "Desconexión automática inteligente al agotarse el agua",
        "Elegante diseño escandinavo apto para cualquier estancia",
      ],
      en: [
        "2.4 MHz ultrasonic vibration preserves pure essential oil integrity",
        "Warm amber ambient glow with gentle breathing mode",
        "Automatic safety shut-off when reservoir is empty",
        "Minimalist Nordic design complements modern living spaces",
      ],
    },
  },
  {
    id: "prod-6",
    slug: "vias-compact-gan-fast-charger-100w",
    title: {
      es: "Vias HyperPower Cargador Rápido 100W GaN III 4 Puertos",
      en: "Vias HyperPower 100W 4-Port GaN III Fast Charger",
    },
    description: {
      es: "Cargador de pared ultracompacto con tecnología de nitruro de galio (GaN III). Equipado con 3 puertos USB-C Power Delivery 3.0 y 1 puerto USB-A. Capaz de cargar simultáneamente un portátil MacBook Pro, tablet y smartphone a máxima velocidad.",
      en: "Ultra-compact wall charger powered by Gallium Nitride (GaN III) technology. Features 3 USB-C Power Delivery 3.0 ports and 1 USB-A port, capable of charging a laptop, tablet, and phone simultaneously at full speed.",
    },
    shortDescription: {
      es: "Estación de carga GaN III 100W con 4 puertos y clavija europea",
      en: "Compact 100W GaN III 4-port fast charger with EU plug",
    },
    price: 69.99,
    originalPrice: 79.99,
    currency: "EUR",
    category: "electronics",
    brand: "Vias Power",
    sku: "VP-GAN-06-100W",
    ean: "8437021980067",
    mainImage: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
    ],
    rating: 4.95,
    reviewCount: 215,
    inStock: true,
    stockCount: 60,
    isBestseller: true,
    isFeatured: true,
    specs: {
      es: {
        "Potencia total": "100W Max",
        "Puertos": "3 x USB-C (PD 3.0 / PPS), 1 x USB-A (QC 4.0+)",
        "Tecnología": "GaN III (Gallium Nitride)",
        "Protección": "Monitoreo térmico activo ActiveShield 2.0",
        "Garantía": "2 años oficial UE",
      },
      en: {
        "Max Output": "100W Max",
        "Ports": "3 x USB-C (PD 3.0 / PPS), 1 x USB-A (QC 4.0+)",
        "Technology": "GaN III (Gallium Nitride)",
        "Safety": "ActiveShield 2.0 temperature monitoring",
        "Warranty": "2 Years Official EU",
      },
    },
    features: {
      es: [
        "Un 45% más compacto que los adaptadores convencionales de 96W",
        "Compatibilidad total con protocolos PD 3.0, PPS, QC 4+, AFC, FCP",
        "Voltaje universal 100-240V ideal para viajes por el mundo",
        "Clavija estándar europea Tipo C / F (Schuko)",
      ],
      en: [
        "45% smaller than traditional 96W laptop adapters",
        "Supports PD 3.0, PPS, QC 4+, AFC, and FCP fast charging protocols",
        "100-240V worldwide voltage support for travel",
        "Standard European Type C / F (Schuko) plug",
      ],
    },
  },
];

/**
 * Категории товаров для фильтрации с переводами
 */
export const CATEGORIES_CONFIG = [
  { id: "all", label: { es: "Todos los productos", en: "All Products" }, count: 6 },
  { id: "audio", label: { es: "Audio y Auriculares", en: "Audio & Headphones" }, count: 1 },
  { id: "workspace", label: { es: "Espacio de Trabajo", en: "Workspace & Desk" }, count: 2 },
  { id: "smart-home", label: { es: "Hogar Inteligente", en: "Smart Home & IoT" }, count: 1 },
  { id: "electronics", label: { es: "Cargadores GaN", en: "GaN Fast Chargers" }, count: 1 },
  { id: "lifestyle", label: { es: "Bienestar y Hogar", en: "Lifestyle & Living" }, count: 1 },
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
      es: "Entrega a domicilio en España y la UE",
      en: "Door-to-door delivery across Spain and EU",
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
