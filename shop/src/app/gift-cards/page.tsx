"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";
import {
  Gift,
  CreditCard,
  Mail,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";

/**
 * Страница покупки электронных подарочных карт (Cheque Regalo Digital) в светлой теме
 * Фокус маркетинговой стратегии за 2 дня до праздников (Last-Minute Gifting)
 */
export default function GiftCardsPage() {
  const { language, addItem } = useCartStore();

  const [selectedAmount, setSelectedAmount] = useState<number>(50);
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);

  const amounts = [25, 50, 100, 150, 200];

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail.trim() || !recipientName.trim()) {
      alert(language === "es" ? "Por favor completa el nombre y email del destinatario." : "Please enter recipient name and email.");
      return;
    }

    const giftCardProduct: Product = {
      id: `giftcard-${selectedAmount}-${Date.now()}`,
      slug: `cheque-regalo-${selectedAmount}`,
      title: {
        es: `Cheque Regalo Digital Viasglobal ${selectedAmount}€`,
        en: `Viasglobal Digital Gift Card €${selectedAmount}`,
      },
      description: {
        es: `Cheque regalo electrónico por valor de ${selectedAmount}€ para ${recipientName} (${recipientEmail}). Válido para todo el catálogo sin fecha de caducidad.`,
        en: `Digital gift card worth €${selectedAmount} for ${recipientName} (${recipientEmail}). Redeemable storewide with no expiry date.`,
      },
      shortDescription: {
        es: `Tarjeta regalo digital ${selectedAmount}€ con envío instantáneo por email`,
        en: `Digital gift voucher €${selectedAmount} delivered instantly via email`,
      },
      price: selectedAmount,
      currency: "EUR",
      category: "lifestyle",
      brand: "Viasglobal Gift",
      sku: `GC-${selectedAmount}EUR`,
      mainImage: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80",
      images: ["https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80"],
      rating: 5.0,
      reviewCount: 48,
      inStock: true,
      stockCount: 999,
      specs: {
        es: {
          "Formato": "Digital (Envío por Email)",
          "Entrega": "Instantánea (1 minuto)",
          "Caducidad": "Sin fecha de caducidad",
          "Canjeable": "En todos los productos de la tienda",
        },
        en: {
          "Format": "Digital Voucher (Email delivery)",
          "Delivery": "Instant (1 minute)",
          "Expiry": "No expiration date",
          "Redeemable": "Storewide on all products",
        },
      },
      features: {
        es: [
          "Entrega digital instantánea al correo del destinatario",
          "Incluye mensaje personalizado de felicitación",
          "Válido para audio, hogar inteligente y accesorios de oficina",
          "Sin comisiones ni fecha límite de canje",
        ],
        en: [
          "Instant digital voucher sent to recipient's email",
          "Includes custom personalized greeting message",
          "Valid on audio, smart home and workspace gear",
          "Zero maintenance fees and no expiration date",
        ],
      },
    };

    addItem(giftCardProduct, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const t = {
    back: language === "es" ? "Volver a la tienda" : "Back to shop",
    badge: language === "es" ? "Regalo Inmediato • Sin Esperas" : "Instant Gift • Zero Wait",
    title: language === "es" ? "Cheque Regalo Digital Viasglobal" : "Viasglobal Digital Gift Cards",
    subtitle:
      language === "es"
        ? "¿Llegas tarde para el envío físico? Regala tecnología y confort con entrega instantánea por email en 1 minuto."
        : "Running late for physical dispatch? Give the gift of smart tech with instant digital delivery directly to their inbox.",
    selectAmount: language === "es" ? "1. Elige el importe del cheque regalo:" : "1. Select Gift Card Amount:",
    detailsTitle: language === "es" ? "2. Personaliza la tarjeta:" : "2. Personalize your Gift Card:",
    toName: language === "es" ? "Nombre del destinatario *" : "Recipient's Name *",
    toEmail: language === "es" ? "Email del destinatario *" : "Recipient's Email *",
    fromName: language === "es" ? "De parte de (tu nombre) *" : "Your Name *",
    messageLabel: language === "es" ? "Mensaje de felicitación (opcional)" : "Personal Message (optional)",
    messagePlaceholder:
      language === "es"
        ? "¡Feliz cumpleaños / felices fiestas! Disfruta eligiendo lo que más te guste."
        : "Happy holidays / Happy birthday! Enjoy choosing your favorite tech.",
    previewTitle: language === "es" ? "Vista previa del Cheque Regalo" : "Gift Voucher Preview",
    instantBadge: language === "es" ? "Envío instantáneo por email" : "Instant email delivery",
    buyBtn: language === "es" ? `Comprar Cheque Regalo (${selectedAmount}€)` : `Buy Gift Card (€${selectedAmount})`,
    addedBtn: language === "es" ? "¡Añadido al carrito!" : "Added to Cart!",
    usp1: language === "es" ? "Entrega instantánea por email en 1 minuto" : "Instant email delivery in 1 minute",
    usp2: language === "es" ? "Válido para todo el catálogo sin caducidad" : "Valid storewide with no expiration date",
    usp3: language === "es" ? "Canjeable en el checkout con un clic" : "Redeemable during checkout in 1 click",
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container">
        {/* Хлебные крошки */}
        <div style={{ marginBottom: "28px" }}>
          <Link
            href="/products"
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

        {/* Заголовок страницы */}
        <div style={{ textAlign: "center", maxWidth: "720px", margin: "0 auto 40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 14px",
              borderRadius: "var(--radius-full)",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#047857",
              fontSize: "0.82rem",
              fontWeight: 800,
              textTransform: "uppercase",
              marginBottom: "12px",
            }}
          >
            <Zap size={14} /> {t.badge}
          </div>
          <h1 style={{ fontSize: "2.5rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "12px" }}>{t.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.6 }}>
            {t.subtitle}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "40px",
            alignItems: "start",
          }}
        >
          {/* Левая колонка: Настройка и форма */}
          <form onSubmit={handleAddToCart} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Выбор суммы */}
            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "16px" }}>
                {t.selectAmount}
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "10px" }}>
                {amounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setSelectedAmount(amt)}
                    style={{
                      padding: "14px 10px",
                      borderRadius: "var(--radius-sm)",
                      background: selectedAmount === amt ? "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)" : "#f8fafc",
                      border: selectedAmount === amt ? "1px solid #0284c7" : "1px solid var(--border-color)",
                      color: selectedAmount === amt ? "#fff" : "var(--text-main)",
                      fontWeight: 800,
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: selectedAmount === amt ? "0 4px 12px rgba(2, 132, 199, 0.3)" : "none",
                    }}
                  >
                    {amt}€
                  </button>
                ))}
              </div>
            </div>

            {/* Персонализация */}
            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <h3 style={{ fontSize: "1.1rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "16px" }}>
                {t.detailsTitle}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                    {t.toName}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Laura García"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#f8fafc",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                    {t.toEmail}
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="laura@ejemplo.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "#f8fafc",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  {t.fromName}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-main)",
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "6px", fontWeight: 600 }}>
                  {t.messageLabel}
                </label>
                <textarea
                  rows={3}
                  placeholder={t.messagePlaceholder}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-main)",
                    resize: "vertical",
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "16px",
                  fontSize: "1.05rem",
                  background: added ? "linear-gradient(135deg, #059669 0%, #047857 100%)" : undefined,
                }}
              >
                {added ? (
                  <>
                    <CheckCircle2 size={20} /> {t.addedBtn}
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} /> {t.buyBtn}
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Правая колонка: Визуальное превью карты и преимущества */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h3 style={{ fontSize: "1.1rem", color: "var(--text-muted)", fontWeight: 700, marginBottom: "12px" }}>
                {t.previewTitle}
              </h3>

              {/* Визуальная карточка Cheque Regalo */}
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  borderRadius: "20px",
                  padding: "32px 28px",
                  background: "linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0f172a 100%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 14px 36px rgba(2, 132, 199, 0.3)",
                  overflow: "hidden",
                }}
              >
                {/* Фоновый логотип */}
                <div
                  style={{
                    position: "absolute",
                    right: "-20px",
                    bottom: "-30px",
                    fontSize: "10rem",
                    fontWeight: 900,
                    color: "rgba(255, 255, 255, 0.08)",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                >
                  V
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 900, fontSize: "1.2rem", color: "#fff" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "linear-gradient(135deg, #ffffff, #e0f2fe)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7", fontWeight: 900, fontSize: "0.85rem" }}>
                      V
                    </div>
                    VIAS<span style={{ color: "#7dd3fc" }}>GLOBAL</span>
                  </div>

                  <div style={{ padding: "4px 10px", borderRadius: "6px", background: "rgba(255, 255, 255, 0.18)", backdropFilter: "blur(6px)", fontSize: "0.75rem", fontWeight: 800, color: "#ffffff" }}>
                    CHEQUE REGALO DIGITAL
                  </div>
                </div>

                <div style={{ marginBottom: "28px" }}>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.8)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
                    Importe del regalo
                  </div>
                  <div style={{ fontSize: "3rem", fontWeight: 900, color: "#ffffff", lineHeight: 1.1 }}>
                    €{selectedAmount}
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.2)", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.7)" }}>Para:</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#fff" }}>
                      {recipientName || "Nombre del Destinatario"}
                    </div>
                    {senderName && (
                      <div style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.85)", marginTop: "2px" }}>
                        De parte de: {senderName}
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: "right", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.8)" }}>
                    <div>Código: VG-GIFT-••••</div>
                    <div style={{ color: "#34d399", fontWeight: 700, marginTop: "2px" }}>✓ Sin caducidad</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Блок преимуществ */}
            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "0.9rem", color: "#334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Zap size={18} color="#059669" />
                  <span>{t.usp1}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShieldCheck size={18} color="#0284c7" />
                  <span>{t.usp2}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <CheckCircle2 size={18} color="#d97706" />
                  <span>{t.usp3}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
