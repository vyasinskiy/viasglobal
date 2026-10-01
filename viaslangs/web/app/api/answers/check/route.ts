import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { CheckAnswerRequest, CheckAnswerResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  return matrix[str2.length][str1.length];
}

export async function POST(req: Request) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const body = (await req.json()) as CheckAnswerRequest;
    const { wordId, answer } = body;

    if (!wordId || !answer) {
      return NextResponse.json(
        { success: false, error: "Word ID and answer are required" },
        { status: 400 }
      );
    }

    const wordResult = await client.query(
      `SELECT id, language_id, english, russian FROM vy_words WHERE id = $1`,
      [wordId]
    );
    const word = wordResult.rows[0];

    if (!word) {
      return NextResponse.json(
        { success: false, error: "Word not found" },
        { status: 404 }
      );
    }

    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = word.english.toLowerCase().trim();

    const isCorrect = userAnswer === correctAnswer;

    let isSynonym = false;
    let synonymWord: { id: number } | null = null;

    if (!isCorrect) {
      const synonymResult = await client.query(
        `SELECT id FROM vy_words
         WHERE russian = $1 AND english = $2 AND language_id = $3
         LIMIT 1`,
        [word.russian, userAnswer, word.language_id]
      );
      synonymWord = synonymResult.rows[0] ?? null;
      isSynonym = Boolean(synonymWord);
    }

    let isPartial = false;
    let hint = "";

    if (!isCorrect && !isSynonym && userAnswer.length > 0) {
      if (correctAnswer.startsWith(userAnswer)) {
        isPartial = true;
        hint = `Correct! Continue... (${correctAnswer.length - userAnswer.length} letters left)`;
      } else if (correctAnswer.includes(userAnswer)) {
        isPartial = true;
        hint = "Partially correct! Try again!";
      } else if (levenshteinDistance(userAnswer, correctAnswer) <= 2) {
        isPartial = true;
        hint = "Very close! Check your answer";
      }
    }

    await client.query(
      `INSERT INTO vy_answers (word_id, answer, is_correct, is_synonym)
       VALUES ($1, $2, $3, $4)`,
      [wordId, userAnswer, isCorrect, isSynonym]
    );

    if (isSynonym && synonymWord) {
      const existingCorrect = await client.query(
        `SELECT id FROM vy_answers WHERE word_id = $1 AND is_correct = true LIMIT 1`,
        [synonymWord.id]
      );
      if (!existingCorrect.rows[0]) {
        await client.query(
          `INSERT INTO vy_answers (word_id, answer, is_correct) VALUES ($1, $2, true)`,
          [synonymWord.id, userAnswer]
        );
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCorrect = await client.query(
      `SELECT COUNT(*)::int AS count FROM vy_answers a
       JOIN vy_words w ON w.id = a.word_id
       WHERE a.is_correct = true AND w.language_id = $1
         AND a.created_at >= $2 AND a.created_at <= $3`,
      [word.language_id, startOfDay, endOfDay]
    );

    const totalCorrect = await client.query(
      `SELECT COUNT(*)::int AS count FROM vy_answers a
       JOIN vy_words w ON w.id = a.word_id
       WHERE a.is_correct = true AND w.language_id = $1`,
      [word.language_id]
    );

    const totalWords = await client.query(
      `SELECT COUNT(*)::int AS count FROM vy_words WHERE language_id = $1`,
      [word.language_id]
    );

    const response: CheckAnswerResponse = {
      isCorrect,
      isPartial,
      hint: isSynonym
        ? "This is synonym. Try another word."
        : isPartial
          ? hint
          : undefined,
      isSynonym: isSynonym || undefined,
      correctAnswer: word.english,
      todayCorrectAnswers: todayCorrect.rows[0].count,
      totalCorrectAnswers: totalCorrect.rows[0].count,
      totalWords: totalWords.rows[0].count,
    };

    await client.query("COMMIT");
    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error("Error checking answer:", error);
    await client.query("ROLLBACK");
    return NextResponse.json(
      { success: false, error: "Failed to check answer" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}