"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import {
  ShoppingBag,
  Heart,
  Search,
  Menu,
  X,
  ShieldCheck,
  Zap,
} from "lucide-react";

/**
 * Главное навигационное меню (Header) в светлой теме с валенсийскими акцентами и переключателем языков (ES / EN)
 */
export const Header = () => {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { language, setLanguage, items, wishlist, toggleCartDrawer } = useCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  const totalCartCount = mounted
    ? items.reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const wishlistCount = mounted ? wishlist.length : 0;

  const navLinks = [
    { href: "/", label: t.header.home },
    { href: "/products", label: t.header.catalog },
    { href: "/gift-cards", label: language === "es" ? "Cheque Regalo" : "Gift Cards" },
    { href: "/campaigns", label: language === "es" ? "Calendario Fiestas" : "Fiestas Calendar" },
    { href: "/about", label: t.header.about },
    { href: "/shipping", label: t.header.shipping },
    { href: "/contact", label: t.header.contact },
  ];

  return (
    <header className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 1000, background: "rgba(255, 255, 255, 0.95)", borderBottom: "1px solid var(--border-color)", boxShadow: "var(--shadow-sm)" }}>
      {/* Верхняя информационная полоска с градиентом Валенсийского синего и оранжевого */}
      <div
        style={{
          background: "linear-gradient(90deg, #0369a1 0%, #0284c7 65%, #ea580c 100%)",
          padding: "6px 0",
          fontSize: "0.8rem",
          fontWeight: 700,
          color: "#ffffff",
          textAlign: "center",
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Zap size={14} color="#fef08a" />
            {t.header.topBar}
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", opacity: 0.95 }}>
            <ShieldCheck size={14} /> {t.header.warrantyBadge}
          </span>
        </div>
      </div>

      {/* Основная панель навигации */}
      <div className="container" style={{ padding: "14px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "24px",
          }}
        >
          {/* Логотип: Средиземноморский синий + Валенсийский апельсин */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "1.35rem",
              fontWeight: 900,
              letterSpacing: "-0.03em",
            }}
          >
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #0284c7 0%, #ea580c 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 900,
                boxShadow: "0 2px 10px rgba(234, 88, 12, 0.35)",
              }}
            >
              V
            </div>
            <span style={{ color: "#0f172a" }}>
              VIAS<span style={{ color: "#0284c7" }}>GLOBAL</span>
              <span
                style={{
                  fontSize: "0.65rem",
                  marginLeft: "6px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "#fff7ed",
                  color: "#ea580c",
                  border: "1px solid #fed7aa",
                  verticalAlign: "middle",
                  fontWeight: 800,
                }}
              >
                STORE
              </span>
            </span>
          </Link>

          {/* Навигационные ссылки (десктоп) */}
          <nav
            style={{
              display: "none",
              gap: "24px",
              alignItems: "center",
            }}
            className="desktop-nav"
          >
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: "0.92rem",
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? "#ea580c" : "var(--text-muted)",
                    position: "relative",
                    padding: "4px 0",
                    transition: "color 0.2s ease",
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        left: 0,
                        right: 0,
                        height: "2px",
                        background: "linear-gradient(90deg, #0284c7, #ea580c)",
                        borderRadius: "2px",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Поиск, Языки и действия (корзина, вишлист) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {/* Переключатель языков (ES / EN) */}
            <div
              className="hide-on-mobile"
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f1f5f9",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "2px",
                gap: "2px",
              }}
            >
              <button
                onClick={() => setLanguage("es")}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  background: language === "es" ? "#0284c7" : "transparent",
                  color: language === "es" ? "#fff" : "var(--text-muted)",
                  transition: "all 0.2s ease",
                }}
                title="Español"
              >
                🇪🇸 ES
              </button>
              <button
                onClick={() => setLanguage("en")}
                style={{
                  padding: "4px 8px",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  background: language === "en" ? "#0284c7" : "transparent",
                  color: language === "en" ? "#fff" : "var(--text-muted)",
                  transition: "all 0.2s ease",
                }}
                title="English"
              >
                🇬🇧 EN
              </button>
            </div>

            {/* Поисковая строка (десктоп) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(
                    searchQuery
                  )}`;
                }
              }}
              style={{
                position: "relative",
                display: "none",
              }}
              className="search-box"
            >
              <input
                type="text"
                placeholder={t.header.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "#f8fafc",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 14px 8px 36px",
                  fontSize: "0.88rem",
                  color: "var(--text-main)",
                  outline: "none",
                  width: "180px",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.width = "220px";
                  e.target.style.borderColor = "var(--primary)";
                  e.target.style.background = "#ffffff";
                }}
                onBlur={(e) => {
                  e.target.style.width = "180px";
                  e.target.style.borderColor = "var(--border-color)";
                  e.target.style.background = "#f8fafc";
                }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "12px", top: "11px" }}
              />
            </form>

            {/* Избранное */}
            <Link
              href="/products?filter=wishlist"
              className="btn-icon"
              title={t.header.wishlistTitle}
              style={{ position: "relative" }}
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#dc2626",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "18px",
                    height: "18px",
                    fontSize: "0.7rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Корзина с акцентным бейджем Naranja de Valencia */}
            <button
              onClick={toggleCartDrawer}
              className="btn-icon"
              title={t.header.cartTitle}
              style={{
                position: "relative",
                background: totalCartCount > 0 ? "#fff7ed" : undefined,
                borderColor: totalCartCount > 0 ? "#ea580c" : undefined,
              }}
            >
              <ShoppingBag size={20} color={totalCartCount > 0 ? "#ea580c" : "currentColor"} />
              {totalCartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "linear-gradient(135deg, #ea580c, #c2410c)",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(234, 88, 12, 0.4)",
                  }}
                >
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Мобильная кнопка меню */}
            <button
              className="btn-icon mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: "none" }}
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Мобильное выпадающее меню */}
        {mobileMenuOpen && (
          <div
            style={{
              paddingTop: "16px",
              borderTop: "1px solid var(--border-color)",
              marginTop: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {/* Переключатель языков в мобильном меню */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f1f5f9",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "4px",
                gap: "4px",
                justifyContent: "center",
                marginBottom: "8px",
              }}
            >
              <button
                onClick={() => { setLanguage("es"); setMobileMenuOpen(false); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  background: language === "es" ? "#0284c7" : "transparent",
                  color: language === "es" ? "#fff" : "var(--text-muted)",
                }}
              >
                🇪🇸 ES
              </button>
              <button
                onClick={() => { setLanguage("en"); setMobileMenuOpen(false); }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  background: language === "en" ? "#0284c7" : "transparent",
                  color: language === "en" ? "#fff" : "var(--text-muted)",
                }}
              >
                🇬🇧 EN
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  window.location.href = `/products?search=${encodeURIComponent(
                    searchQuery
                  )}`;
                  setMobileMenuOpen(false);
                }
              }}
              style={{ position: "relative", marginBottom: "8px" }}
            >
              <input
                type="text"
                placeholder={t.header.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "#f8fafc",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "10px 14px 10px 36px",
                  fontSize: "0.9rem",
                  color: "var(--text-main)",
                }}
              />
              <Search
                size={16}
                color="var(--text-muted)"
                style={{ position: "absolute", left: "12px", top: "12px" }}
              />
            </form>

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: "1rem",
                  padding: "8px 0",
                  color: pathname === link.href ? "#ea580c" : "var(--text-main)",
                  fontWeight: pathname === link.href ? 800 : 600,
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @media (min-width: 860px) {
          .desktop-nav {
            display: flex !important;
          }
          .search-box {
            display: block !important;
          }
        }
        @media (max-width: 859px) {
          .mobile-menu-btn {
            display: inline-flex !important;
          }
          .hide-on-mobile {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
