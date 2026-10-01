import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { TodayCorrectWord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const languageId = searchParams.get("languageId");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const params: unknown[] = [];
    let langFilter = "";

    if (languageId) {
      params.push(parseInt(languageId));
      langFilter = `AND w.language_id = $${params.length}`;
    }

    params.push(startOfDay, endOfDay);

    const result = await pool.query(
      `SELECT DISTINCT w.english, w.russian, w.example_en AS "exampleEn", w.example_ru AS "exampleRu"
       FROM vy_answers a
       JOIN vy_words w ON w.id = a.word_id
       WHERE a.is_correct = true ${langFilter}
         AND a.created_at >= $${params.length - 1}
         AND a.created_at <= $${params.length}`,
      params
    );

    return NextResponse.json({
      success: true,
      data: result.rows as TodayCorrectWord[],
    });
  } catch (error) {
    console.error("Error fetching today correct words:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch today correct words" },
      { status: 500 }
    );
  }
}