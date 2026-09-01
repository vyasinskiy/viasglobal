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
 * Подвал сайта (Footer) в светлой теме с юридической информацией (Испания и ЕС)
 */
export const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { language } = useCartStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  return (
    <footer
      style={{
        background: "#ffffff",
        borderTop: "1px solid var(--border-color)",
        marginTop: "auto",
      }}
    >
      {/* Секция ключевых преимуществ */}
      <div
        style={{
          borderBottom: "1px solid var(--border-color)",
          padding: "36px 0",
          background: "#f8fafc",
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
                  background: "#e0f2fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0284c7",
                  flexShrink: 0,
                }}
              >
                <Truck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "4px" }}>
                  {t.footer.usp1Title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
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
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#047857",
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "4px" }}>
                  {t.footer.usp2Title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
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
                  background: "#fef3c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#b45309",
                  flexShrink: 0,
                }}
              >
                <RotateCcw size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "4px" }}>
                  {t.footer.usp3Title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
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
                  background: "#ede9fe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7c3aed",
                  flexShrink: 0,
                }}
              >
                <Headphones size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: "1rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "4px" }}>
                  {t.footer.usp4Title}
                </h4>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                  {t.footer.usp4Desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной блок ссылок */}
      <div className="container" style={{ padding: "48px 24px 28px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "36px",
            marginBottom: "36px",
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
                fontWeight: 900,
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #0284c7 0%, #d97706 100%)",
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
              <span style={{ color: "#0f172a" }}>
                VIAS<span style={{ color: "#0284c7" }}>GLOBAL</span>
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
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: "6px",
                fontSize: "0.75rem",
                color: "#047857",
                fontWeight: 700,
              }}
            >
              <CheckCircle size={14} /> {t.footer.viesBadge}
            </div>
          </div>

          {/* Колонка 2: Навигация */}
          <div>
            <h4 style={{ fontSize: "0.92rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
            <h4 style={{ fontSize: "0.92rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {t.footer.customerTitle}
            </h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              <li><Link href="/shipping">{language === "es" ? "Condiciones de Envío y Garantía" : "Shipping & Warranty Terms"}</Link></li>
              <li><Link href="/campaigns">{language === "es" ? "Calendario de Campañas Festivas" : "Holiday Campaign Calendar"}</Link></li>
              <li><Link href="/gift-cards">{language === "es" ? "Cheque Regalo Digital" : "Digital Gift Cards"}</Link></li>
              <li><Link href="/about">{language === "es" ? "Sobre Viasglobal" : "About Viasglobal"}</Link></li>
              <li><Link href="/contact">{language === "es" ? "Contacto y Soporte" : "Contact & Support"}</Link></li>
            </ul>
          </div>

          {/* Колонка 4: Юридическая информация */}
          <div>
            <h4 style={{ fontSize: "0.92rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
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
            paddingTop: "20px",
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
            <CreditCard size={18} />
            <span>{t.footer.securePayment}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
