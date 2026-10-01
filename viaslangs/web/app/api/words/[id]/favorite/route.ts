import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const wordId = parseInt(id);

    const current = await pool.query(
      `SELECT id, is_favorite AS "isFavorite" FROM vy_words WHERE id = $1`,
      [wordId]
    );
    if (!current.rows[0]) {
      return NextResponse.json(
        { success: false, error: "Word not found" },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `UPDATE vy_words SET is_favorite = $1, updated_at = now()
       WHERE id = $2
       RETURNING id, language_id AS "languageId", english, russian,
                 example_en AS "exampleEn", example_ru AS "exampleRu",
                 created_at AS "createdAt", updated_at AS "updatedAt",
                 is_favorite AS "isFavorite"`,
      [!current.rows[0].isFavorite, wordId]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}