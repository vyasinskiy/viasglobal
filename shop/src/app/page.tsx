"use client";

import Link from "next/link";
import { HeroSection } from "@/components/shop/HeroSection";
import { FeaturedBanners } from "@/components/shop/FeaturedBanners";
import { ProductCard } from "@/components/shop/ProductCard";
import { PRODUCTS_DATA } from "@/data/products";
import { useCartStore } from "@/store/cartStore";
import { ArrowRight, Sparkles, Shield, Truck, Award, CheckCircle2 } from "lucide-react";

/**
 * Главная витрина интернет-магазина Viasglobal Store (ES / EN)
 */
export default function HomePage() {
  const { language } = useCartStore();
  const bestsellers = PRODUCTS_DATA.filter((p) => p.isBestseller);
  const featured = PRODUCTS_DATA.filter((p) => p.isFeatured);

  const t = {
    bestsellersBadge: language === "es" ? "Los más elegidos" : "Customer Choice",
    bestsellersTitle: language === "es" ? "Los Más Vendidos" : "Bestselling Products",
    bestsellersAll: language === "es" ? "Ver todos los más vendidos" : "View all bestsellers",
    featuredBadge: language === "es" ? "Innovación y Estilo" : "Innovation & Style",
    featuredTitle: language === "es" ? "Productos Recomendados" : "Featured Products",
    featuredAll: language === "es" ? "Ver todo el catálogo" : "View full catalog",
    whyBadge: language === "es" ? "Estándares Europeos de Calidad" : "European Quality Standards",
    whyTitle: language === "es" ? "¿Por qué comprar en Viasglobal?" : "Why choose Viasglobal Store?",
    whyDesc:
      language === "es"
        ? "Envío directo desde almacenes en Valencia, riguroso control de calidad CE/RoHS y atención al cliente dedicada en España y la UE."
        : "Direct dispatch from fulfillment centers in Valencia, strict CE/RoHS quality control, and dedicated customer care across Europe.",
    card1Title: language === "es" ? "Almacén en España y Envío 24-48h" : "Spain Fulfillment & 24-48h Dispatch",
    card1Desc:
      language === "es"
        ? "Todos los productos están en stock real en Valencia y Barcelona. Envío urgente por Correos Express / SEUR / DHL."
        : "All listed items are stocked in our Spanish fulfillment hubs. Express delivery via Correos Express / SEUR / DHL.",
    card2Title: language === "es" ? "2 Años de Garantía Total UE" : "2-Year Full European Warranty",
    card2Desc:
      language === "es"
        ? "Cumplimiento estricto de las directivas europeas de consumo. Sustitución rápida en caso de incidencia."
        : "Strict compliance with EU consumer protection directives. Fast replacement and warranty handling in Spain.",
    card3Title: language === "es" ? "Facturación VIES e IVA 0%" : "VIES Intra-Community 0% VAT",
    card3Desc:
      language === "es"
        ? "Emitimos facturas oficiales para particulares y empresas con NIF intracomunitario en toda la Unión Europea."
        : "Official electronic invoicing with zero-rated intra-community VAT for registered European businesses.",
    newsletterTitle:
      language === "es"
        ? "Suscríbete y recibe ofertas exclusivas"
        : "Subscribe for exclusive deals & drops",
    newsletterDesc:
      language === "es"
        ? "Recibe las últimas novedades en tecnología y cupones de hasta un 25% de descuento en campañas de temporada."
        : "Get the latest tech arrivals and exclusive coupon codes up to 25% OFF on seasonal sales.",
    newsletterPlaceholder: language === "es" ? "Tu correo electrónico..." : "Your business email...",
    newsletterBtn: language === "es" ? "Suscribirme" : "Subscribe",
    newsletterSuccess:
      language === "es"
        ? "¡Gracias por suscribirte! Te hemos enviado tu código de bienvenida."
        : "Thank you for subscribing! Your welcome discount is on its way.",
    noSpam: language === "es" ? "Sin spam. Puedes cancelar en 1 clic." : "Zero spam. Unsubscribe anytime in 1 click.",
  };

  return (
    <div>
      {/* 1. Главный экран Hero */}
      <HeroSection />

      {/* 2. Категории и Промо-баннеры */}
      <FeaturedBanners />

      {/* 3. Секция: Хиты продаж */}
      <section style={{ padding: "40px 0 60px" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "32px",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#fbbf24",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <Sparkles size={16} /> {t.bestsellersBadge}
              </div>
              <h2 style={{ fontSize: "2rem", marginTop: "4px" }}>{t.bestsellersTitle}</h2>
            </div>
            <Link
              href="/products?filter=bestsellers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#38bdf8",
                fontSize: "0.95rem",
                fontWeight: 600,
              }}
            >
              {t.bestsellersAll} <ArrowRight size={16} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Секция: Рекомендуемые товары */}
      <section
        style={{
          padding: "60px 0",
          background: "rgba(255, 255, 255, 0.015)",
          borderTop: "1px solid var(--border-color)",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "32px",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: "0.85rem",
                  color: "#38bdf8",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {t.featuredBadge}
              </span>
              <h2 style={{ fontSize: "2rem", marginTop: "4px" }}>{t.featuredTitle}</h2>
            </div>
            <Link
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#38bdf8",
                fontSize: "0.95rem",
                fontWeight: 600,
              }}
            >
              {t.featuredAll} <ArrowRight size={16} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 5. Секция: Преимущества Viasglobal */}
      <section style={{ padding: "80px 0" }}>
        <div className="container">
          <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 48px" }}>
            <span
              style={{
                fontSize: "0.85rem",
                color: "#38bdf8",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {t.whyBadge}
            </span>
            <h2 style={{ fontSize: "2.2rem", marginTop: "8px", marginBottom: "16px" }}>
              {t.whyTitle}
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6 }}>
              {t.whyDesc}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "28px",
            }}
          >
            <div className="glass-panel" style={{ padding: "32px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(2, 132, 199, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                  marginBottom: "20px",
                }}
              >
                <Truck size={28} />
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>
                {t.card1Title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                {t.card1Desc}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "32px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(16, 185, 129, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                  marginBottom: "20px",
                }}
              >
                <Shield size={28} />
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>
                {t.card2Title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                {t.card2Desc}
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "32px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fbbf24",
                  marginBottom: "20px",
                }}
              >
                <Award size={28} />
              </div>
              <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "10px" }}>
                {t.card3Title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5 }}>
                {t.card3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Секция: Подписка на акции */}
      <section style={{ padding: "0 0 80px" }}>
        <div className="container">
          <div
            className="glass-panel glass-glow"
            style={{
              padding: "48px 32px",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)",
              textAlign: "center",
            }}
          >
            <h2 style={{ fontSize: "2rem", marginBottom: "12px" }}>
              {t.newsletterTitle}
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "520px", margin: "0 auto 28px", fontSize: "0.95rem" }}>
              {t.newsletterDesc}
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert(t.newsletterSuccess);
              }}
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
                justifyContent: "center",
                maxWidth: "480px",
                margin: "0 auto",
              }}
            >
              <input
                type="email"
                required
                placeholder={t.newsletterPlaceholder}
                style={{
                  flex: "1 1 240px",
                  padding: "12px 16px",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  color: "#fff",
                  outline: "none",
                  fontSize: "0.95rem",
                }}
              />
              <button type="submit" className="btn-primary" style={{ padding: "12px 24px" }}>
                {t.newsletterBtn}
              </button>
            </form>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "16px",
                fontSize: "0.8rem",
                color: "var(--text-subtle)",
              }}
            >
              <CheckCircle2 size={14} color="#34d399" /> {t.noSpam}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
