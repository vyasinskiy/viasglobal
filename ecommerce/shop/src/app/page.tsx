import { Suspense } from "react";
import { getStoreProducts } from "@/lib/products";
import { HomeClient } from "@/components/shop/HomeClient";

// Принудительный динамический рендеринг для отдачи актуальных товаров из базы данных Supabase
export const dynamic = "force-dynamic";

/**
 * Главная страница интернет-магазина Viasglobal Store (Server Component).
 * Загружает товары из базы данных прямо на сервере и передает их в клиентский компонент HomeClient.
 * Это гарантирует мгновенную отрисовку реальных товаров с первого кадра,
 * полностью устраняет мерцание/моргание при гидратации и обеспечивает идеальное SEO для поисковых систем.
 */
export default async function HomePage() {
  // Получаем актуальный каталог товаров из PostgreSQL Supabase на стороне сервера
  const products = await getStoreProducts();

  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "var(--bg-main)" }} />
      }
    >
      <HomeClient initialProducts={products} />
    </Suspense>
  );
}
