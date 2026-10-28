import { getStoreProducts } from "@/lib/products";
import { EspecialNavidadClient } from "./EspecialNavidadClient";

export const dynamic = "force-dynamic";

export default async function EspecialNavidadPage() {
  const products = await getStoreProducts();
  return <EspecialNavidadClient initialProducts={products} />;
}
