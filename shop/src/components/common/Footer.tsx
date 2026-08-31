"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CreditCard,
  CheckCircle,
} from "lucide-react";

/**
 * Подвал сайта (Footer) с юридической информацией (Испания и ЕС) и переводами
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { language } = useCartStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  return (
    <footer
      style={{
        background: "rgba(11, 15, 23, 0.98)",
        borderTop: "1px solid var(--border-color)",
        marginTop: "auto",
      }}
    >
      {/* Секция ключевых преимуществ */}
      <div
        style={{
          borderBottom: "1px solid var(--border-color)",
          padding: "40px 0",
          background: "rgba(255, 255, 255, 0.01)",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Преимущество 1 */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(2, 132, 199, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#38bdf8",
                  flexShrink: 0,
                }}
              >
                <Truck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", color: "#fff", marginBottom: "4px" }}>
                  {t.footer.usp1Title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {t.footer.usp1Desc}
                </p>
              </div>
            </div>

            {/* Преимущество 2 */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#34d399",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", color: "#fff", marginBottom: "4px" }}>
                  {t.footer.usp2Title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {t.footer.usp2Desc}
                </p>
              </div>
            </div>

            {/* Преимущество 3 */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(245, 158, 11, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fbbf24",
                  flexShrink: 0,
                }}
              >
                <RotateCcw size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", color: "#fff", marginBottom: "4px" }}>
                  {t.footer.usp3Title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {t.footer.usp3Desc}
                </p>
              </div>
            </div>

            {/* Преимущество 4 */}
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(168, 85, 247, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#c084fc",
                  flexShrink: 0,
                }}
              >
                <Headphones size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", color: "#fff", marginBottom: "4px" }}>
                  {t.footer.usp4Title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  {t.footer.usp4Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной блок ссылок */}
      <div className="container" style={{ padding: "50px 24px 30px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "36px",
            marginBottom: "40px",
          }}
        >
          {/* Колонка 1: Бренд и реквизиты */}
          <div style={{ maxWidth: "300px" }}>
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "1.25rem",
                fontWeight: 800,
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #0284c7 0%, #f59e0b 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "0.9rem",
                }}
              >
                V
              </div>
              <span style={{ color: "#fff" }}>
                VIAS<span style={{ color: "#38bdf8" }}>GLOBAL</span>
              </span>
            </Link>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "16px" }}>
              {t.footer.brandDesc}
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "6px",
                fontSize: "0.75rem",
                color: "#34d399",
                fontWeight: 600,
              }}
            >
              <CheckCircle size={14} /> {t.footer.viesBadge}
            </div>
          </div>

          {/* Колонка 2: Навигация */}
          <div>
            <h4 style={{ fontSize: "0.95rem", color: "#fff", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t.footer.catTitle}
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              <li><Link href="/products?category=audio" style={{ transition: "color 0.2s" }}>{language === "es" ? "Audio y Auriculares" : "Audio & Headphones"}</Link></li>
              <li><Link href="/products?category=workspace" style={{ transition: "color 0.2s" }}>{language === "es" ? "Espacio de Trabajo" : "Workspace & Ergonomics"}</Link></li>
              <li><Link href="/products?category=smart-home" style={{ transition: "color 0.2s" }}>{language === "es" ? "Hogar Inteligente" : "Smart Home & IoT"}</Link></li>
              <li><Link href="/products?category=electronics" style={{ transition: "color 0.2s" }}>{language === "es" ? "Cargadores GaN" : "GaN Fast Chargers"}</Link></li>
              <li><Link href="/products?category=lifestyle" style={{ transition: "color 0.2s" }}>{language === "es" ? "Bienestar y Hogar" : "Lifestyle & Living"}</Link></li>
            </ul>
          </div>

          {/* Колонка 3: Покупателям */}
          <div>
            <h4 style={{ fontSize: "0.95rem", color: "#fff", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t.footer.customerTitle}
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              <li><Link href="/shipping">{language === "es" ? "Condiciones de Envío y Garantía" : "Shipping & Warranty Terms"}</Link></li>
              <li><Link href="/about">{language === "es" ? "Sobre Viasglobal" : "About Viasglobal"}</Link></li>
              <li><Link href="/contact">{language === "es" ? "Contacto y Soporte" : "Contact & Support"}</Link></li>
              <li><Link href="/cart">{language === "es" ? "Cesta de compra" : "Shopping Cart"}</Link></li>
            </ul>
          </div>

          {/* Колонка 4: Юридическая информация */}
          <div>
            <h4 style={{ fontSize: "0.95rem", color: "#fff", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {t.footer.legalTitle}
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              <li><Link href="/legal">Aviso Legal (LSSICE ст. 10)</Link></li>
              <li><Link href="/privacy">{language === "es" ? "Política de Privacidad (RGPD)" : "Privacy Policy (GDPR)"}</Link></li>
              <li><Link href="/shipping">{language === "es" ? "Política de Devoluciones" : "Return Policy"}</Link></li>
              <li style={{ fontSize: "0.8rem", color: "var(--text-subtle)", marginTop: "6px" }}>
                NIF: ESZ1154366R | Valencia, España
              </li>
            </ul>
          </div>
        </div>

        {/* Нижняя полоса авторских прав и способов оплаты */}
        <div
          style={{
            borderTop: "1px solid var(--border-color)",
            paddingTop: "24px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            fontSize: "0.82rem",
            color: "var(--text-subtle)",
          }}
        >
          <div>
            © {currentYear} Viasglobal Store. {t.footer.allRightsReserved} {t.footer.operatorInfo}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)" }}>
            <CreditCard size={18} />
            <span>{t.footer.securePayment}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
