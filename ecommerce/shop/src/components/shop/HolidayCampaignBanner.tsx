"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { CampaignStage } from "@/types/campaign";
import {
  Gift,
  Truck,
  CreditCard,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  CheckCircle2,
  Calendar,
} from "lucide-react";

/**
 * Динамический баннер праздничной кампании в светлой теме с валенсийской палитрой (3 этапа):
 * 1. За 3 недели: Подборки подарков (Guía de Regalos)
 * 2. За 1 неделю: Срочная доставка «Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia»
 * 3. За 2 дня: Электронные подарочные карты (Cheque Regalo Digital)
 */
export const HolidayCampaignBanner = () => {
  const { language } = useCartStore();
  const [activeStage, setActiveStage] = useState<CampaignStage>("stage2_fast_delivery");

  return (
    <div style={{ marginBottom: "32px" }}>
      {/* Селектор демонстрации стадий маркетинга */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          padding: "8px 16px",
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "12px",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#ea580c", fontWeight: 800 }}>
          <Calendar size={14} />
          {language === "es" ? "Estrategia de Campaña Festiva:" : "Holiday Campaign Stage:"}
        </span>

        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveStage("stage1_collections")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 700,
              background: activeStage === "stage1_collections" ? "#e0f2fe" : "transparent",
              color: activeStage === "stage1_collections" ? "#0284c7" : "var(--text-muted)",
              border: activeStage === "stage1_collections" ? "1px solid #0284c7" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            {language === "es" ? "3 semanas antes: Colecciones" : "-3 weeks: Gift Guides"}
          </button>

          <button
            onClick={() => setActiveStage("stage2_fast_delivery")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 700,
              background: activeStage === "stage2_fast_delivery" ? "#fff7ed" : "transparent",
              color: activeStage === "stage2_fast_delivery" ? "#c2410c" : "var(--text-muted)",
              border: activeStage === "stage2_fast_delivery" ? "1px solid #ea580c" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            {language === "es" ? "1 semana antes: Envío 24/48h" : "-1 week: 24/48h Fast Delivery"}
          </button>

          <button
            onClick={() => setActiveStage("stage3_gift_cards")}
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              fontSize: "0.75rem",
              fontWeight: 700,
              background: activeStage === "stage3_gift_cards" ? "#ecfdf5" : "transparent",
              color: activeStage === "stage3_gift_cards" ? "#047857" : "var(--text-muted)",
              border: activeStage === "stage3_gift_cards" ? "1px solid #059669" : "1px solid transparent",
              cursor: "pointer",
            }}
          >
            {language === "es" ? "2 días antes: Cheque Regalo" : "-2 days: Gift Cards"}
          </button>
        </div>
      </div>

      {/* ЭТАП 1: За 3 недели до праздника (Подборки и гид по подаркам) */}
      {activeStage === "stage1_collections" && (
        <div
          style={{
            padding: "24px 28px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #f0f9ff 0%, #ffffff 100%)",
            border: "1px solid #bae6fd",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "3px 10px",
                borderRadius: "var(--radius-full)",
                background: "#e0f2fe",
                color: "#0284c7",
                fontSize: "0.75rem",
                fontWeight: 800,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              <Gift size={14} />
              {language === "es" ? "Guía Oficial de Regalos Festivos" : "Official Holiday Gift Guide"}
            </div>
            <h3 style={{ fontSize: "1.3rem", color: "#0f172a", fontWeight: 800, marginBottom: "4px" }}>
              {language === "es"
                ? "Encuentra el regalo perfecto por presupuesto o categoría"
                : "Find the perfect holiday gift by budget and collection"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {language === "es"
                ? "Ideas seleccionadas: Audio Hi-Res, espacio de trabajo ergonómico y hogar inteligente."
                : "Curated selections: Hi-Res audio, ergonomic desk accessories, and smart home tech."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/products"
              className="btn-primary"
              style={{ padding: "10px 18px", fontSize: "0.88rem" }}
            >
              <Sparkles size={16} /> {language === "es" ? "Ver Guía de Regalos" : "Browse Gift Ideas"}
            </Link>
            <Link
              href="/gift-cards"
              className="btn-secondary"
              style={{ padding: "10px 18px", fontSize: "0.88rem" }}
            >
              {language === "es" ? "Cheque Regalo" : "Gift Cards"}
            </Link>
          </div>
        </div>
      )}

      {/* ЭТАП 2: За 1 неделю до праздника (Срочная доставка из Валенсии/Кастельона) */}
      {activeStage === "stage2_fast_delivery" && (
        <div
          style={{
            padding: "24px 28px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)",
            border: "1px solid #fed7aa",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                background: "#fff7ed",
                color: "#c2410c",
                fontSize: "0.78rem",
                fontWeight: 800,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <Truck size={14} />
              {language === "es" ? "Entrega Garantizada Antes del Puente" : "Guaranteed Delivery Before the Holiday"}
            </div>
            <h3 style={{ fontSize: "1.35rem", color: "#0f172a", marginBottom: "6px", fontWeight: 900 }}>
              {language === "es"
                ? "Pídelo hoy y recíbelo antes del puente — Envío 24/48h desde Castellón/Valencia"
                : "Order today, receive before the holiday — 24/48h delivery from Castellón/Valencia"}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#047857", fontWeight: 700 }}>
                <CheckCircle2 size={15} /> {language === "es" ? "Stock en almacén local" : "In local warehouse"}
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#c2410c", fontWeight: 700 }}>
                <Clock size={15} /> {language === "es" ? "Pide antes de las 17:00 para salida hoy" : "Order before 17:00 for same-day dispatch"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/products"
              className="btn-accent"
              style={{ padding: "12px 22px", fontSize: "0.92rem" }}
            >
              <Zap size={16} /> {language === "es" ? "Comprar con Envío 24h" : "Shop 24h Delivery"} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* ЭТАП 3: За 2 дня до праздника (Электронные подарочные карты / Cheque Regalo) */}
      {activeStage === "stage3_gift_cards" && (
        <div
          style={{
            padding: "24px 28px",
            borderRadius: "var(--radius-md)",
            background: "linear-gradient(135deg, #ecfdf5 0%, #ffffff 100%)",
            border: "1px solid #a7f3d0",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
          }}
        >
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                background: "#d1fae5",
                color: "#047857",
                fontSize: "0.78rem",
                fontWeight: 800,
                marginBottom: "8px",
                textTransform: "uppercase",
              }}
            >
              <Zap size={14} />
              {language === "es" ? "Regalo de Última Hora — Envío Inmediato" : "Last-Minute Gift — Instant Delivery"}
            </div>
            <h3 style={{ fontSize: "1.35rem", color: "#0f172a", marginBottom: "4px", fontWeight: 800 }}>
              {language === "es"
                ? "¿Llegas tarde para el envío físico? Regala un Cheque Regalo Digital"
                : "Too late for physical shipping? Send an Instant Digital Gift Card"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              {language === "es"
                ? "Entrega digital directa por email en 1 minuto con mensaje personalizado y sin fecha de caducidad."
                : "Instant email delivery in 1 minute with a personalized greeting and no expiration date."}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <Link
              href="/gift-cards"
              className="btn-primary"
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                padding: "12px 24px",
                fontSize: "0.92rem",
              }}
            >
              <CreditCard size={16} /> {language === "es" ? "Comprar Cheque Regalo" : "Buy Gift Card"} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
