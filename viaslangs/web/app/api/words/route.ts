import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { Word, CreateWordRequest } from "@/lib/types";

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

    let query = `${WORD_SELECT}`;
    const params: string[] = [];
    const conditions: string[] = [];

    if (languageId) {
      params.push(languageId);
      conditions.push(`w.language_id = $${params.length}`);
    }
    if (tagId) {
      params.push(tagId);
      conditions.push(
        `w.id IN (SELECT word_id FROM vy_word_tags WHERE tag_id = $${params.length})`
      );
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY w.created_at DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching words:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch words" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateWordRequest;
    const { english, russian, exampleEn, exampleRu, languageId, tagIds } = body;

    if (!english || !russian || !exampleEn || !exampleRu) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    let targetLanguageId = languageId;
    if (!targetLanguageId) {
      const langResult = await pool.query(
        "SELECT id FROM vy_languages ORDER BY id ASC LIMIT 1"
      );
      targetLanguageId = langResult.rows[0]?.id;
    }

    if (!targetLanguageId) {
      return NextResponse.json(
        { success: false, error: "No language selected and no languages exist" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO vy_words (language_id, english, russian, example_en, example_ru)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        targetLanguageId,
        english.toLowerCase().trim(),
        russian.trim(),
        exampleEn.trim(),
        exampleRu.trim(),
      ]
    );

    const wordId = result.rows[0].id;

    if (Array.isArray(tagIds) && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await pool.query(
          `INSERT INTO vy_word_tags (word_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [wordId, tagId]
        );
      }
    }

    const full = await pool.query(
      `${WORD_SELECT} WHERE w.id = $1`,
      [wordId]
    );

    return NextResponse.json(
      { success: true, data: full.rows[0] as Word },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating word:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create word" },
      { status: 500 }
    );
  }
}