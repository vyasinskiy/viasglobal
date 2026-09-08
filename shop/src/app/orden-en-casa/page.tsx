import { getStoreProducts } from "@/lib/products";
import { OrdenEnCasaClient } from "./OrdenEnCasaClient";

export const dynamic = "force-dynamic";

export default async function OrdenEnCasaPage() {
  const products = await getStoreProducts();
  return <OrdenEnCasaClient initialProducts={products} />;
}
