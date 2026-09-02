import { useState, useEffect } from "react";
import { PRODUCTS_DATA } from "@/data/products";
import { Product, ProductCategory } from "@/types";

/**
 * Хук для реактивной загрузки товаров из базы данных Supabase
 * с мгновенным начальным отображением PRODUCTS_DATA (без мигания страницы)
 */
export function useProducts(category?: ProductCategory) {
  const [products, setProducts] = useState<Product[]>(PRODUCTS_DATA);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let url = "/api/products";
    if (category && category !== "all") {
      url += `?category=${category}`;
    }

    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return { products, loading };
}
