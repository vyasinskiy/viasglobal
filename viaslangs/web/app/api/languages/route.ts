import { NextResponse } from "next/server";
import { pool, mapRows } from "@/lib/db";
import { Language } from "@/lib/types";

export const dynamic = "force-dynamic";

async function seedDefaultLanguages() {
  const result = await pool.query("SELECT COUNT(*)::int AS count FROM vy_languages");
  if (result.rows[0].count > 0) return;

  const defaults = [
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
  ];
  for (const lang of defaults) {
    await pool.query(
      "INSERT INTO vy_languages (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING",
      [lang.code, lang.name]
    );
  }
}

export async function GET() {
  try {
    await seedDefaultLanguages();
    const result = await pool.query("SELECT * FROM vy_languages ORDER BY id ASC");
    return NextResponse.json({
      success: true,
      data: mapRows<Language>(result.rows),
    });
  } catch (error) {
    console.error("Error fetching languages:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch languages" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json(
        { success: false, error: "Code and name are required" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "INSERT INTO vy_languages (code, name) VALUES ($1, $2) RETURNING *",
      [code.trim().toLowerCase(), name.trim()]
    );

    return NextResponse.json(
      { success: true, data: mapRows<Language>(result.rows)[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating language:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create language" },
      { status: 500 }
    );
  }
}