"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import { Headphones, Laptop, Cpu, Home, Sparkles, ArrowRight } from "lucide-react";

/**
 * Блок популярных категорий и промо-баннеров (ES / EN)
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
      color: "#0284c7",
      href: "/products?category=audio",
    },
    {
      id: "workspace",
      title: t.categories.workspace.title,
      desc: t.categories.workspace.desc,
      icon: Laptop,
      color: "#f59e0b",
      href: "/products?category=workspace",
    },
    {
      id: "smart-home",
      title: t.categories.smartHome.title,
      desc: t.categories.smartHome.desc,
      icon: Home,
      color: "#10b981",
      href: "/products?category=smart-home",
    },
    {
      id: "electronics",
      title: t.categories.electronics.title,
      desc: t.categories.electronics.desc,
      icon: Cpu,
      color: "#8b5cf6",
      href: "/products?category=electronics",
    },
  ];

  return (
    <section style={{ padding: "40px 0 60px" }}>
      <div className="container">
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t.categories.sectionBadge}
            </span>
            <h2 style={{ fontSize: "1.8rem", marginTop: "4px" }}>{t.categories.sectionTitle}</h2>
          </div>
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#38bdf8",
              fontSize: "0.9rem",
              fontWeight: 600,
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
                className="glass-panel"
                style={{
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.25s ease",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: `rgba(${cat.id === "audio" ? "2, 132, 199" : cat.id === "workspace" ? "245, 158, 11" : cat.id === "smart-home" ? "16, 185, 129" : "139, 92, 246"}, 0.15)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: cat.color,
                      marginBottom: "16px",
                    }}
                  >
                    <Icon size={24} />
                  </div>
                  <h3 style={{ fontSize: "1.15rem", color: "#fff", marginBottom: "6px" }}>
                    {cat.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {cat.desc}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: cat.color,
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    marginTop: "20px",
                  }}
                >
                  {language === "es" ? "Explorar" : "Explore"} <ArrowRight size={14} />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Промо-баннер с купоном */}
        <div
          className="glass-panel glass-glow"
          style={{
            marginTop: "40px",
            padding: "32px",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#fbbf24", fontSize: "0.85rem", fontWeight: 700, marginBottom: "8px" }}>
              <Sparkles size={16} /> {t.categories.promoBadge}
            </div>
            <h3 style={{ fontSize: "1.4rem", color: "#fff", marginBottom: "6px" }}>
              {t.categories.promoTitle}
            </h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
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
