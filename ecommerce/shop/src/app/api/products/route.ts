import { NextResponse } from "next/server";
import { getStoreProducts } from "@/lib/products";
import { ProductCategory } from "@/types";

/**
 * API эндпоинт получения каталога товаров магазина из Supabase/PostgreSQL
 * GET /api/products?category=workspace
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get("category") as ProductCategory) || undefined;
    const tag = searchParams.get("tag") || undefined;

    const products = await getStoreProducts(category, tag);
    return NextResponse.json(products);
  } catch (err: any) {
    return NextResponse.json({ error: "Не удалось получить список товаров", details: err.message }, { status: 500 });
  }
}
