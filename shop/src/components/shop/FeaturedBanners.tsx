"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import { Headphones, Laptop, Cpu, Home, Sparkles, ArrowRight } from "lucide-react";

/**
 * Блок популярных категорий и промо-баннеров в светлой теме с валенсийской палитрой (ES / EN)
 */
export const FeaturedBanners = () => {
  const { language } = useCartStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  const categories = [
    {
      id: "audio",
      title: t.categories.audio.title,
      desc: t.categories.audio.desc,
      icon: Headphones,
      color: "#0284c7", // Azul Mediterráneo
      bg: "#e0f2fe",
      href: "/products?category=audio",
    },
    {
      id: "workspace",
      title: t.categories.workspace.title,
      desc: t.categories.workspace.desc,
      icon: Laptop,
      color: "#ea580c", // Naranja de Valencia
      bg: "#fff7ed",
      href: "/products?category=workspace",
    },
    {
      id: "smart-home",
      title: t.categories.smartHome.title,
      desc: t.categories.smartHome.desc,
      icon: Home,
      color: "#059669", // Verde Huerta
      bg: "#ecfdf5",
      href: "/products?category=smart-home",
    },
    {
      id: "electronics",
      title: t.categories.electronics.title,
      desc: t.categories.electronics.desc,
      icon: Cpu,
      color: "#dc2626", // Rojo Senyera
      bg: "#fef2f2",
      href: "/products?category=electronics",
    },
  ];

  return (
    <section style={{ padding: "40px 0 60px" }}>
      <div className="container">
        <div style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#ea580c", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.categories.sectionBadge}
            </span>
            <h2 style={{ fontSize: "1.8rem", color: "var(--text-main)", marginTop: "4px" }}>{t.categories.sectionTitle}</h2>
          </div>
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
            {t.categories.viewAll} <ArrowRight size={16} />
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "20px",
          }}
        >
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.25s ease",
                  borderRadius: "var(--radius-md)",
                  background: "#ffffff",
                  border: "1px solid var(--border-color)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: cat.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: cat.color,
                      marginBottom: "16px",
                      border: `1px solid ${cat.color}25`,
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: "1.15rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "6px" }}>
                    {cat.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                    {cat.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: cat.color,
                    fontSize: "0.88rem",
                    fontWeight: 800,
                    marginTop: "20px",
                  }}
                >
                  {language === "es" ? "Explorar" : "Explore"} <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Промо-баннер с купоном: Теплые валенсийские тона */}
        <div
          style={{
            marginTop: "36px",
            padding: "32px",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 50%, #f0f9ff 100%)",
            border: "1px solid #fed7aa",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#c2410c", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "6px" }}>
              <Sparkles size={16} /> {t.categories.promoBadge}
            </div>
            <h3 style={{ fontSize: "1.45rem", color: "#0f172a", fontWeight: 800, marginBottom: "6px" }}>
              {t.categories.promoTitle}
            </h3>
            <p style={{ fontSize: "0.92rem", color: "#334155" }}>
              {t.categories.promoDesc}
            </p>
          </div>

          <Link href="/products" className="btn-accent" style={{ padding: "12px 28px" }}>
            {t.categories.promoBtn}
          </Link>
        </div>
      </div>
    </section>
  );
};
