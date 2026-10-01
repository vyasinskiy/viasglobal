import { NextResponse } from "next/server";
import { pool, mapRows } from "@/lib/db";
import { Word, CreateWordRequest } from "@/lib/types";

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

    let query = `${WORD_SELECT}`;
    const params: string[] = [];

    if (languageId) {
      params.push(languageId);
      query += ` WHERE w.language_id = $1`;
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
    const { english, russian, exampleEn, exampleRu, languageId } = body;

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
       RETURNING id, language_id AS "languageId", english, russian,
                 example_en AS "exampleEn", example_ru AS "exampleRu",
                 created_at AS "createdAt", updated_at AS "updatedAt",
                 is_favorite AS "isFavorite"`,
      [
        targetLanguageId,
        english.toLowerCase().trim(),
        russian.trim(),
        exampleEn.trim(),
        exampleRu.trim(),
      ]
    );

    return NextResponse.json(
      { success: true, data: result.rows[0] },
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