"use client";

import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { Sparkles, Truck, ArrowRight, ArrowLeft, Calendar, Gift } from "lucide-react";

/**
 * Постоянный SEO-лендинг для Рождества и Reyes Magos (Especial Navidad y Reyes Magos) в светлой теме
 */
export default function EspecialNavidadPage() {
  const { language } = useCartStore();
  const { products } = useProducts();

  const christmasProducts = products.filter((p) => p.isBestseller || p.rating >= 4.7);

  const t = {
    badge: language === "es" ? "Especial Navidad y Reyes Magos" : "Christmas & Three Kings",
    title: language === "es" ? "Especial Navidad: Tecnología, Regalos y Reyes Magos" : "Holiday Christmas: Tech Gifts & Kings Selection",
    subtitle:
      language === "es"
        ? "La mayor selección de regalos de tecnología premium en España. Entrega garantizada antes de Nochebuena y Reyes Magos desde Castellón y Valencia."
        : "The premier holiday tech gift collection. Guaranteed delivery before Christmas Eve and Three Kings Day across Spain & EU.",
    guarantee: language === "es" ? "Envío urgente en 24/48h o Cheque Regalo Digital instantáneo para el Día de Reyes." : "24/48h express delivery or instant Digital Gift Voucher for Three Kings Day.",
    back: language === "es" ? "Volver al catálogo" : "Back to catalog",
    giftCardBtn: language === "es" ? "Comprar Cheque Regalo" : "Buy Gift Card",
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
              color: "#b45309",
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
            background: "linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)",
            border: "1px solid #fde68a",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#b45309", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
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

        {/* Сетка товаров */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {christmasProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
