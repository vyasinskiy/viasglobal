import { NextResponse } from "next/server";
import { getStoreProductBySlug } from "@/lib/products";

/**
 * API маршрут для получения одного товара по ID или slug
 * GET /api/products/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await getStoreProductBySlug(id);

    if (!product) {
      return NextResponse.json({ error: "Товар не найден" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера", details: err.message },
      { status: 500 }
    );
  }
}
