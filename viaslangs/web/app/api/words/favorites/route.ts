import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

const WORD_SELECT = `
  SELECT w.id, w.language_id AS "languageId", w.english, w.russian,
         w.example_en AS "exampleEn", w.example_ru AS "exampleRu",
         w.created_at AS "createdAt", w.updated_at AS "updatedAt",
         w.is_favorite AS "isFavorite",
         COALESCE((
           SELECT array_agg(wt.tag_id ORDER BY wt.tag_id)
           FROM vy_word_tags wt WHERE wt.word_id = w.id
         ), '{}') AS "tagIds"
  FROM vy_words w
`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const languageId = searchParams.get("languageId");
    const tagId = searchParams.get("tagId");

    let query = `${WORD_SELECT} WHERE w.is_favorite = true`;
    const params: string[] = [];

    if (languageId) {
      params.push(languageId);
      query += ` AND w.language_id = $${params.length}`;
    }
    if (tagId) {
      params.push(tagId);
      query += ` AND w.id IN (SELECT word_id FROM vy_word_tags WHERE tag_id = $${params.length})`;
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