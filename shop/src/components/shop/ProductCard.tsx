"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { TRANSLATIONS } from "@/i18n/translations";
import { ShoppingBag, Heart, Star, Check, Sparkles } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

/**
 * Карточка товара с поддержкой мультиязычности (ES / EN)
 */
export const ProductCard = ({ product }: ProductCardProps) => {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const { language, addItem, toggleWishlist, isInWishlist } = useCartStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  useEffect(() => {
    setMounted(true);
  }, []);

  const inWishlist = mounted ? isInWishlist(product.id) : false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productTitle = product.title[language] || product.title.es;
  const productShortDesc = product.shortDescription[language] || product.shortDescription.es;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-6px)" : "translateY(0)",
        borderColor: isHovered ? "var(--border-glow)" : "var(--border-color)",
        boxShadow: isHovered ? "var(--shadow-lg), var(--shadow-glow)" : "var(--shadow-sm)",
      }}
    >
      {/* Верхний контейнер изображения и бейджей */}
      <Link
        href={`/products/${product.id}`}
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "75%",
          background: "#151e2e",
          overflow: "hidden",
          display: "block",
        }}
      >
        <Image
          src={product.mainImage}
          alt={productTitle}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{
            objectFit: "cover",
            transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isHovered ? "scale(1.08)" : "scale(1)",
          }}
        />

        {/* Бейджи (Top Ventas / Novedad / Descuento) */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 2,
          }}
        >
          {product.isBestseller && (
            <span className="badge badge-bestseller">
              <Sparkles size={12} /> {t.productCard.bestseller}
            </span>
          )}
          {product.isNew && <span className="badge badge-new">{t.productCard.new}</span>}
          {discountPercent > 0 && (
            <span className="badge badge-discount">-{discountPercent}%</span>
          )}
        </div>

        {/* Кнопка избранного */}
        <button
          onClick={handleWishlist}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: inWishlist ? "#ef4444" : "#ffffff",
            transition: "all 0.2s ease",
            zIndex: 2,
          }}
          aria-label="Añadir a favoritos"
        >
          <Heart size={18} fill={inWishlist ? "#ef4444" : "none"} />
        </button>
      </Link>

      {/* Описание и цена */}
      <div
        style={{
          padding: "18px",
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "space-between",
        }}
      >
        <div>
          {/* Бренд и рейтинг */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "0.8rem",
            }}
          >
            <span style={{ color: "var(--text-subtle)", fontWeight: 600, textTransform: "uppercase" }}>
              {product.brand}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#fbbf24" }}>
              <Star size={14} fill="#fbbf24" />
              <span style={{ color: "#fff", fontWeight: 700 }}>{product.rating}</span>
              <span style={{ color: "var(--text-subtle)" }}>({product.reviewCount})</span>
            </div>
          </div>

          {/* Заголовок */}
          <Link href={`/products/${product.id}`}>
            <h3
              style={{
                fontSize: "1.05rem",
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.35,
                marginBottom: "8px",
                transition: "color 0.2s ease",
              }}
            >
              {productTitle}
            </h3>
          </Link>

          {/* Краткое описание */}
          <p
            style={{
              fontSize: "0.85rem",
              color: "var(--text-muted)",
              lineHeight: 1.45,
              marginBottom: "16px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {productShortDesc}
          </p>
        </div>

        {/* Нижний блок: цена и кнопка добавления */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "14px",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#38bdf8" }}>
                €{product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-subtle)",
                    textDecoration: "line-through",
                  }}
                >
                  €{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-subtle)" }}>
              {t.productCard.vatIncluded}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="btn-primary"
            style={{
              padding: "10px 14px",
              fontSize: "0.85rem",
              background: justAdded
                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                : undefined,
            }}
            aria-label={t.productCard.addToCart}
          >
            {justAdded ? (
              <>
                <Check size={16} /> {t.productCard.added}
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> {t.productCard.addToCart}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
