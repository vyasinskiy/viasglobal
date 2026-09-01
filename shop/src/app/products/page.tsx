"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PRODUCTS_DATA } from "@/data/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductFilter } from "@/components/shop/ProductFilter";
import { ProductCategory, Product } from "@/types";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Search, Sparkles } from "lucide-react";

/**
 * Внутренний компонент каталога с мультиязычной поддержкой (ES / EN) в светлой теме
 */
function CatalogContent() {
  const searchParams = useSearchParams();
  const initialCategory = (searchParams.get("category") as ProductCategory) || "all";
  const initialSearch = searchParams.get("search") || "";
  const filterType = searchParams.get("filter") || "";

  const [category, setCategory] = useState<ProductCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [showWishlistOnly, setShowWishlistOnly] = useState<boolean>(filterType === "wishlist");

  const { language, wishlist } = useCartStore();

  useEffect(() => {
    if (searchParams.get("category")) {
      setCategory(searchParams.get("category") as ProductCategory);
    }
    if (searchParams.get("search")) {
      setSearchQuery(searchParams.get("search") || "");
    }
    if (searchParams.get("filter") === "wishlist") {
      setShowWishlistOnly(true);
    } else if (searchParams.get("filter") === "bestsellers") {
      setSortBy("rating");
    }
  }, [searchParams]);

  // Фильтрация товаров с учетом выбранного языка
  const filteredProducts = useMemo(() => {
    let result: Product[] = [...PRODUCTS_DATA];

    if (showWishlistOnly) {
      result = result.filter((p) => wishlist.includes(p.id));
    }

    if (category !== "all") {
      result = result.filter((p) => p.category === category);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        const titleEs = p.title.es.toLowerCase();
        const titleEn = p.title.en.toLowerCase();
        const descEs = p.description.es.toLowerCase();
        const descEn = p.description.en.toLowerCase();
        const brand = p.brand.toLowerCase();
        const sku = p.sku.toLowerCase();
        return (
          titleEs.includes(q) ||
          titleEn.includes(q) ||
          descEs.includes(q) ||
          descEn.includes(q) ||
          brand.includes(q) ||
          sku.includes(q)
        );
      });
    }

    if (inStockOnly) {
      result = result.filter((p) => p.inStock && p.stockCount > 0);
    }

    if (sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [category, searchQuery, inStockOnly, sortBy, showWishlistOnly, wishlist]);

  const handleResetFilters = () => {
    setCategory("all");
    setSearchQuery("");
    setSortBy("featured");
    setInStockOnly(false);
    setShowWishlistOnly(false);
  };

  const t = {
    wishlistBadge: language === "es" ? "Lista de Deseos" : "Wishlist",
    wishlistTitle: language === "es" ? "Tus Productos Favoritos" : "Your Saved Products",
    wishlistSubtitle:
      language === "es"
        ? "Artículos guardados para comprar más adelante."
        : "Items you have saved for later purchase.",
    catalogBadge: language === "es" ? "Catálogo Oficial" : "Official Catalog",
    catalogTitleAll: language === "es" ? "Todos los productos" : "All Products",
    catalogSubtitle:
      language === "es"
        ? "Electrónica original, hogar inteligente y accesorios ergonómicos en España."
        : "Original tech, smart home gear, and ergonomic workspace accessories in Spain.",
    noProductsTitle: language === "es" ? "No se han encontrado productos" : "No products found",
    noProductsDesc:
      language === "es"
        ? "No hay resultados para los filtros seleccionados. Prueba a modificar los términos de búsqueda o restablecer los filtros."
        : "No products match your current filters. Try changing your search query or reset filters.",
    resetBtn: language === "es" ? "Restablecer filtros" : "Reset all filters",
  };

  return (
    <div style={{ padding: "40px 0 80px" }}>
      <div className="container">
        {/* Заголовок страницы */}
        <div style={{ marginBottom: "28px" }}>
          {showWishlistOnly ? (
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#dc2626", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase" }}>
                {t.wishlistBadge}
              </div>
              <h1 style={{ fontSize: "2.3rem", color: "var(--text-main)", fontWeight: 800, marginTop: "4px" }}>{t.wishlistTitle}</h1>
              <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "1rem" }}>
                {t.wishlistSubtitle}
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#0284c7", fontSize: "0.82rem", fontWeight: 800, textTransform: "uppercase" }}>
                <Sparkles size={16} /> {t.catalogBadge}
              </div>
              <h1 style={{ fontSize: "2.3rem", color: "var(--text-main)", fontWeight: 800, marginTop: "4px" }}>
                {category === "all" ? t.catalogTitleAll : `${language === "es" ? "Categoría:" : "Category:"} ${category}`}
              </h1>
              <p style={{ color: "var(--text-muted)", marginTop: "4px", fontSize: "1rem" }}>
                {t.catalogSubtitle}
              </p>
            </div>
          )}
        </div>

        {/* Панель фильтрации */}
        <ProductFilter
          selectedCategory={category}
          onSelectCategory={(cat) => {
            setCategory(cat);
            setShowWishlistOnly(false);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          inStockOnly={inStockOnly}
          onToggleInStock={() => setInStockOnly(!inStockOnly)}
          onResetFilters={handleResetFilters}
          totalFound={filteredProducts.length}
        />

        {/* Сетка товаров */}
        {filteredProducts.length === 0 ? (
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
                width: "70px",
                height: "70px",
                borderRadius: "50%",
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-subtle)",
                marginBottom: "20px",
              }}
            >
              <Search size={32} />
            </div>
            <h3 style={{ fontSize: "1.3rem", color: "var(--text-main)", fontWeight: 800, marginBottom: "8px" }}>
              {t.noProductsTitle}
            </h3>
            <p style={{ color: "var(--text-muted)", maxWidth: "450px", marginBottom: "24px", fontSize: "0.95rem" }}>
              {t.noProductsDesc}
            </p>
            <button onClick={handleResetFilters} className="btn-primary">
              {t.resetBtn}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "24px",
            }}
          >
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
          Cargando catálogo...
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
