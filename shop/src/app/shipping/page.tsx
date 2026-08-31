"use client";

import { useCartStore } from "@/store/cartStore";
import { Truck, ShieldCheck, CreditCard, CheckCircle2 } from "lucide-react";

/**
 * Страница условий доставки, оплаты и гарантии (ES / EN)
 */
export default function ShippingPage() {
  const { language } = useCartStore();

  const t = {
    badge: language === "es" ? "Condiciones del Servicio" : "Terms & Policies",
    title: language === "es" ? "Envíos, Pagos y Garantía" : "Shipping, Payment & Warranty",
    subtitle:
      language === "es"
        ? "Condiciones transparentes y garantizadas para clientes de España y la Unión Europea."
        : "Transparent, reliable terms for customers across Spain and the European Union.",
    shippingTitle: language === "es" ? "Plazos y Gastos de Envío" : "Delivery Times & Shipping Rates",
    shippingIntro:
      language === "es"
        ? "Todos los pedidos se gestionan y expiden directamente desde nuestro centro logístico en Valencia (España)."
        : "All orders are fulfilled and dispatched directly from our logistics facility in Valencia (Spain).",
    shippingItem1:
      language === "es"
        ? "Envío gratuito: en todos los pedidos a partir de 50.00€ para España y países de la UE."
        : "Free Shipping: on all orders over €50.00 to Spain and all EU member states.",
    shippingItem2:
      language === "es"
        ? "Envío Estándar (España): 24-48 horas con Correos Express / SEUR — 4.99€ (para pedidos inferiores a 50€)."
        : "Standard Delivery (Spain): 24-48 hours via Correos Express / SEUR — €4.99 (for orders under €50).",
    shippingItem3:
      language === "es"
        ? "Envío Express (UE): 1-3 días laborables con DHL Express / UPS — 9.99€."
        : "Express Delivery (EU): 1-3 business days with DHL Express / UPS — €9.99.",
    paymentTitle: language === "es" ? "Métodos de Pago y Seguridad" : "Payment Methods & Security",
    paymentIntro:
      language === "es"
        ? "Aceptamos los principales métodos de pago electrónico seguro con protocolo 3D Secure:"
        : "We accept all major secure electronic payment methods with 3D Secure encryption:",
    pay1: language === "es" ? "💳 Tarjetas bancarias Visa, Mastercard, AMEX" : "💳 Credit & Debit Cards (Visa, Mastercard, AMEX)",
    pay2: language === "es" ? "📱 Apple Pay & Google Pay" : "📱 Apple Pay & Google Pay",
    pay3: language === "es" ? "🅿️ PayPal (Protección del Comprador)" : "🅿️ PayPal (Buyer Protection)",
    pay4: language === "es" ? "🏦 Transferencia Bancaria SEPA / Factura B2B" : "🏦 SEPA Bank Wire / B2B Invoicing",
    warrantyTitle: language === "es" ? "2 Años de Garantía y 30 Días de Devolución" : "2-Year EU Warranty & 30-Day Returns",
    warrantyIntro:
      language === "es"
        ? "Conforme a la legislación del Reino de España y las directivas de la UE de protección al consumidor:"
        : "In compliance with Spanish consumer laws and European Union customer protection directives:",
    warrantyItem1:
      language === "es"
        ? "2 años de garantía oficial: en todos los dispositivos electrónicos y accesorios."
        : "2 years official warranty: on all electronic and smart hardware products.",
    warrantyItem2:
      language === "es"
        ? "30 días para devoluciones: derecho de desistimiento con reembolso íntegro si el producto se devuelve en su estado y embalaje original."
        : "30-day money-back guarantee: full refund when returning products in their original condition and packaging.",
  };

  return (
    <div style={{ padding: "50px 0 80px" }}>
      <div className="container" style={{ maxWidth: "860px" }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
            {t.badge}
          </div>
          <h1 style={{ fontSize: "2.4rem", marginTop: "6px", marginBottom: "12px" }}>
            {t.title}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
            {t.subtitle}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Блок 1: Доставка */}
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(2, 132, 199, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8" }}>
                <Truck size={22} />
              </div>
              <h2 style={{ fontSize: "1.4rem", color: "#fff" }}>{t.shippingTitle}</h2>
            </div>

            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
              {t.shippingIntro}
            </p>

            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", color: "#e2e8f0", fontSize: "0.95rem" }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0, marginTop: "3px" }} />
                <span>{t.shippingItem1}</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0, marginTop: "3px" }} />
                <span>{t.shippingItem2}</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0, marginTop: "3px" }} />
                <span>{t.shippingItem3}</span>
              </li>
            </ul>
          </div>

          {/* Блок 2: Оплата */}
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24" }}>
                <CreditCard size={22} />
              </div>
              <h2 style={{ fontSize: "1.4rem", color: "#fff" }}>{t.paymentTitle}</h2>
            </div>

            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
              {t.paymentIntro}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", color: "#e2e8f0", fontSize: "0.9rem" }}>
              <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                {t.pay1}
              </div>
              <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                {t.pay2}
              </div>
              <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                {t.pay3}
              </div>
              <div style={{ padding: "12px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                {t.pay4}
              </div>
            </div>
          </div>

          {/* Блок 3: Гарантия и возврат */}
          <div className="glass-panel" style={{ padding: "32px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399" }}>
                <ShieldCheck size={22} />
              </div>
              <h2 style={{ fontSize: "1.4rem", color: "#fff" }}>{t.warrantyTitle}</h2>
            </div>

            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "16px" }}>
              {t.warrantyIntro}
            </p>

            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "12px", color: "#e2e8f0", fontSize: "0.95rem" }}>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0, marginTop: "3px" }} />
                <span>{t.warrantyItem1}</span>
              </li>
              <li style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0, marginTop: "3px" }} />
                <span>{t.warrantyItem2}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
