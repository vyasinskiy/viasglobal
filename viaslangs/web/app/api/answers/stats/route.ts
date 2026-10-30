import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { Stats } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const languageId = searchParams.get("languageId");

    const langFilter = languageId ? parseInt(languageId) : null;

    const totalAnswersResult = await pool.query(
      langFilter
        ? `SELECT COUNT(*)::int AS count FROM answers a
           JOIN words w ON w.id = a.word_id WHERE w.language_id = $1`
        : `SELECT COUNT(*)::int AS count FROM answers`,
      langFilter ? [langFilter] : []
    );

    const correctAnswersResult = await pool.query(
      langFilter
        ? `SELECT COUNT(*)::int AS count FROM answers a
           JOIN words w ON w.id = a.word_id
           WHERE a.is_correct = true AND w.language_id = $1`
        : `SELECT COUNT(*)::int AS count FROM answers WHERE is_correct = true`,
      langFilter ? [langFilter] : []
    );

    const totalWordsResult = await pool.query(
      langFilter
        ? `SELECT COUNT(*)::int AS count FROM words WHERE language_id = $1`
        : `SELECT COUNT(*)::int AS count FROM words`,
      langFilter ? [langFilter] : []
    );

    const learnedWordsResult = await pool.query(
      langFilter
        ? `SELECT COUNT(*)::int AS count FROM words w
           WHERE w.language_id = $1 AND EXISTS (
             SELECT 1 FROM answers a WHERE a.word_id = w.id AND a.is_correct = true
           )`
        : `SELECT COUNT(*)::int AS count FROM words w
           WHERE EXISTS (
             SELECT 1 FROM answers a WHERE a.word_id = w.id AND a.is_correct = true
           )`,
      langFilter ? [langFilter] : []
    );

    const favoriteWordsResult = await pool.query(
      langFilter
        ? `SELECT COUNT(*)::int AS count FROM words WHERE language_id = $1 AND is_favorite = true`
        : `SELECT COUNT(*)::int AS count FROM words WHERE is_favorite = true`,
      langFilter ? [langFilter] : []
    );

    const totalAnswers = totalAnswersResult.rows[0].count;
    const correctAnswers = correctAnswersResult.rows[0].count;
    const totalWords = totalWordsResult.rows[0].count;
    const learnedWords = learnedWordsResult.rows[0].count;
    const favoriteWords = favoriteWordsResult.rows[0].count;

    const stats: Stats = {
      totalAnswers,
      correctAnswers,
      accuracy: totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0,
      totalWords,
      learnedWords,
      favoriteWords,
    };

    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}