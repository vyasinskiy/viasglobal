import { Suspense } from "react";
import { getStoreProducts } from "@/lib/products";
import { CatalogClient } from "@/components/shop/CatalogClient";

// Принудительный динамический рендеринг для актуальных данных из базы
export const dynamic = "force-dynamic";

/**
 * Серверная страница каталога товаров Viasglobal Store
 * Сервер сразу загружает все 100 товаров из базы данных Supabase и передает их клиенту
 */
export default async function ProductsPage() {
  const products = await getStoreProducts();

  return (
    <Suspense
      fallback={
        <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
          Cargando catálogo...
        </div>
      }
    >
      <CatalogClient initialProducts={products} />
    </Suspense>
  );
}
