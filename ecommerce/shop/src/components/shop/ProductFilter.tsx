"use client";

import { ProductCategory } from "@/types";
import { CATEGORIES_CONFIG } from "@/data/products";
import { useCartStore } from "@/store/cartStore";
import { Search, SlidersHorizontal, RotateCcw } from "lucide-react";

interface ProductFilterProps {
  selectedCategory: ProductCategory;
  onSelectCategory: (cat: ProductCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  inStockOnly: boolean;
  onToggleInStock: () => void;
  onResetFilters: () => void;
  totalFound: number;
}

/**
 * Фильтр и панель управления каталогом товаров в светлой теме (ES / EN)
 */
export const ProductFilter = ({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  inStockOnly,
  onToggleInStock,
  onResetFilters,
  totalFound,
}: ProductFilterProps) => {
  const { language } = useCartStore();

  const labels = {
    searchPlaceholder:
      language === "es"
        ? "Buscar por nombre, marca o descripción..."
        : "Search by title, brand or description...",
    sortFeatured: language === "es" ? "Destacados primero" : "Featured first",
    sortPriceAsc: language === "es" ? "Precio: Menor a Mayor" : "Price: Low to High",
    sortPriceDesc: language === "es" ? "Precio: Mayor a Menor" : "Price: High to Low",
    sortRating: language === "es" ? "Mejor valorados" : "Customer Rating",
    inStockOnly: language === "es" ? "Solo en stock" : "In Stock Only",
    reset: language === "es" ? "Restablecer" : "Reset",
    category: language === "es" ? "Categoría:" : "Category:",
    found: language === "es" ? "Productos encontrados:" : "Products found:",
  };

  return (
    <div
      style={{
        padding: "20px",
        background: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      {/* Верхний ряд: Поиск, Сортировка и Сброс */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {/* Поле поиска */}
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <input
            type="text"
            placeholder={labels.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              fontSize: "0.9rem",
              background: "#f8fafc",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-main)",
              outline: "none",
            }}
          />
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: "absolute", left: "12px", top: "13px" }}
          />
        </div>

        {/* Сортировка и переключатели */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <SlidersHorizontal size={16} color="var(--text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              style={{
                padding: "10px 14px",
                fontSize: "0.88rem",
                background: "#ffffff",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-main)",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="featured">{labels.sortFeatured}</option>
              <option value="price-asc">{labels.sortPriceAsc}</option>
              <option value="price-desc">{labels.sortPriceDesc}</option>
              <option value="rating">{labels.sortRating}</option>
            </select>
          </div>

          {/* Чекбокс только в наличии */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.88rem",
              color: "var(--text-main)",
              cursor: "pointer",
              userSelect: "none",
              fontWeight: 600,
            }}
          >
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={onToggleInStock}
              style={{ accentColor: "#0284c7", width: "16px", height: "16px" }}
            />
            {labels.inStockOnly}
          </label>

          {/* Сброс фильтров */}
          <button
            onClick={onResetFilters}
            className="btn-secondary"
            style={{ padding: "8px 14px", fontSize: "0.85rem", gap: "6px" }}
            title={labels.reset}
          >
            <RotateCcw size={14} /> {labels.reset}
          </button>
        </div>
      </div>

      {/* Нижний ряд: Категории (чипы) */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "8px",
          paddingTop: "16px",
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <span style={{ fontSize: "0.82rem", color: "var(--text-subtle)", fontWeight: 700, marginRight: "4px" }}>
          {labels.category}
        </span>
        {CATEGORIES_CONFIG.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const label = cat.label[language] || cat.label.es;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id as ProductCategory)}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.84rem",
                fontWeight: 700,
                background: isSelected ? "#0284c7" : "#f1f5f9",
                color: isSelected ? "#fff" : "var(--text-muted)",
                border: isSelected ? "1px solid #0284c7" : "1px solid var(--border-color)",
                transition: "all 0.2s ease",
              }}
            >
              {label}
            </button>
          );
        })}

        <div style={{ marginLeft: "auto", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {labels.found} <strong style={{ color: "var(--text-main)" }}>{totalFound}</strong>
        </div>
      </div>
    </div>
  );
};
