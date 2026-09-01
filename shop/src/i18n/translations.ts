/**
 * Словари переводов интерфейса интернет-магазина (Испанский - основной, Английский)
 */

export type Language = "es" | "en";

export interface Translations {
  header: {
    topBar: string;
    warrantyBadge: string;
    home: string;
    catalog: string;
    about: string;
    shipping: string;
    contact: string;
    searchPlaceholder: string;
    wishlistTitle: string;
    cartTitle: string;
  };
  hero: {
    badge: string;
    titleStart: string;
    titleGradient: string;
    subtitle: string;
    btnCatalog: string;
    btnBestsellers: string;
    dispatchBadge: string;
    warrantyBadge: string;
    ratingBadge: string;
    flagshipBadge: string;
    btnFlagship: string;
  };
  categories: {
    sectionBadge: string;
    sectionTitle: string;
    viewAll: string;
    audio: { title: string; desc: string };
    workspace: { title: string; desc: string };
    smartHome: { title: string; desc: string };
    electronics: { title: string; desc: string };
    promoBadge: string;
    promoTitle: string;
    promoDesc: string;
    promoBtn: string;
  };
  productCard: {
    bestseller: string;
    new: string;
    discount: string;
    inStock: string;
    outOfStock: string;
    addToCart: string;
    added: string;
    viewDetails: string;
    vatIncluded: string;
  };
  productDetail: {
    catalogBack: string;
    sku: string;
    reviews: string;
    inStockCount: string;
    outOfStock: string;
    savings: string;
    vatNote: string;
    featuresTitle: string;
    specsTitle: string;
    reviewsTitle: string;
    noReviews: string;
    verifiedPurchase: string;
    relatedTitle: string;
    dispatchBadge: string;
    warrantyBadge: string;
    returnsBadge: string;
    shareCopied: string;
  };
  cart: {
    drawerTitle: string;
    emptyTitle: string;
    emptyDesc: string;
    goToCatalog: string;
    freeShippingUnlocked: string;
    freeShippingRemaining: string;
    couponPlaceholder: string;
    applyCoupon: string;
    subtotal: string;
    discount: string;
    shipping: string;
    taxIncluded: string;
    total: string;
    checkoutBtn: string;
    fullCartLink: string;
    clearCart: string;
    continueShopping: string;
  };
  checkout: {
    backToCart: string;
    title: string;
    step1Title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    b2bTitle: string;
    companyName: string;
    vatNumber: string;
    step2Title: string;
    country: string;
    address: string;
    city: string;
    postalCode: string;
    step3Title: string;
    step4Title: string;
    card: string;
    cardNumber: string;
    cardExpiry: string;
    cardCvc: string;
    orderSummaryTitle: string;
    itemsCount: string;
    termsAgreement: string;
    termsLink: string;
    privacyLink: string;
    payBtn: string;
    processing: string;
    sslSecure: string;
  };
  success: {
    badge: string;
    title: string;
    message: string;
    timelineTitle: string;
    paid: string;
    packing: string;
    dispatch: string;
    delivery: string;
    recipient: string;
    address: string;
    totalPaid: string;
    continueShopping: string;
    printReceipt: string;
  };
  footer: {
    usp1Title: string;
    usp1Desc: string;
    usp2Title: string;
    usp2Desc: string;
    usp3Title: string;
    usp3Desc: string;
    usp4Title: string;
    usp4Desc: string;
    brandDesc: string;
    viesBadge: string;
    catTitle: string;
    customerTitle: string;
    legalTitle: string;
    allRightsReserved: string;
    operatorInfo: string;
    securePayment: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  es: {
    header: {
      topBar: "Envío gratis en la UE a partir de 50€ | 10% de descuento con código: VIAS10",
      warrantyBadge: "Calidad Certificada CE y RoHS",
      home: "Inicio",
      catalog: "Catálogo",
      about: "Nosotros",
      shipping: "Envíos y Garantía",
      contact: "Contacto",
      searchPlaceholder: "Buscar productos...",
      wishlistTitle: "Favoritos",
      cartTitle: "Carrito",
    },
    hero: {
      badge: "Electrónica y ergonomía premium en España y la UE",
      titleStart: "Tecnología para vivir,",
      titleGradient: "trabajar y disfrutar",
      subtitle:
        "Tienda oficial de dispositivos inteligentes para el hogar, accesorios ergonómicos y sonido Hi-Res con envío en 24-48 horas y garantía europea.",
      btnCatalog: "Ver Catálogo",
      btnBestsellers: "Más Vendidos",
      dispatchBadge: "Envío en 24h",
      warrantyBadge: "Calidad Certificada",
      ratingBadge: "4.9/5 en valoraciones",
      flagshipBadge: "Destacado de la Temporada",
      btnFlagship: "Descubrir producto",
    },
    categories: {
      sectionBadge: "Gamas destacadas",
      sectionTitle: "Categorías de productos",
      viewAll: "Ver todas",
      audio: {
        title: "Audio y Hi-Res",
        desc: "Auriculares inalámbricos y cancelación de ruido",
      },
      workspace: {
        title: "Espacio de Trabajo",
        desc: "Teclados ergonómicos e iluminación inteligente",
      },
      smartHome: {
        title: "Hogar Inteligente",
        desc: "Sensores de calidad del aire y protocolo Matter",
      },
      electronics: {
        title: "Cargadores GaN",
        desc: "Estaciones de carga ultrarrápidas hasta 100W",
      },
      promoBadge: "Oferta especial de bienvenida",
      promoTitle: "10% de descuento en tu primer pedido con VIAS10",
      promoDesc: "Introduce el código promocional en el carrito para compras superiores a 30€.",
      promoBtn: "Aprovechar oferta",
    },
    productCard: {
      bestseller: "Top Ventas",
      new: "Novedad",
      discount: "Oferta",
      inStock: "En stock",
      outOfStock: "Agotado",
      addToCart: "Añadir",
      added: "¡Añadido!",
      viewDetails: "Ver detalles",
      vatIncluded: "IVA 21% incluido",
    },
    productDetail: {
      catalogBack: "Catálogo",
      sku: "Ref",
      reviews: "opiniones",
      inStockCount: "En stock en almacén de Valencia",
      outOfStock: "Bajo pedido",
      savings: "Ahorras",
      vatNote: "Precio con IVA 21% incluido. Envío gratis en la UE desde 50€.",
      featuresTitle: "Características principales:",
      specsTitle: "Especificaciones técnicas",
      reviewsTitle: "Opiniones de clientes",
      noReviews: "Aún no hay opiniones. ¡Sé el primero en valorar este producto!",
      verifiedPurchase: "Compra verificada",
      relatedTitle: "Productos relacionados",
      dispatchBadge: "Envío en 24h desde Valencia",
      warrantyBadge: "Calidad Certificada",
      returnsBadge: "30 días para devoluciones",
      shareCopied: "¡Enlace copiado!",
    },
    cart: {
      drawerTitle: "Tu carrito",
      emptyTitle: "Tu carrito está vacío",
      emptyDesc: "Descubre nuestro catálogo de dispositivos y accesorios con garantía europea.",
      goToCatalog: "Ir a la tienda",
      freeShippingUnlocked: "¡Has conseguido envío gratis en la UE!",
      freeShippingRemaining: "Añade",
      couponPlaceholder: "CÓDIGO (VIAS10)",
      applyCoupon: "Aplicar",
      subtotal: "Subtotal:",
      discount: "Descuento:",
      shipping: "Envío:",
      taxIncluded: "Incluye IVA 21%:",
      total: "Total a pagar:",
      checkoutBtn: "Tramitar Pedido",
      fullCartLink: "Ver carrito completo",
      clearCart: "Vaciar carrito",
      continueShopping: "Continuar comprando",
    },
    checkout: {
      backToCart: "Volver al carrito",
      title: "Tramitación del Pedido",
      step1Title: "Datos de contacto",
      firstName: "Nombre *",
      lastName: "Apellidos *",
      email: "Correo electrónico *",
      phone: "Teléfono de contacto *",
      b2bTitle: "Empresas y Autónomos (Factura con IVA / VIES 0%)",
      companyName: "Razón Social",
      vatNumber: "NIF / CIF / VAT Number",
      step2Title: "Dirección de envío",
      country: "País de destino *",
      address: "Dirección (Calle, número, piso) *",
      city: "Ciudad / Población *",
      postalCode: "Código Postal *",
      step3Title: "Método de envío",
      step4Title: "Método de pago",
      card: "Tarjeta bancaria",
      cardNumber: "Número de tarjeta",
      cardExpiry: "Caducidad",
      cardCvc: "CVC",
      orderSummaryTitle: "Resumen del pedido",
      itemsCount: "artículos",
      termsAgreement: "Acepto las",
      termsLink: "Condiciones de Venta",
      privacyLink: "Política de Privacidad (RGPD)",
      payBtn: "Pagar ahora",
      processing: "Procesando pago seguro...",
      sslSecure: "Pago cifrado con seguridad SSL 256-bit",
    },
    success: {
      badge: "Pedido completado con éxito",
      title: "¡Gracias por tu compra!",
      message: "El número de tu pedido es",
      timelineTitle: "Estado del pedido",
      paid: "Pagado",
      packing: "Preparación",
      dispatch: "En tránsito",
      delivery: "Entrega (24-48h)",
      recipient: "Destinatario:",
      address: "Dirección de entrega:",
      totalPaid: "Importe pagado:",
      continueShopping: "Seguir comprando",
      printReceipt: "Imprimir justificante",
    },
    footer: {
      usp1Title: "Envío Express en la UE",
      usp1Desc: "Salida en 24-48h desde almacenes en Valencia y Barcelona. Gratis desde 50€.",
      usp2Title: "Calidad Certificada CE y RoHS",
      usp2Desc: "Productos con marcado CE y RoHS y soporte directo en España.",
      usp3Title: "30 Días de Devolución",
      usp3Desc: "Devoluciones sencillas y sin complicaciones si no quedas satisfecho.",
      usp4Title: "Atención al Cliente",
      usp4Desc: "Asistencia rápida para pedidos particulares y compras al por mayor B2B.",
      brandDesc: "Comercio digital premium, dispositivos para el hogar y accesorios de oficina en España y la Unión Europea.",
      viesBadge: "Operador VIES Intracomunitario 0% IVA",
      catTitle: "Categorías",
      customerTitle: "Atención al Cliente",
      legalTitle: "Información Legal",
      allRightsReserved: "Todos los derechos reservados. Operador:",
      operatorInfo: "Vitalii Iasinskii (Autónomo) • NIF: ESZ1154366R • Valencia, España",
      securePayment: "Pago 100% Seguro: Visa, MasterCard, Apple Pay, PayPal, SEPA",
    },
  },
  en: {
    header: {
      topBar: "Free EU Shipping on orders over €50 | 10% OFF code: VIAS10",
      warrantyBadge: "CE & RoHS Certified Quality",
      home: "Home",
      catalog: "Shop",
      about: "About",
      shipping: "Shipping & Warranty",
      contact: "Contact",
      searchPlaceholder: "Search products...",
      wishlistTitle: "Wishlist",
      cartTitle: "Cart",
    },
    hero: {
      badge: "Premium Electronics & Workspace Ergonomics in Spain & EU",
      titleStart: "Technology designed for",
      titleGradient: "life, work and comfort",
      subtitle:
        "Official store for smart home gear, ergonomic desk setups, and Hi-Res audio with fast 24-48h dispatch from Spain and full EU warranty.",
      btnCatalog: "Explore Catalog",
      btnBestsellers: "Bestsellers",
      dispatchBadge: "24h Dispatch",
      warrantyBadge: "Certified Quality",
      ratingBadge: "4.9/5 Rating",
      flagshipBadge: "Season Flagship",
      btnFlagship: "View Flagship",
    },
    categories: {
      sectionBadge: "Top Collections",
      sectionTitle: "Product Categories",
      viewAll: "View all",
      audio: {
        title: "Audio & Hi-Res",
        desc: "Wireless headphones & active noise cancelling",
      },
      workspace: {
        title: "Workspace Gear",
        desc: "Ergonomic keyboards & smart ambient lighting",
      },
      smartHome: {
        title: "Smart Home",
        desc: "Air quality monitors & Matter protocol sensors",
      },
      electronics: {
        title: "GaN Fast Chargers",
        desc: "Ultra-compact power stations up to 100W",
      },
      promoBadge: "Welcome Offer",
      promoTitle: "10% OFF your first order with code VIAS10",
      promoDesc: "Apply code at checkout on all orders over €30.",
      promoBtn: "Get Discount",
    },
    productCard: {
      bestseller: "Bestseller",
      new: "New",
      discount: "Sale",
      inStock: "In Stock",
      outOfStock: "Out of Stock",
      addToCart: "Add to Cart",
      added: "Added!",
      viewDetails: "View Details",
      vatIncluded: "incl. 21% VAT",
    },
    productDetail: {
      catalogBack: "Shop Catalog",
      sku: "SKU",
      reviews: "reviews",
      inStockCount: "In stock at Valencia fulfillment hub",
      outOfStock: "Backorder",
      savings: "Save",
      vatNote: "Price includes 21% VAT. Free EU shipping from €50.",
      featuresTitle: "Key Features:",
      specsTitle: "Technical Specifications",
      reviewsTitle: "Customer Reviews",
      noReviews: "No reviews yet. Be the first to review this product!",
      verifiedPurchase: "Verified Purchase",
      relatedTitle: "Related Products",
      dispatchBadge: "24h Dispatch from Valencia",
      warrantyBadge: "Certified Quality",
      returnsBadge: "30-Day Return Period",
      shareCopied: "Link copied!",
    },
    cart: {
      drawerTitle: "Your Cart",
      emptyTitle: "Your cart is empty",
      emptyDesc: "Explore our collection of premium gear with full European warranty.",
      goToCatalog: "Start Shopping",
      freeShippingUnlocked: "You unlocked Free EU Shipping!",
      freeShippingRemaining: "Add",
      couponPlaceholder: "COUPON (VIAS10)",
      applyCoupon: "Apply",
      subtotal: "Subtotal:",
      discount: "Discount:",
      shipping: "Shipping:",
      taxIncluded: "Incl. 21% VAT:",
      total: "Total:",
      checkoutBtn: "Proceed to Checkout",
      fullCartLink: "View Full Cart",
      clearCart: "Clear Cart",
      continueShopping: "Continue Shopping",
    },
    checkout: {
      backToCart: "Back to Cart",
      title: "Checkout",
      step1Title: "Contact Information",
      firstName: "First Name *",
      lastName: "Last Name *",
      email: "Email Address *",
      phone: "Phone Number *",
      b2bTitle: "Companies & Autónomo (VIES 0% VAT Invoice)",
      companyName: "Company Name",
      vatNumber: "NIF / CIF / VAT Number",
      step2Title: "Shipping Address",
      country: "Destination Country *",
      address: "Street Address *",
      city: "City *",
      postalCode: "Postal Code *",
      step3Title: "Shipping Method",
      step4Title: "Payment Method",
      card: "Credit / Debit Card",
      cardNumber: "Card Number",
      cardExpiry: "Expiry Date",
      cardCvc: "CVC",
      orderSummaryTitle: "Order Summary",
      itemsCount: "items",
      termsAgreement: "I agree to the",
      termsLink: "Terms of Sale",
      privacyLink: "Privacy Policy (GDPR)",
      payBtn: "Pay Now",
      processing: "Processing payment...",
      sslSecure: "256-bit SSL Secure Checkout",
    },
    success: {
      badge: "Order Completed Successfully",
      title: "Thank you for your order!",
      message: "Your order confirmation number is",
      timelineTitle: "Fulfillment Timeline",
      paid: "Payment Confirmed",
      packing: "Fulfillment Hub",
      dispatch: "In Transit",
      delivery: "Delivery (24-48h)",
      recipient: "Customer:",
      address: "Shipping Address:",
      totalPaid: "Amount Paid:",
      continueShopping: "Continue Shopping",
      printReceipt: "Print Receipt",
    },
    footer: {
      usp1Title: "Express EU Delivery",
      usp1Desc: "Dispatched within 24-48h from Valencia & Barcelona hubs. Free over €50.",
      usp2Title: "CE & RoHS Certified Quality",
      usp2Desc: "CE & RoHS compliant products with direct replacement in Spain.",
      usp3Title: "30-Day Money Back",
      usp3Desc: "Hassle-free returns within 30 days if not completely satisfied.",
      usp4Title: "Customer Support",
      usp4Desc: "Prompt assistance for retail buyers and B2B wholesale partners.",
      brandDesc: "Premium digital commerce, smart home tech, and ergonomic workspace gear in Spain and the European Union.",
      viesBadge: "VIES Intra-Community 0% VAT Registered",
      catTitle: "Categories",
      customerTitle: "Customer Care",
      legalTitle: "Legal & Compliance",
      allRightsReserved: "All rights reserved. Operator:",
      operatorInfo: "Vitalii Iasinskii (Autónomo) • NIF: ESZ1154366R • Valencia, Spain",
      securePayment: "100% Secure Payment: Visa, MasterCard, Apple Pay, PayPal, SEPA",
    },
  },
};
