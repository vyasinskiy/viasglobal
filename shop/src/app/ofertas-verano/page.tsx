"use client";

import Link from "next/link";
import { PRODUCTS_DATA } from "@/data/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { Sun, Truck, ArrowRight, ArrowLeft, Calendar } from "lucide-react";

/**
 * Постоянный SEO-лендинг для летних предложений и фестивалей (Ofertas Verano España) в светлой теме
 */
export default function OfertasVeranoPage() {
  const { language } = useCartStore();

  const summerProducts = PRODUCTS_DATA.filter(
    (p) => p.category === "lifestyle" || p.category === "audio" || p.category === "electronics"
  );

  const t = {
    badge: language === "es" ? "Especial Temporada de Verano" : "Summer Season Deals",
    title: language === "es" ? "Ofertas de Verano: Playa, Música y Climatización" : "Summer Tech: Beach, Audio & Cooling Gear",
    subtitle:
      language === "es"
        ? "Prepárate para la playa, los festivales de música y las olas de calor. Altavoces resistentes al agua, ventilación y cargadores solares con entrega 24/48h."
        : "Gear up for the beach, music festivals, and heatwaves. Waterproof speakers, portable fans, and power banks from Spain.",
    guarantee: language === "es" ? "Envío urgente en 24h desde Castellón y Valencia directo a tu destino vacacional." : "24h express dispatch to your holiday destination in Spain & EU.",
    back: language === "es" ? "Volver al catálogo" : "Back to catalog",
    allCampaigns: language === "es" ? "Ver Calendario Anual de 52 Semanas" : "View 52-Week Marketing Calendar",
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container">
        {/* Хлебные крошки */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
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

          <Link
            href="/campaigns"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#b45309",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            <Calendar size={15} /> {t.allCampaigns} <ArrowRight size={14} />
          </Link>
        </div>

        {/* Заголовок лендинга */}
        <div
          style={{
            padding: "36px",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)",
            border: "1px solid #fde68a",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#b45309", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
            <Sun size={16} /> {t.badge}
          </div>
          <h1 style={{ fontSize: "2.4rem", color: "#0f172a", fontWeight: 800, marginBottom: "12px" }}>{t.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "780px", marginBottom: "20px" }}>
            {t.subtitle}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#047857", fontWeight: 700 }}>
            <Truck size={18} /> {t.guarantee}
          </div>
        </div>

        {/* Сетка товаров */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {summerProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
