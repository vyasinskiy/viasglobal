"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  Truck,
  CheckCircle2,
} from "lucide-react";

/**
 * Выдвижная панель корзины (Cart Drawer) с переводами (ES / EN)
 */
export const CartDrawer = () => {
  const {
    language,
    items,
    isCartDrawerOpen,
    setCartDrawerOpen,
    removeItem,
    updateQuantity,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    getSubtotal,
    getDiscountAmount,
    getShippingCost,
    getTotalAmount,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  // Закрытие по Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartDrawerOpen) {
        setCartDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCartDrawerOpen, setCartDrawerOpen]);

  if (!isCartDrawerOpen) return null;

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const shipping = getShippingCost();
  const total = getTotalAmount();

  const freeShippingThreshold = 50;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const result = applyCoupon(couponInput);
    setCouponFeedback({
      text: result.message,
      isError: !result.success,
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* Затемнение фона */}
      <div
        onClick={() => setCartDrawerOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(6px)",
          animation: "fadeIn 0.2s ease-out",
        }}
      />

      {/* Панель корзины */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          background: "#0f172a",
          borderLeft: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-10px 0 40px rgba(0, 0, 0, 0.7)",
          zIndex: 2001,
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Шапка корзины */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingBag size={22} color="#38bdf8" />
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              {t.cart.drawerTitle} ({items.reduce((s, i) => s + i.quantity, 0)})
            </h2>
          </div>
          <button
            onClick={() => setCartDrawerOpen(false)}
            className="btn-icon"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Прогресс-бар бесплатной доставки */}
        <div
          style={{
            padding: "12px 24px",
            background: "rgba(2, 132, 199, 0.08)",
            borderBottom: "1px solid var(--border-color)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: remainingForFreeShipping === 0 ? "#34d399" : "#e2e8f0",
              marginBottom: "8px",
            }}
          >
            <Truck size={16} color={remainingForFreeShipping === 0 ? "#34d399" : "#38bdf8"} />
            {remainingForFreeShipping === 0 ? (
              <span>{t.cart.freeShippingUnlocked}</span>
            ) : (
              <span>
                {t.cart.freeShippingRemaining} <strong>€{remainingForFreeShipping.toFixed(2)}</strong> {language === "es" ? "más para envío gratis" : "more for free shipping"}
              </span>
            )}
          </div>
          <div
            style={{
              width: "100%",
              height: "6px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "3px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background:
                  remainingForFreeShipping === 0
                    ? "linear-gradient(90deg, #10b981, #34d399)"
                    : "linear-gradient(90deg, #0284c7, #38bdf8)",
                borderRadius: "3px",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Список товаров */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {items.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                padding: "40px 20px",
                color: "var(--text-muted)",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <ShoppingBag size={36} strokeWidth={1.5} />
              </div>
              <h3 style={{ color: "#fff", marginBottom: "8px", fontSize: "1.1rem" }}>
                {t.cart.emptyTitle}
              </h3>
              <p style={{ fontSize: "0.9rem", marginBottom: "20px" }}>
                {t.cart.emptyDesc}
              </p>
              <Link
                href="/products"
                onClick={() => setCartDrawerOpen(false)}
                className="btn-primary"
                style={{ width: "100%" }}
              >
                {t.cart.goToCatalog}
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const productTitle = item.product.title[language] || item.product.title.es;
              return (
                <div
                  key={item.product.id}
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {/* Изображение */}
                  <div
                    style={{
                      position: "relative",
                      width: "72px",
                      height: "72px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#1e293b",
                    }}
                  >
                    <Image
                      src={item.product.mainImage}
                      alt={productTitle}
                      fill
                      sizes="72px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  {/* Инфо и управление */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "8px",
                        }}
                      >
                        <Link
                          href={`/products/${item.product.id}`}
                          onClick={() => setCartDrawerOpen(false)}
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            lineHeight: "1.3",
                            color: "#fff",
                          }}
                        >
                          {productTitle}
                        </Link>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          style={{
                            color: "var(--text-subtle)",
                            padding: "4px",
                            transition: "color 0.2s",
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                        {item.product.brand} • SKU: {item.product.sku}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "10px",
                      }}
                    >
                      {/* Количество */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "6px",
                          padding: "2px 6px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{ padding: "4px", display: "flex", color: "#fff" }}
                          aria-label="Disminuir"
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, minWidth: "16px", textAlign: "center" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{ padding: "4px", display: "flex", color: "#fff" }}
                          aria-label="Aumentar"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Цена */}
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#38bdf8" }}>
                          €{(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Подвал корзины */}
        {items.length > 0 && (
          <div
            style={{
              padding: "20px 24px",
              borderTop: "1px solid var(--border-color)",
              background: "rgba(15, 23, 42, 0.95)",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {/* Ввод промокода */}
            <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "8px" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <input
                  type="text"
                  placeholder={t.cart.couponPlaceholder}
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponFeedback(null);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 12px 8px 32px",
                    fontSize: "0.85rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    color: "#fff",
                    textTransform: "uppercase",
                  }}
                />
                <Tag
                  size={14}
                  color="var(--text-muted)"
                  style={{ position: "absolute", left: "10px", top: "11px" }}
                />
              </div>
              <button
                type="submit"
                className="btn-secondary"
                style={{ padding: "8px 14px", fontSize: "0.85rem" }}
              >
                {t.cart.applyCoupon}
              </button>
            </form>

            {/* Статус промокода */}
            {couponFeedback && (
              <div
                style={{
                  fontSize: "0.8rem",
                  color: couponFeedback.isError ? "#ef4444" : "#10b981",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {couponFeedback.isError ? <X size={14} /> : <CheckCircle2 size={14} />}
                {couponFeedback.text}
              </div>
            )}

            {appliedCoupon && !couponFeedback && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 10px",
                  background: "rgba(16, 185, 129, 0.1)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  color: "#34d399",
                }}
              >
                <span>Código <strong>{appliedCoupon.code}</strong> (-{appliedCoupon.discountPercent}%)</span>
                <button
                  onClick={removeCoupon}
                  style={{ color: "#ef4444", fontSize: "0.75rem", textDecoration: "underline" }}
                >
                  {language === "es" ? "Eliminar" : "Remove"}
                </button>
              </div>
            )}

            {/* Итоговая калькуляция */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>{t.cart.subtotal}</span>
                <span>€{subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#34d399" }}>
                  <span>{t.cart.discount}</span>
                  <span>-€{discount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>{t.cart.shipping}</span>
                <span>{shipping === 0 ? (language === "es" ? "Gratis" : "Free") : `€${shipping.toFixed(2)}`}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#fff",
                  fontSize: "1.15rem",
                  fontWeight: 800,
                  marginTop: "6px",
                  paddingTop: "8px",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <span>{t.cart.total}</span>
                <span style={{ color: "#38bdf8" }}>€{total.toFixed(2)}</span>
              </div>
            </div>

            {/* Кнопка перехода к Checkout */}
            <Link
              href="/checkout"
              onClick={() => setCartDrawerOpen(false)}
              className="btn-primary"
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "1rem",
                justifyContent: "center",
              }}
            >
              {t.cart.checkoutBtn} <ArrowRight size={18} />
            </Link>

            <Link
              href="/cart"
              onClick={() => setCartDrawerOpen(false)}
              style={{
                textAlign: "center",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                textDecoration: "underline",
              }}
            >
              {t.cart.fullCartLink}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
