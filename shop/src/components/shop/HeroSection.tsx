"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Star } from "lucide-react";

/**
 * Главный Hero баннер интернет-магазина (ES / EN)
 */
export const HeroSection = () => {
  const { language } = useCartStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  return (
    <section
      style={{
        position: "relative",
        padding: "60px 0 80px",
        overflow: "hidden",
      }}
    >
      {/* Фоновые декоративные сферы */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          left: "10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(2, 132, 199, 0.25) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-50px",
          right: "10%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.18) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div className="container" style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            alignItems: "center",
          }}
        >
          {/* Левая колонка: Текст и CTA */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                background: "rgba(2, 132, 199, 0.12)",
                border: "1px solid rgba(2, 132, 199, 0.3)",
                borderRadius: "var(--radius-full)",
                fontSize: "0.85rem",
                color: "#38bdf8",
                fontWeight: 700,
                marginBottom: "20px",
              }}
            >
              <Sparkles size={16} /> {t.hero.badge}
            </div>

            <h1
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                marginBottom: "20px",
                letterSpacing: "-0.03em",
              }}
            >
              {t.hero.titleStart}{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #38bdf8 0%, #0284c7 50%, #f59e0b 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {t.hero.titleGradient}
              </span>
            </h1>

            <p
              style={{
                fontSize: "1.1rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginBottom: "32px",
                maxWidth: "540px",
              }}
            >
              {t.hero.subtitle}
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "16px",
                marginBottom: "36px",
              }}
            >
              <Link href="/products" className="btn-primary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
                {t.hero.btnCatalog} <ArrowRight size={18} />
              </Link>
              <Link href="/products?filter=bestsellers" className="btn-secondary" style={{ padding: "14px 24px", fontSize: "1rem" }}>
                {t.hero.btnBestsellers}
              </Link>
            </div>

            {/* Метки доверия */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
                paddingTop: "20px",
                borderTop: "1px solid var(--border-color)",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Zap size={16} color="#fbbf24" /> {t.hero.dispatchBadge}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={16} color="#34d399" /> {t.hero.warrantyBadge}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Star size={16} color="#fbbf24" fill="#fbbf24" /> {t.hero.ratingBadge}
              </div>
            </div>
          </div>

          {/* Правая колонка: Флагманский товар */}
          <div style={{ position: "relative" }}>
            <div
              className="glass-panel glass-glow"
              style={{
                padding: "24px",
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "300px",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                  marginBottom: "20px",
                  background: "#1e293b",
                }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
                  alt="Vias Aura Pro Wireless ANC Headphones"
                  fill
                  priority
                  style={{ objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                  }}
                >
                  <span className="badge badge-bestseller">
                    <Sparkles size={12} /> {t.hero.flagshipBadge}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "4px" }}>
                    Vias Aura Pro Wireless ANC
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Hi-Res Audio • ANC Adaptativo • 45h batería
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#38bdf8" }}>
                    €249.99
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-subtle)", textDecoration: "line-through" }}>
                    €299.99
                  </div>
                </div>
              </div>

              <Link
                href="/products/prod-1"
                className="btn-primary"
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "0.95rem",
                  marginTop: "8px",
                }}
              >
                {t.hero.btnFlagship} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
