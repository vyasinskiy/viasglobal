"use client";

import { useState, useEffect } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/types";

interface Props {
  products: Product[];
  initialCount?: number;
  step?: number;
}

export function ProductGridWithLoadMore({ products, initialCount = 24, step = 24 }: Props) {
  const { language } = useCartStore();
  const [visibleCount, setVisibleCount] = useState(initialCount);

  // Сбрасываем пагинацию при изменении списка товаров (например, при фильтрации)
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [products, initialCount]);

  const visibleProducts = products.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + step);
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "24px",
        }}
      >
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {visibleCount < products.length && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "40px" }}>
          <button
            onClick={handleLoadMore}
            style={{
              padding: "12px 28px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "var(--radius-md, 8px)",
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "#0f172a",
              cursor: "pointer",
              boxShadow: "var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.borderColor = "#94a3b8";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            {language === "es" ? "Cargar más productos" : "Load more products"}
          </button>
        </div>
      )}
    </>
  );
}
