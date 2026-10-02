import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const languageId = searchParams.get("languageId");

    let query = `
      SELECT t.id, t.language_id AS "languageId", t.name, t.created_at AS "createdAt",
             COUNT(wt.word_id)::int AS "wordCount"
      FROM vy_tags t
      LEFT JOIN vy_word_tags wt ON wt.tag_id = t.id`;
    const params: string[] = [];

    if (languageId) {
      params.push(languageId);
      query += ` WHERE t.language_id = $1`;
    }

    query += ` GROUP BY t.id ORDER BY t.name ASC`;

    const result = await pool.query(query, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { languageId?: number; name?: string };
    const { languageId, name } = body;

    if (!languageId || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: "languageId and name are required" },
        { status: 400 }
      );
    }

    const lang = await pool.query("SELECT id FROM vy_languages WHERE id = $1", [languageId]);
    if (!lang.rows[0]) {
      return NextResponse.json(
        { success: false, error: "Language not found" },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `INSERT INTO vy_tags (language_id, name)
       VALUES ($1, $2)
       ON CONFLICT (language_id, name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, language_id AS "languageId", name, created_at AS "createdAt"`,
      [languageId, name.trim()]
    );

    return NextResponse.json(
      { success: true, data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create tag" },
      { status: 500 }
    );
  }
}