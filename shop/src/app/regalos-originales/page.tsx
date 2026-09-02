"use client";

import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/shop/ProductCard";
import { AiGiftAdvisor } from "@/components/shop/AiGiftAdvisor";
import { useCartStore } from "@/store/cartStore";
import { Gift, Truck, ArrowRight, ArrowLeft, Calendar, Sparkles } from "lucide-react";

/**
 * Постоянный SEO-лендинг для оригинальных подарков (Regalos Originales España) в светлой теме
 * с интегрированным интерактивным AI Ассистентом
 */
export default function RegalosOriginalesPage() {
  const { language } = useCartStore();
  const { products } = useProducts();

  const giftProducts = products.filter((p) => p.isBestseller || p.isNew);

  const t = {
    badge: language === "es" ? "Guía Oficial de Regalos" : "Official Gift Guide",
    title: language === "es" ? "Regalos Originales de Tecnología y Confort" : "Original Tech & Living Gifts in Spain",
    subtitle:
      language === "es"
        ? "Elige el detalle ideal para San Valentín, Día del Padre, Día de la Madre o cumpleaños. Ideas tecnológicas con entrega 24/48h o Cheque Regalo Digital inmediato."
        : "Find the ideal gift for Valentine's, Father's Day, Mother's Day or anniversaries. Express 24h delivery or instant Digital Gift Card.",
    guarantee: language === "es" ? "Entrega urgente en 24h o Cheque Regalo Digital inmediato al email." : "24h express delivery or instant digital gift card to email.",
    back: language === "es" ? "Volver al catálogo" : "Back to catalog",
    giftCardBtn: language === "es" ? "Comprar Cheque Regalo" : "Buy Gift Card",
    catalogTitle: language === "es" ? "Todos los Regalos y Accesorios Destacados" : "All Featured Gifts & Accessories",
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
            href="/gift-cards"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#047857",
              fontSize: "0.85rem",
              fontWeight: 700,
            }}
          >
            <Gift size={15} /> {t.giftCardBtn} <ArrowRight size={14} />
          </Link>
        </div>

        {/* Заголовок лендинга */}
        <div
          style={{
            padding: "36px",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
            border: "1px solid #fed7aa",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#ea580c", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
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

        {/* AI Ассистент по подбору подарков */}
        <div style={{ marginBottom: "50px" }}>
          <AiGiftAdvisor />
        </div>

        {/* Полный каталог подарков */}
        <div>
          <h2 style={{ fontSize: "1.6rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "24px" }}>
            {t.catalogTitle}
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {giftProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
