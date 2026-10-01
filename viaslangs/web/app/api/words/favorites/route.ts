import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

const WORD_SELECT = `
  SELECT w.id, w.language_id AS "languageId", w.english, w.russian,
         w.example_en AS "exampleEn", w.example_ru AS "exampleRu",
         w.created_at AS "createdAt", w.updated_at AS "updatedAt",
         w.is_favorite AS "isFavorite"
  FROM vy_words w
`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const languageId = searchParams.get("languageId");

    let query = `${WORD_SELECT} WHERE w.is_favorite = true`;
    const params: string[] = [];

    if (languageId) {
      params.push(languageId);
      query += ` AND w.language_id = $1`;
    }

    query += ` ORDER BY w.created_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching favorite words:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch favorite words" },
      { status: 500 }
    );
  }
}