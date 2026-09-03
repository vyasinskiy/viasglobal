import Link from "next/link";
import { getStoreProducts } from "@/lib/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { Sun, Truck, ArrowRight, ArrowLeft, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * Постоянный SEO-лендинг для летних предложений и фестивалей (Ofertas Verano España)
 * Серверный компонент: загружает товары с тегом 'playa'/'verano' напрямую из Supabase
 */
export default async function OfertasVeranoPage() {
  const summerProducts = await getStoreProducts(undefined, "playa");

  const t = {
    badge: "Especial Temporada de Verano",
    title: "Ofertas de Verano: Playa, Vacaciones y Accesorios",
    subtitle:
      "Toallas fouta de rizo, juguetes de playa de silicona, cestas de mimbre y accesorios esenciales con entrega urgente 24/48h directo a tu destino vacacional.",
    guarantee: "Envío urgente en 24h desde Castellón y Valencia directo a tu destino vacacional.",
    back: "Volver al catálogo",
    allCampaigns: "Ver Calendario Anual de 52 Semanas",
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
