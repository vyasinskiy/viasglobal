"use client";

import Link from "next/link";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { Home, Truck, ArrowRight, ArrowLeft, Calendar } from "lucide-react";

/**
 * Постоянный SEO-лендинг для порядка в доме и организации пространства (Orden en Casa España) в светлой теме
 */
export default function OrdenEnCasaPage() {
  const { language } = useCartStore();
  const { products } = useProducts();

  const homeProducts = products.filter(
    (p) => p.category === "workspace" || p.category === "smart-home" || p.category === "lifestyle"
  );

  const t = {
    badge: language === "es" ? "Especial Organización y Hogar" : "Home & Workspace Organization",
    title: language === "es" ? "Orden en Casa: Gestión de Cables, Confort y Domótica" : "Home Organization: Smart Living & Cable Management",
    subtitle:
      language === "es"
        ? "Transforma tu espacio vital y lugar de trabajo. Soluciones inteligentes de organización, estaciones de carga y climatización con entrega 24/48h."
        : "Transform your living and workspaces. Cable management, multi-device charging hubs, and smart IoT with 24/48h delivery.",
    guarantee: language === "es" ? "Envío urgente en 24h desde Castellón/Valencia para disfrutar de un hogar ordenado." : "24h express dispatch to enjoy a clean, clutter-free home.",
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
            background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)",
            border: "1px solid #a7f3d0",
            boxShadow: "var(--shadow-sm)",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#047857", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
            <Home size={16} /> {t.badge}
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
          {homeProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
