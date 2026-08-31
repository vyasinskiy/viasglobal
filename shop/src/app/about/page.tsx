"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { ShieldCheck, Truck, Award, ArrowRight } from "lucide-react";

/**
 * Страница «О компании» (About Us) на испанском и английском языках
 */
export default function AboutPage() {
  const { language } = useCartStore();

  const t = {
    badge: "Viasglobal E-Commerce",
    title: language === "es" ? "Sobre Viasglobal Store" : "About Viasglobal Store",
    subtitle:
      language === "es"
        ? "Suministramos electrónica de consumo de vanguardia, dispositivos para el hogar inteligente y accesorios de oficina ergonómicos directamente desde almacenes en España."
        : "We supply cutting-edge consumer tech, smart home devices, and ergonomic workspace accessories directly from our fulfillment centers in Spain.",
    missionTitle: language === "es" ? "Nuestra Filosofía y Misión" : "Our Philosophy & Mission",
    missionP1:
      language === "es"
        ? "Viasglobal Store nace con un objetivo claro: ofrecer a clientes de España y la Unión Europea productos tecnológicos certificados, de calidad contrastada, sin costes ocultos ni demoras en aduanas."
        : "Viasglobal Store was founded with a clear mission: to provide European customers with certified, high-standard smart gear without customs delays or middleman markups.",
    missionP2:
      language === "es"
        ? "Todos los productos pasan un estricto control de calidad CE y RoHS y cuentan con 2 años de garantía europea y soporte técnico directo en España."
        : "Every device complies with CE and RoHS directives and comes with a full 2-year European warranty with direct support in Spain.",
    card1Title: language === "es" ? "Logística en España" : "Spain-Based Logistics",
    card1Desc:
      language === "es"
        ? "Almacenes en Valencia y Barcelona para envíos en el mismo día y entregas en 24-48 horas."
        : "Fulfillment hubs in Valencia and Barcelona enabling same-day dispatch and 24-48h deliveries.",
    card2Title: language === "es" ? "2 Años de Garantía UE" : "2-Year EU Warranty",
    card2Desc:
      language === "es"
        ? "Garantía oficial completa con sustitución o reparación directa en la Unión Europea."
        : "Official European warranty with fast direct replacement or repair service.",
    card3Title: language === "es" ? "Operador VIES e IVA 0%" : "VIES & B2B Invoicing",
    card3Desc:
      language === "es"
        ? "Facturación transparente para autónomos y empresas con exención del 0% de IVA intracomunitario."
        : "Seamless B2B billing for companies and self-employed professionals with 0% intra-community VAT.",
    ctaTitle: language === "es" ? "¿Listo para mejorar tu setup?" : "Ready to upgrade your gear?",
    ctaDesc:
      language === "es"
        ? "Descubre nuestro catálogo y disfruta de tecnología con máxima garantía."
        : "Explore our collection and experience premium tech with full EU peace of mind.",
    ctaBtn: language === "es" ? "Ver catálogo completo" : "Explore Full Catalog",
  };

  return (
    <div style={{ padding: "50px 0 80px" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        {/* Заголовок */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase" }}>
            {t.badge}
          </div>
          <h1 style={{ fontSize: "2.6rem", marginTop: "8px", marginBottom: "16px" }}>
            {t.title}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", lineHeight: 1.6, maxWidth: "680px", margin: "0 auto" }}>
            {t.subtitle}
          </p>
        </div>

        {/* Секция миссии */}
        <div className="glass-panel" style={{ padding: "36px", borderRadius: "var(--radius-lg)", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "1.5rem", color: "#fff", marginBottom: "16px" }}>
            {t.missionTitle}
          </h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: "1rem", marginBottom: "16px" }}>
            {t.missionP1}
          </p>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.7, fontSize: "1rem" }}>
            {t.missionP2}
          </p>
        </div>

        {/* Преимущества компании */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "24px",
            marginBottom: "48px",
          }}
        >
          <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-md)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(2, 132, 199, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38bdf8", marginBottom: "16px" }}>
              <Truck size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", color: "#fff", marginBottom: "8px" }}>{t.card1Title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {t.card1Desc}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-md)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399", marginBottom: "16px" }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", color: "#fff", marginBottom: "8px" }}>{t.card2Title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {t.card2Desc}
            </p>
          </div>

          <div className="glass-panel" style={{ padding: "24px", borderRadius: "var(--radius-md)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 158, 11, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", marginBottom: "16px" }}>
              <Award size={24} />
            </div>
            <h3 style={{ fontSize: "1.15rem", color: "#fff", marginBottom: "8px" }}>{t.card3Title}</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {t.card3Desc}
            </p>
          </div>
        </div>

        {/* CTA блок */}
        <div
          className="glass-panel glass-glow"
          style={{
            padding: "36px",
            borderRadius: "var(--radius-lg)",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)",
          }}
        >
          <h2 style={{ fontSize: "1.6rem", color: "#fff", marginBottom: "12px" }}>
            {t.ctaTitle}
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: "24px" }}>
            {t.ctaDesc}
          </p>
          <Link href="/products" className="btn-primary" style={{ padding: "14px 28px" }}>
            {t.ctaBtn} <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
