"use client";

import Link from "next/link";
import { PRODUCTS_DATA } from "@/data/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { Sparkles, Truck, ArrowRight, ArrowLeft, Calendar } from "lucide-react";

/**
 * Постоянный SEO-лендинг для длинных выходных и мостов (Especial Puentes y Festivos España) в светлой теме
 */
export default function EspecialPuentesPage() {
  const { language } = useCartStore();

  const puentesProducts = PRODUCTS_DATA.filter(
    (p) => p.category === "audio" || p.category === "electronics" || p.category === "lifestyle"
  );

  const t = {
    badge: language === "es" ? "Especial Puentes y Escapadas" : "Bridge Weekends & Holidays",
    title: language === "es" ? "Especial Puentes: Gadgets y Sonido con Envío 24/48h" : "Holiday Long Weekends: Fast 24/48h Dispatch",
    subtitle:
      language === "es"
        ? "Pídelo hoy y recíbelo antes del puente. Todo en audio inalámbrico, carga rápida GaN y accesorios de viaje desde Castellón y Valencia."
        : "Order today, receive before the long weekend. High-speed GaN chargers, ANC wireless audio, and travel essentials from Spain.",
    guarantee: language === "es" ? "Envío urgente en 24h desde Castellón/Valencia con stock verificado." : "24h express dispatch from Castellón/Valencia with verified local stock.",
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
            background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)",
            border: "1px solid #bae6fd",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0284c7", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
            <Sparkles size={16} /> {t.badge}
          </div>
          <h1 style={{ fontSize: "2.4rem", color: "#0f172a", fontWeight: 800, marginBottom: "12px" }}>{t.title}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "780px", marginBottom: "20px" }}>
            {t.subtitle}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.88rem", color: "#047857", fontWeight: 700 }}>
            <Truck size={18} /> {t.guarantee}
          </div>
        </div>

        {/* Сетка товаров для мостов и поездок */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {puentesProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
