import { getStoreProducts } from "@/lib/products";
import { RegalosOriginalesClient } from "./RegalosOriginalesClient";

export const dynamic = "force-dynamic";

export default async function RegalosOriginalesPage() {
  const products = await getStoreProducts();
  return <RegalosOriginalesClient initialProducts={products} />;
}
