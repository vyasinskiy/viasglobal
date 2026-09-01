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
 * Карточка товара в светлой теме с поддержкой мультиязычности (ES / EN)
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
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        background: "#ffffff",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--border-color)",
        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: isHovered ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
    >
      {/* Верхний контейнер изображения и бейджей */}
      <Link
        href={`/products/${product.id}`}
        style={{
          position: "relative",
          width: "100%",
          paddingTop: "75%",
          background: "#f1f5f9",
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
            transition: "transform 0.4s ease",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
          }}
        />

        {/* Бейджи (Top Ventas / Novedad / Descuento) */}
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
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
            top: "10px",
            right: "10px",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            boxShadow: "0 2px 6px rgba(15, 23, 42, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: inWishlist ? "#ef4444" : "var(--text-subtle)",
            transition: "all 0.2s ease",
            zIndex: 2,
          }}
          aria-label="Añadir a favoritos"
        >
          <Heart size={17} fill={inWishlist ? "#ef4444" : "none"} />
        </button>
      </Link>

      {/* Описание и цена */}
      <div
        style={{
          padding: "16px 18px 18px",
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
              marginBottom: "6px",
              fontSize: "0.78rem",
            }}
          >
            <span style={{ color: "var(--text-subtle)", fontWeight: 700, textTransform: "uppercase" }}>
              {product.brand}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#d97706" }}>
              <Star size={13} fill="#d97706" />
              <span style={{ color: "var(--text-main)", fontWeight: 700 }}>{product.rating}</span>
              <span style={{ color: "var(--text-subtle)" }}>({product.reviewCount})</span>
            </div>
          </div>

          {/* Заголовок */}
          <Link href={`/products/${product.id}`}>
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 700,
                color: isHovered ? "#0284c7" : "var(--text-main)",
                lineHeight: 1.35,
                marginBottom: "6px",
                transition: "color 0.2s ease",
              }}
            >
              {productTitle}
            </h3>
          </Link>

          {/* Краткое описание */}
          <p
            style={{
              fontSize: "0.84rem",
              color: "var(--text-muted)",
              lineHeight: 1.45,
              marginBottom: "14px",
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
            paddingTop: "12px",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0284c7" }}>
                €{product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-subtle)",
                    textDecoration: "line-through",
                  }}
                >
                  €{product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-subtle)" }}>
              {t.productCard.vatIncluded}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="btn-primary"
            style={{
              padding: "9px 14px",
              fontSize: "0.84rem",
              background: justAdded
                ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                : undefined,
            }}
            aria-label={t.productCard.addToCart}
          >
            {justAdded ? (
              <>
                <Check size={15} /> {t.productCard.added}
              </>
            ) : (
              <>
                <ShoppingBag size={15} /> {t.productCard.addToCart}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
