import { getStoreProducts } from "@/lib/products";
import { EspecialPuentesClient } from "./EspecialPuentesClient";

export const dynamic = "force-dynamic";

export default async function EspecialPuentesPage() {
  const products = await getStoreProducts();
  return <EspecialPuentesClient initialProducts={products} />;
}
