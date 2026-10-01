import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { UpdateWordRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

const WORD_SELECT = `
  SELECT w.id, w.language_id AS "languageId", w.english, w.russian,
         w.example_en AS "exampleEn", w.example_ru AS "exampleRu",
         w.created_at AS "createdAt", w.updated_at AS "updatedAt",
         w.is_favorite AS "isFavorite"
  FROM vy_words w
`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `${WORD_SELECT} WHERE w.id = $1`,
      [parseInt(id)]
    );

    if (!result.rows[0]) {
      return NextResponse.json(
        { success: false, error: "Word not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error fetching word:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch word" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as UpdateWordRequest;
    const wordId = parseInt(id);

    const current = await pool.query(
      `SELECT id FROM vy_words WHERE id = $1`,
      [wordId]
    );
    if (!current.rows[0]) {
      return NextResponse.json(
        { success: false, error: "Word not found" },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const paramsArr: unknown[] = [];
    const fieldMap: Record<string, string> = {
      languageId: "language_id",
      english: "english",
      russian: "russian",
      exampleEn: "example_en",
      exampleRu: "example_ru",
      isFavorite: "is_favorite",
    };

    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || !(key in fieldMap)) continue;
      const col = fieldMap[key];
      let finalValue = value;
      if (key === "english" && typeof value === "string") {
        finalValue = value.toLowerCase().trim();
      }
      paramsArr.push(finalValue);
      updates.push(`${col} = $${paramsArr.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid fields to update",
      });
    }

    paramsArr.push(wordId);
    const result = await pool.query(
      `${WORD_SELECT} WHERE w.id = $${paramsArr.length} RETURNING *`,
      paramsArr
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("Error updating word:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update word" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await pool.query(`DELETE FROM vy_words WHERE id = $1`, [parseInt(id)]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting word:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete word" },
      { status: 500 }
    );
  }
}