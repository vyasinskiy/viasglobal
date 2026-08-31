"use client";

import { useState, use, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS_DATA } from "@/data/products";
import { useCartStore } from "@/store/cartStore";
import { ProductCard } from "@/components/shop/ProductCard";
import { TRANSLATIONS } from "@/i18n/translations";
import {
  ShoppingBag,
  Heart,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Share2,
  ArrowLeft,
  Sparkles,
  Plus,
  Minus,
} from "lucide-react";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Карточка товара (Product Detail Page) с переводами (ES / EN)
 */
export default function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const product = PRODUCTS_DATA.find((p) => p.id === id || p.slug === id);

  if (!product) {
    notFound();
  }

  const { language, addItem, toggleWishlist, isInWishlist } = useCartStore();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;

  const [selectedImage, setSelectedImage] = useState(product.mainImage);
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const inWishlist = mounted ? isInWishlist(product.id) : false;

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const relatedProducts = PRODUCTS_DATA.filter(
    (p) => p.id !== product.id && p.category === product.category
  ).slice(0, 3);

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productTitle = product.title[language] || product.title.es;
  const productDesc = product.description[language] || product.description.es;
  const productSpecs = product.specs[language] || product.specs.es;
  const productFeatures = product.features[language] || product.features.es;

  return (
    <div style={{ padding: "32px 0 80px" }}>
      <div className="container">
        {/* Хлебные крошки и возврат */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "0.88rem",
            color: "var(--text-muted)",
            marginBottom: "28px",
          }}
        >
          <Link
            href="/products"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "#38bdf8",
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={16} /> {t.productDetail.catalogBack}
          </Link>
          <span>/</span>
          <span style={{ textTransform: "capitalize" }}>{product.category}</span>
          <span>/</span>
          <span style={{ color: "#fff", fontWeight: 500 }}>{productTitle}</span>
        </div>

        {/* Главный блок товара */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "48px",
            marginBottom: "64px",
          }}
        >
          {/* Левая колонка: Галерея фото */}
          <div>
            <div
              className="glass-panel"
              style={{
                position: "relative",
                width: "100%",
                paddingTop: "80%",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                marginBottom: "16px",
                background: "#151e2e",
              }}
            >
              <Image
                src={selectedImage}
                alt={productTitle}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                style={{ objectFit: "cover" }}
              />

              {/* Бейджи */}
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  left: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                {product.isBestseller && (
                  <span className="badge badge-bestseller">
                    <Sparkles size={12} /> {t.productCard.bestseller}
                  </span>
                )}
                {product.isNew && <span className="badge badge-new">{t.productCard.new}</span>}
                {discountPercent > 0 && (
                  <span className="badge badge-discount">-{discountPercent}% {t.productCard.discount}</span>
                )}
              </div>
            </div>

            {/* Миниатюры */}
            {product.images.length > 1 && (
              <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
                {product.images.map((imgUrl, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(imgUrl)}
                    style={{
                      position: "relative",
                      width: "70px",
                      height: "70px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      border:
                        selectedImage === imgUrl
                          ? "2px solid #0284c7"
                          : "1px solid var(--border-color)",
                      opacity: selectedImage === imgUrl ? 1 : 0.6,
                      transition: "all 0.2s",
                      flexShrink: 0,
                    }}
                  >
                    <Image src={imgUrl} alt={`${productTitle} ${index}`} fill style={{ objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка: Информация и покупка */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              {/* Бренд, SKU, Рейтинг */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "8px",
                  fontSize: "0.85rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ color: "#38bdf8", fontWeight: 700, textTransform: "uppercase" }}>
                    {product.brand}
                  </span>
                  <span style={{ color: "var(--text-subtle)" }}>{t.productDetail.sku}: {product.sku}</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ display: "flex", color: "#fbbf24" }}>
                    <Star size={16} fill="#fbbf24" />
                  </div>
                  <span style={{ color: "#fff", fontWeight: 700 }}>{product.rating}</span>
                  <span style={{ color: "var(--text-muted)" }}>({product.reviewCount} {t.productDetail.reviews})</span>
                </div>
              </div>

              {/* Название товара */}
              <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.3rem)", lineHeight: 1.25, marginBottom: "12px" }}>
                {productTitle}
              </h1>

              {/* Наличие */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: product.inStock ? "#10b981" : "#ef4444",
                    boxShadow: product.inStock ? "0 0 8px #10b981" : "none",
                  }}
                />
                <span style={{ color: product.inStock ? "#34d399" : "#f87171", fontWeight: 600 }}>
                  {product.inStock ? `${t.productDetail.inStockCount} (${product.stockCount} uds)` : t.productDetail.outOfStock}
                </span>
              </div>
            </div>

            {/* Цена */}
            <div
              className="glass-panel"
              style={{
                padding: "20px",
                borderRadius: "var(--radius-md)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "2.2rem", fontWeight: 800, color: "#38bdf8" }}>
                    €{product.price.toFixed(2)}
                  </span>
                  {product.originalPrice && (
                    <span style={{ fontSize: "1.2rem", color: "var(--text-subtle)", textDecoration: "line-through" }}>
                      €{product.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  {t.productDetail.vatNote}
                </div>
              </div>

              {discountPercent > 0 && (
                <div
                  style={{
                    padding: "6px 12px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "8px",
                    color: "#f87171",
                    fontWeight: 700,
                    fontSize: "0.9rem",
                  }}
                >
                  {t.productDetail.savings} €{((product.originalPrice || 0) - product.price).toFixed(2)}
                </div>
              )}
            </div>

            {/* Описание товара */}
            <p style={{ color: "var(--text-muted)", lineHeight: 1.6, fontSize: "1rem" }}>
              {productDesc}
            </p>

            {/* Особенности модели */}
            <div>
              <h4 style={{ fontSize: "0.95rem", color: "#fff", marginBottom: "12px", textTransform: "uppercase" }}>
                {t.productDetail.featuresTitle}
              </h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
                {productFeatures.map((feature, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "0.92rem", color: "#e2e8f0" }}>
                    <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0, marginTop: "2px" }} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Добавление в корзину */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
              {/* Количество */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "rgba(255, 255, 255, 0.08)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 12px",
                  gap: "12px",
                }}
              >
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ color: "#fff", display: "flex" }}
                  aria-label="Disminuir"
                >
                  <Minus size={16} />
                </button>
                <span style={{ fontSize: "1.05rem", fontWeight: 700, minWidth: "24px", textAlign: "center" }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockCount, quantity + 1))}
                  style={{ color: "#fff", display: "flex" }}
                  aria-label="Aumentar"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Кнопка в корзину */}
              <button
                onClick={handleAddToCart}
                className="btn-primary"
                style={{ flex: "1 1 200px", padding: "14px 28px", fontSize: "1rem" }}
              >
                <ShoppingBag size={20} /> {t.productCard.addToCart} (€{(product.price * quantity).toFixed(2)})
              </button>

              {/* Избранное */}
              <button
                onClick={() => toggleWishlist(product.id)}
                className="btn-icon"
                style={{ width: "48px", height: "48px", color: inWishlist ? "#ef4444" : "currentColor" }}
                title="Favoritos"
              >
                <Heart size={20} fill={inWishlist ? "#ef4444" : "none"} />
              </button>

              {/* Поделиться */}
              <button
                onClick={handleShare}
                className="btn-icon"
                style={{ width: "48px", height: "48px" }}
                title={isCopied ? t.productDetail.shareCopied : "Compartir enlace"}
              >
                <Share2 size={20} color={isCopied ? "#34d399" : "currentColor"} />
              </button>
            </div>

            {/* Карточка гарантий */}
            <div
              className="glass-panel"
              style={{
                padding: "20px",
                borderRadius: "var(--radius-md)",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "16px",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Truck size={20} color="#38bdf8" />
                <span>{t.productDetail.dispatchBadge}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldCheck size={20} color="#34d399" />
                <span>{t.productDetail.warrantyBadge}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <RotateCcw size={20} color="#fbbf24" />
                <span>{t.productDetail.returnsBadge}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Таблица технических характеристик */}
        <div style={{ marginBottom: "64px" }}>
          <h2 style={{ fontSize: "1.6rem", marginBottom: "20px" }}>{t.productDetail.specsTitle}</h2>
          <div className="glass-panel" style={{ overflow: "hidden", borderRadius: "var(--radius-md)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
              <tbody>
                {Object.entries(productSpecs).map(([specKey, specVal], index) => (
                  <tr
                    key={specKey}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      background: index % 2 === 0 ? "rgba(255, 255, 255, 0.02)" : "transparent",
                    }}
                  >
                    <td style={{ padding: "14px 20px", color: "var(--text-muted)", width: "35%", fontWeight: 500 }}>
                      {specKey}
                    </td>
                    <td style={{ padding: "14px 20px", color: "#ffffff", fontWeight: 600 }}>
                      {specVal}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Отзывы покупателей */}
        <div style={{ marginBottom: "64px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "1.6rem" }}>{t.productDetail.reviewsTitle} ({product.reviews?.length || 0})</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Star size={18} fill="#fbbf24" color="#fbbf24" />
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{product.rating}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>/ 5.0</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev) => (
                <div key={rev.id} className="glass-panel" style={{ padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <div>
                      <h4 style={{ fontSize: "0.95rem", color: "#fff" }}>{rev.author}</h4>
                      {rev.verifiedPurchase && (
                        <span style={{ fontSize: "0.75rem", color: "#34d399", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckCircle2 size={12} /> {t.productDetail.verifiedPurchase}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", color: "#fbbf24" }}>
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} size={14} fill="#fbbf24" />
                      ))}
                    </div>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5 }}>
                    «{rev.comment[language] || rev.comment.es}»
                  </p>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-subtle)", marginTop: "12px" }}>
                    {rev.date}
                  </div>
                </div>
              ))
            ) : (
              <div className="glass-panel" style={{ padding: "24px", color: "var(--text-muted)" }}>
                {t.productDetail.noReviews}
              </div>
            )}
          </div>
        </div>

        {/* Похожие товары */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 style={{ fontSize: "1.6rem", marginBottom: "24px" }}>{t.productDetail.relatedTitle}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px" }}>
              {relatedProducts.map((relProduct) => (
                <ProductCard key={relProduct.id} product={relProduct} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
