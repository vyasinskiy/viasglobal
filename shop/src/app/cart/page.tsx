"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  Tag,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  X,
} from "lucide-react";

/**
 * Страница полной корзины товаров (Cart Page) в светлой теме с переводами (ES / EN)
 */
export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; isError: boolean } | null>(null);

  const {
    language,
    items,
    removeItem,
    updateQuantity,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscountAmount,
    getShippingCost,
    getTotalAmount,
  } = useCartStore();

  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
        {language === "es" ? "Cargando carrito..." : "Loading cart..."}
      </div>
    );
  }

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const shipping = getShippingCost();
  const total = getTotalAmount();

  const freeShippingThreshold = 50;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFree = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const res = applyCoupon(couponCode);
    setFeedback({ text: res.message, isError: !res.success });
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container">
        {/* Заголовок страницы */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0284c7", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase" }}>
            <ShoppingBag size={16} /> {language === "es" ? "Proceso de compra" : "Shopping Process"}
          </div>
          <h1 style={{ fontSize: "2.3rem", color: "var(--text-main)", fontWeight: 800, marginTop: "4px" }}>
            {language === "es" ? "Cesta de la compra" : "Shopping Cart"}
          </h1>
        </div>

        {items.length === 0 ? (
          <div
            style={{
              padding: "60px 24px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-subtle)",
                marginBottom: "20px",
              }}
            >
              <ShoppingBag size={40} />
            </div>
            <h2 style={{ fontSize: "1.5rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "10px" }}>
              {t.cart.emptyTitle}
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: "450px", marginBottom: "28px", fontSize: "1rem" }}>
              {t.cart.emptyDesc}
            </p>
            <Link href="/products" className="btn-primary" style={{ padding: "14px 28px", fontSize: "1rem" }}>
              {t.cart.goToCatalog} <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "36px",
              alignItems: "start",
            }}
          >
            {/* Левая колонка: Список товаров */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Баннер бесплатной доставки */}
              <div
                style={{
                  padding: "16px 20px",
                  background: "#f0f9ff",
                  border: "1px solid #bae6fd",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.88rem",
                    fontWeight: 700,
                    color: remainingForFree === 0 ? "#047857" : "#0369a1",
                    marginBottom: "10px",
                  }}
                >
                  <Truck size={18} color={remainingForFree === 0 ? "#047857" : "#0284c7"} />
                  {remainingForFree === 0 ? (
                    <span>{t.cart.freeShippingUnlocked}</span>
                  ) : (
                    <span>
                      {t.cart.freeShippingRemaining} <strong>€{remainingForFree.toFixed(2)}</strong> {language === "es" ? "más para envío gratis en España" : "more for free delivery in Spain"}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#e2e8f0",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${progressPercent}%`,
                      height: "100%",
                      background:
                        remainingForFree === 0
                          ? "linear-gradient(90deg, #10b981, #059669)"
                          : "linear-gradient(90deg, #0284c7, #38bdf8)",
                      borderRadius: "4px",
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
              </div>

              {/* Список товаров */}
              <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "20px", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {items.map((item) => {
                    const productTitle = item.product.title[language] || item.product.title.es;
                    return (
                      <div
                        key={item.product.id}
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "16px",
                          paddingBottom: "16px",
                          borderBottom: "1px solid var(--border-color)",
                        }}
                      >
                        {/* Картинка и Название */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 260px" }}>
                          <div
                            style={{
                              position: "relative",
                              width: "80px",
                              height: "80px",
                              borderRadius: "10px",
                              overflow: "hidden",
                              background: "#f1f5f9",
                              border: "1px solid var(--border-color)",
                              flexShrink: 0,
                            }}
                          >
                            <Image
                              src={item.product.mainImage}
                              alt={productTitle}
                              fill
                              sizes="80px"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 800, textTransform: "uppercase" }}>
                              {item.product.brand}
                            </span>
                            <Link
                              href={`/products/${item.product.id}`}
                              style={{ display: "block", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-main)", marginTop: "2px" }}
                            >
                              {productTitle}
                            </Link>
                            <div style={{ fontSize: "0.78rem", color: "var(--text-subtle)", marginTop: "4px" }}>
                              Ref: {item.product.sku}
                            </div>
                          </div>
                        </div>

                        {/* Количество */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "#f8fafc",
                            borderRadius: "8px",
                            padding: "4px 10px",
                            border: "1px solid var(--border-color)",
                          }}
                        >
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            style={{ color: "var(--text-main)", display: "flex" }}
                            aria-label="Disminuir"
                          >
                            <Minus size={14} />
                          </button>
                          <span style={{ fontSize: "0.95rem", fontWeight: 800, minWidth: "20px", textAlign: "center", color: "var(--text-main)" }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            style={{ color: "var(--text-main)", display: "flex" }}
                            aria-label="Aumentar"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        {/* Цена и Удаление */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0284c7" }}>
                              €{(item.product.price * item.quantity).toFixed(2)}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
                              €{item.product.price.toFixed(2)} / ud
                            </div>
                          </div>

                          <button
                            onClick={() => removeItem(item.product.id)}
                            style={{ color: "var(--text-subtle)", padding: "6px" }}
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Действия под списком */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingTop: "16px",
                  }}
                >
                  <Link
                    href="/products"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.9rem",
                      color: "#0284c7",
                      fontWeight: 700,
                    }}
                  >
                    <ArrowLeft size={16} /> {t.cart.continueShopping}
                  </Link>

                  <button
                    onClick={clearCart}
                    style={{
                      fontSize: "0.85rem",
                      color: "#dc2626",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {t.cart.clearCart}
                  </button>
                </div>
              </div>
            </div>

            {/* Правая колонка: Итоговый расчет */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  background: "#ffffff",
                  border: "1px solid #bae6fd",
                  padding: "24px",
                  borderRadius: "var(--radius-md)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <h2 style={{ fontSize: "1.25rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "18px" }}>
                  {language === "es" ? "Resumen de compra" : "Order Summary"}
                </h2>

                {/* Ввод промокода */}
                <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="text"
                      placeholder={t.cart.couponPlaceholder}
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value);
                        setFeedback(null);
                      }}
                      style={{
                        width: "100%",
                        padding: "10px 12px 10px 34px",
                        fontSize: "0.88rem",
                        background: "#f8fafc",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-main)",
                        textTransform: "uppercase",
                      }}
                    />
                    <Tag size={16} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "12px" }} />
                  </div>
                  <button type="submit" className="btn-secondary" style={{ padding: "10px 16px", fontSize: "0.88rem" }}>
                    {t.cart.applyCoupon}
                  </button>
                </form>

                {/* Сообщение промокода */}
                {feedback && (
                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: feedback.isError ? "#dc2626" : "#059669",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "16px",
                      fontWeight: 600,
                    }}
                  >
                    {feedback.isError ? <X size={14} /> : <CheckCircle2 size={14} />}
                    {feedback.text}
                  </div>
                )}

                {appliedCoupon && !feedback && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      color: "#047857",
                      marginBottom: "16px",
                      fontWeight: 600,
                    }}
                  >
                    <span>Código <strong>{appliedCoupon.code}</strong> (-{appliedCoupon.discountPercent}%)</span>
                    <button onClick={removeCoupon} style={{ color: "#dc2626", fontSize: "0.8rem", textDecoration: "underline" }}>
                      {language === "es" ? "Eliminar" : "Remove"}
                    </button>
                  </div>
                )}

                {/* Список сумм */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.92rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>{t.cart.subtotal}</span>
                    <span style={{ color: "var(--text-main)", fontWeight: 600 }}>€{subtotal.toFixed(2)}</span>
                  </div>

                  {discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", color: "#047857", fontWeight: 600 }}>
                      <span>{t.cart.discount} ({appliedCoupon?.code}):</span>
                      <span>-€{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                    <span>{t.cart.shipping}</span>
                    <span style={{ color: shipping === 0 ? "#047857" : "var(--text-main)", fontWeight: 600 }}>
                      {shipping === 0 ? (language === "es" ? "Gratis" : "Free") : `€${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-subtle)", fontSize: "0.82rem" }}>
                    <span>{t.cart.taxIncluded}</span>
                    <span>€{((subtotal - discount) * 0.21 / 1.21).toFixed(2)}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "var(--text-main)",
                      fontSize: "1.35rem",
                      fontWeight: 800,
                      marginTop: "10px",
                      paddingTop: "14px",
                      borderTop: "1px solid var(--border-color)",
                    }}
                  >
                    <span>{t.cart.total}</span>
                    <span style={{ color: "#0284c7" }}>€{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Кнопка оформления */}
                <Link
                  href="/checkout"
                  className="btn-primary"
                  style={{
                    width: "100%",
                    padding: "16px",
                    fontSize: "1.05rem",
                    justifyContent: "center",
                    marginTop: "24px",
                  }}
                >
                  {t.cart.checkoutBtn} <ArrowRight size={18} />
                </Link>
              </div>

              {/* Гарантии */}
              <div style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "20px", borderRadius: "var(--radius-md)", fontSize: "0.85rem", color: "var(--text-muted)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <ShieldCheck size={18} color="#047857" />
                  <span>{language === "es" ? "Pago seguro con cifrado SSL 256-bit" : "256-bit SSL encrypted secure checkout"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <RotateCcw size={18} color="#b45309" />
                  <span>{language === "es" ? "30 días de garantía de devolución" : "30-day money back guarantee"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Truck size={18} color="#0284c7" />
                  <span>{language === "es" ? "Envío en 24h por SEUR / Correos Express" : "24h dispatch via SEUR / DHL Express"}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
