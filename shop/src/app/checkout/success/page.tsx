"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Clock,
  Printer,
  ShieldCheck,
} from "lucide-react";

interface OrderData {
  orderId: string;
  customerName: string;
  email: string;
  total: string;
  itemCount: number;
  address: string;
  shippingMethod: string;
  paymentMethod: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "VG-849201";
  const [order, setOrder] = useState<OrderData | null>(null);

  const { language } = useCartStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  useEffect(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("last_order");
      if (stored) {
        try {
          setOrder(JSON.parse(stored));
        } catch {
          // Игнорируем ошибку парсинга
        }
      }
    }
  }, []);

  return (
    <div style={{ padding: "60px 0 100px" }}>
      <div className="container" style={{ maxWidth: "780px" }}>
        {/* Карточка успешного заказа */}
        <div
          style={{
            padding: "48px 36px",
            borderRadius: "var(--radius-lg)",
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            boxShadow: "var(--shadow-md)",
            textAlign: "center",
          }}
        >
          {/* Иконка успеха */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#ecfdf5",
              border: "2px solid #10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#047857",
              margin: "0 auto 24px",
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.2)",
            }}
          >
            <CheckCircle2 size={44} />
          </div>

          <span
            style={{
              fontSize: "0.85rem",
              color: "#047857",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {t.success.badge}
          </span>

          <h1 style={{ fontSize: "2.4rem", color: "var(--text-main)", fontWeight: 800, marginTop: "6px", marginBottom: "12px" }}>
            {t.success.title}
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", lineHeight: 1.5, marginBottom: "28px" }}>
            {t.success.message}: <strong style={{ color: "#0284c7" }}>#{orderId}</strong>.{" "}
            {language === "es"
              ? "Hemos enviado el resumen y seguimiento a "
              : "Order confirmation and tracking details sent to "}
            <strong style={{ color: "var(--text-main)" }}>{order?.email || "su email"}</strong>.
          </p>

          {/* Таймлайн статуса */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "24px",
              marginBottom: "32px",
              textAlign: "left",
            }}
          >
            <h3 style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={18} color="#0284c7" /> {t.success.timelineTitle}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "16px",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#047857", fontWeight: 700, fontSize: "0.88rem" }}>
                  <CheckCircle2 size={16} /> {t.success.paid}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)" }}>{language === "es" ? "Confirmado" : "Confirmed"}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0284c7", fontWeight: 700, fontSize: "0.88rem" }}>
                  <Package size={16} /> {t.success.packing}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)" }}>Valencia Hub</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.88rem" }}>
                  <Truck size={16} /> {t.success.dispatch}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)" }}>Correos / SEUR</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontWeight: 600, fontSize: "0.88rem" }}>
                  <ShieldCheck size={16} /> {t.success.delivery}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)" }}>24-48h</div>
              </div>
            </div>
          </div>

          {/* Детали заказа */}
          {order && (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                marginBottom: "32px",
                textAlign: "left",
                fontSize: "0.9rem",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>{t.success.recipient}</span>
                <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{order.customerName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>{t.success.address}</span>
                <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{order.address}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>{t.success.totalPaid}</span>
                <span style={{ color: "#0284c7", fontWeight: 800 }}>€{order.total}</span>
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
            <Link href="/products" className="btn-primary" style={{ padding: "14px 28px" }}>
              {t.success.continueShopping} <ArrowRight size={18} />
            </Link>
            <button
              onClick={() => window.print()}
              className="btn-secondary"
              style={{ padding: "14px 20px" }}
            >
              <Printer size={18} /> {t.success.printReceipt}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: "80px 0", textAlign: "center" }}>Cargando...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
