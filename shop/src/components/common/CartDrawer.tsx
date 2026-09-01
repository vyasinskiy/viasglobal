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
 * Выдвижная панель корзины (Cart Drawer) в светлой теме с переводами (ES / EN)
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
          background: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(4px)",
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
          background: "#ffffff",
          borderLeft: "1px solid var(--border-color)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.15)",
          zIndex: 2001,
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Шапка корзины */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShoppingBag size={22} color="#0284c7" />
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-main)" }}>
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
            background: "#f0f9ff",
            borderBottom: "1px solid #bae6fd",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              fontWeight: 700,
              color: remainingForFreeShipping === 0 ? "#047857" : "#0369a1",
              marginBottom: "8px",
            }}
          >
            <Truck size={16} color={remainingForFreeShipping === 0 ? "#047857" : "#0284c7"} />
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
              background: "#e2e8f0",
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
                    ? "linear-gradient(90deg, #10b981, #059669)"
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
            gap: "14px",
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
                  background: "#f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                  color: "var(--text-subtle)",
                }}
              >
                <ShoppingBag size={36} strokeWidth={1.5} />
              </div>
              <h3 style={{ color: "var(--text-main)", marginBottom: "8px", fontSize: "1.1rem", fontWeight: 700 }}>
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
                    background: "#f8fafc",
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
                      background: "#ffffff",
                      border: "1px solid var(--border-color)",
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
                            fontWeight: 700,
                            lineHeight: "1.3",
                            color: "var(--text-main)",
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
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                        {item.product.brand} • SKU: {item.product.sku}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "8px",
                      }}
                    >
                      {/* Количество */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#ffffff",
                          borderRadius: "6px",
                          padding: "2px 6px",
                          border: "1px solid var(--border-color)",
                        }}
                      >
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          style={{ padding: "4px", display: "flex", color: "var(--text-main)" }}
                          aria-label="Disminuir"
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, minWidth: "16px", textAlign: "center", color: "var(--text-main)" }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          style={{ padding: "4px", display: "flex", color: "var(--text-main)" }}
                          aria-label="Aumentar"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Цена */}
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0284c7" }}>
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
              padding: "18px 24px",
              borderTop: "1px solid var(--border-color)",
              background: "#ffffff",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
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
                    background: "#f8fafc",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-main)",
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
                  color: couponFeedback.isError ? "#dc2626" : "#059669",
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
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  color: "#047857",
                  fontWeight: 600,
                }}
              >
                <span>Código <strong>{appliedCoupon.code}</strong> (-{appliedCoupon.discountPercent}%)</span>
                <button
                  onClick={removeCoupon}
                  style={{ color: "#dc2626", fontSize: "0.75rem", textDecoration: "underline" }}
                >
                  {language === "es" ? "Eliminar" : "Remove"}
                </button>
              </div>
            )}

            {/* Итоговая калькуляция */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.88rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>{t.cart.subtotal}</span>
                <span style={{ color: "var(--text-main)", fontWeight: 600 }}>€{subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#047857", fontWeight: 600 }}>
                  <span>{t.cart.discount}</span>
                  <span>-€{discount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                <span>{t.cart.shipping}</span>
                <span style={{ color: shipping === 0 ? "#047857" : "var(--text-main)", fontWeight: 600 }}>
                  {shipping === 0 ? (language === "es" ? "Gratis" : "Free") : `€${shipping.toFixed(2)}`}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-main)",
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  marginTop: "6px",
                  paddingTop: "8px",
                  borderTop: "1px solid var(--border-color)",
                }}
              >
                <span>{t.cart.total}</span>
                <span style={{ color: "#0284c7" }}>€{total.toFixed(2)}</span>
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
