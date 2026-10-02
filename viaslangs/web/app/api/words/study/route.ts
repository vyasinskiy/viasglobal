import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { StudyWordResponse } from "@/lib/types";

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
    const favoriteOnly = searchParams.get("favoriteOnly") === "true";
    const excludeId = searchParams.get("excludeId");
    const languageId = searchParams.get("languageId");
    const tagId = searchParams.get("tagId");

    const params: unknown[] = [];
    const conditions: string[] = [];

    if (favoriteOnly) {
      conditions.push(`w.is_favorite = true`);
    }
    if (languageId) {
      params.push(parseInt(languageId));
      conditions.push(`w.language_id = $${params.length}`);
    }
    if (tagId) {
      params.push(parseInt(tagId));
      conditions.push(
        `w.id IN (SELECT word_id FROM vy_word_tags WHERE tag_id = $${params.length})`
      );
    }

    const whereComplete = [
      ...conditions,
      `NOT EXISTS (
        SELECT 1 FROM vy_answers a
        WHERE a.word_id = w.id AND a.is_correct = true
      )`,
    ];

    if (excludeId) {
      params.push(parseInt(excludeId));
      whereComplete.push(`w.id != $${params.length}`);
    }

    const whereClause = `WHERE ${whereComplete.join(" AND ")}`;

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM vy_words w ${whereClause}`,
      params
    );
    const totalUnlearned = countResult.rows[0].count;

    if (totalUnlearned > 0) {
      const randomSkip = Math.floor(Math.random() * totalUnlearned);
      const result = await pool.query(
        `${WORD_SELECT} ${whereClause} OFFSET $${params.length + 1} LIMIT 1`,
        [...params, randomSkip]
      );

      if (result.rows[0]) {
        const response: StudyWordResponse = {
          word: result.rows[0],
          unlearnedCount: totalUnlearned,
        };
        return NextResponse.json({ success: true, data: response });
      }
    }

    return NextResponse.json(
      { success: false, error: "No words available for study" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching study word:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch study word" },
      { status: 500 }
    );
  }
}