import { useState, useEffect } from "react";
import { PRODUCTS_DATA } from "@/data/products";
import { Product, ProductCategory } from "@/types";

/**
 * Хук для реактивной загрузки товаров из базы данных Supabase
 * с мгновенным начальным отображением PRODUCTS_DATA (без мигания страницы)
 */
export function useProducts(category?: ProductCategory, tag?: string) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (category && category !== "all") {
      params.append("category", category);
    }
    if (tag && tag.trim()) {
      params.append("tag", tag.trim().toLowerCase());
    }

    const qs = params.toString();
    const url = qs ? `/api/products?${qs}` : "/api/products";

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, tag]);

  return { products, loading };
}
