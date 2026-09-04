"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { FiestaVideoHero } from "@/components/shop/FiestaVideoHero";
import { FiestaCalendarSection } from "@/components/shop/FiestaCalendarSection";
import { AiGiftAdvisor } from "@/components/shop/AiGiftAdvisor";
import { ProductCard } from "@/components/shop/ProductCard";
import { PRODUCTS_DATA } from "@/data/products";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import {
  Sparkles,
  Truck,
  ShieldCheck,
  RotateCcw,
  Zap,
  ArrowRight,
  Gift,
} from "lucide-react";

/**
 * Главная страница интернет-магазина Viasglobal Store в светлой теме
 * - Экран 1: Кинематографичное видео с испанскими фиестами (FiestaVideoHero)
 * - Экран 2: Интерактивный календарь событий с подборками товаров (FiestaCalendarSection)
 * - Секция 3: Интерактивный AI Ассистент по подбору подарков (AiGiftAdvisor)
 * - Секции 4+: Хиты продаж, баннеры категорий, преимущества и гарантии ЕС
 */
export default function HomePage() {
  const { language } = useCartStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS_DATA);

  useEffect(() => {
    // Динамическая подгрузка товаров из базы данных Supabase
    fetch("/api/products")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllProducts(data);
        }
      })
      .catch(() => {});
  }, []);

  // 4 случайных популярных товара с высоким рейтингом для витрины "Los Más Vendidos en España"
  const bestsellers = useMemo(() => {
    // Отбираем товары с высоким рейтингом (от 4.7) и наличием отзывов
    const rated = allProducts.filter((p) => p.rating >= 4.7 && p.reviewCount > 0);
    const pool = rated.length >= 4 ? rated : allProducts;

    // Перемешиваем случайным образом при загрузке каталога
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  }, [allProducts]);

  // 4 новинки (исключая товары, уже показанные в хитах продаж)
  const newArrivals = useMemo(() => {
    const bestsellerIds = new Set(bestsellers.map((b) => b.id));
    const available = allProducts.filter((p) => !bestsellerIds.has(p.id));
    return available.slice(0, 4);
  }, [allProducts, bestsellers]);

  const tHome = {
    featuredBadge: language === "es" ? "Selección Exclusiva" : "Exclusive Selection",
    bestsellersTitle: language === "es" ? "Los Más Vendidos en España" : "Top Bestsellers in Spain",
    newArrivalsBadge: language === "es" ? "Novedades en Catálogo" : "New Arrivals",
    newArrivalsTitle: language === "es" ? "Últimos Lanzamientos de Temporada" : "Latest Season Releases",
    viewAll: language === "es" ? "Ver todos los productos" : "View all products",
    usp1Title: t.footer.usp1Title,
    usp1Desc: t.footer.usp1Desc,
    usp2Title: t.footer.usp2Title,
    usp2Desc: t.footer.usp2Desc,
    usp3Title: t.footer.usp3Title,
    usp3Desc: t.footer.usp3Desc,
  };

  return (
    <div style={{ background: "var(--bg-main)" }}>
      {/* ЭКРАН 1: Всегда видео с испанскими фиестами и призывом к действию */}
      <FiestaVideoHero />

      {/* ЭКРАН 2: Календарь событий с предложением подборок товаров */}
      <FiestaCalendarSection />

      {/* ЭКРАН 3: Интерактивный AI Ассистент по подбору подарков */}
      <AiGiftAdvisor />

      {/* 4. Секция: Хиты продаж */}
      <section style={{ padding: "40px 0 60px" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "28px",
            }}
          >
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0284c7", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase" }}>
                <Sparkles size={16} /> {tHome.featuredBadge}
              </div>
              <h2 style={{ fontSize: "2.1rem", color: "var(--text-main)", fontWeight: 800, marginTop: "4px" }}>
                {tHome.bestsellersTitle}
              </h2>
            </div>
            <Link
              href="/products?filter=bestsellers"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#0284c7",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              {tHome.viewAll} <ArrowRight size={16} />
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

      {/* 6. Баннер постоянных коллекций и Cheque Regalo */}
      <section style={{ padding: "20px 0 60px" }}>
        <div className="container">
          <div
            style={{
              padding: "36px 32px",
              borderRadius: "var(--radius-lg)",
              background: "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)",
              border: "1px solid #bae6fd",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
            }}
          >
            <div style={{ maxWidth: "600px" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#047857", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                <Gift size={16} /> {language === "es" ? "Regalos y Puentes en España" : "Gifts & Bridges in Spain"}
              </div>
              <h3 style={{ fontSize: "1.8rem", color: "#0f172a", fontWeight: 800, marginBottom: "8px" }}>
                {language === "es"
                  ? "¿Buscas el regalo perfecto para el próximo puente?"
                  : "Looking for the perfect gift for the upcoming holiday?"}
              </h3>
              <p style={{ color: "#334155", fontSize: "1rem", lineHeight: 1.5 }}>
                {language === "es"
                  ? "Explora nuestras selecciones especializadas por presupuesto o envía un Cheque Regalo Digital con entrega en 1 minuto por email."
                  : "Explore our specialized gift guides by budget or send an Instant Digital Gift Card in 1 minute."}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link href="/regalos-originales" className="btn-primary" style={{ padding: "14px 24px" }}>
                <Sparkles size={18} /> {language === "es" ? "Ver Regalos Originales" : "Explore Gifts"}
              </Link>
              <Link href="/gift-cards" className="btn-secondary" style={{ padding: "14px 24px" }}>
                <Gift size={18} /> {language === "es" ? "Cheque Regalo" : "Gift Cards"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Секция: Новинки */}
      <section style={{ padding: "20px 0 60px" }}>
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "28px",
            }}
          >
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#047857", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase" }}>
                <Zap size={16} /> {tHome.newArrivalsBadge}
              </div>
              <h2 style={{ fontSize: "2.1rem", color: "var(--text-main)", fontWeight: 800, marginTop: "4px" }}>
                {tHome.newArrivalsTitle}
              </h2>
            </div>
            <Link
              href="/products"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#0284c7",
                fontWeight: 700,
                fontSize: "0.95rem",
              }}
            >
              {tHome.viewAll} <ArrowRight size={16} />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 8. Преимущества сервиса */}
      <section style={{ padding: "30px 0 70px" }}>
        <div className="container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "28px 24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", color: "#0284c7", marginBottom: "16px" }}>
                <Truck size={24} />
              </div>
              <h3 style={{ fontSize: "1.15rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "6px" }}>
                {tHome.usp1Title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                {tHome.usp1Desc}
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "28px 24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#047857", marginBottom: "16px" }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: "1.15rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "6px" }}>
                {tHome.usp2Title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                {tHome.usp2Desc}
              </p>
            </div>

            <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "28px 24px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", color: "#b45309", marginBottom: "16px" }}>
                <RotateCcw size={24} />
              </div>
              <h3 style={{ fontSize: "1.15rem", color: "var(--text-main)", fontWeight: 700, marginBottom: "6px" }}>
                {tHome.usp3Title}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                {tHome.usp3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
