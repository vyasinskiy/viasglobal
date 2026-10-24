import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { CheckAnswerRequest, CheckAnswerResponse } from "@/lib/types";
import { recordSessionActivity } from "@/lib/sessions";

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

/**
 * Нормализация текста для проверки ответа пользователя:
 * - приведение к нижнему регистру
 * - обрезка крайних пробелов и схлопывание внутренних пробелов
 * - удаление графических знаков ударения (диакритики): ó -> o, é -> e, á -> a, í -> i, ú -> u и т.д.
 * Это позволяет пользователям комфортно вводить ответы без необходимости переключать раскладку для ввода диакритики.
 */
function normalizeAnswer(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
      `SELECT id, language_id, english, russian, base_word_id FROM vy_words WHERE id = $1`,
      [wordId]
    );
    const word = wordResult.rows[0];

    if (!word) {
      return NextResponse.json(
        { success: false, error: "Word not found" },
        { status: 404 }
      );
    }

    const rawUserAnswer = answer.trim();
    const rawCorrectAnswer = word.english.trim();

    // Нормализованные строки для сравнения без учёта регистра, лишних пробелов и акцентов (например, acepto == aceptó)
    const normUserAnswer = normalizeAnswer(rawUserAnswer);
    const normCorrectAnswer = normalizeAnswer(rawCorrectAnswer);

    const isCorrect = normUserAnswer === normCorrectAnswer;

    let isSynonym = false;
    let synonymWord: { id: number } | null = null;

    if (!isCorrect) {
      // Поиск синонимов среди других слов того же языка с нормализацией акцентов
      const synonymResult = await client.query(
        `SELECT id, english FROM vy_words
         WHERE russian = $1 AND language_id = $2`,
        [word.russian, word.language_id]
      );
      for (const row of synonymResult.rows) {
        if (normalizeAnswer(row.english) === normUserAnswer) {
          synonymWord = { id: row.id };
          isSynonym = true;
          break;
        }
      }
    }

    let isPartial = false;
    let hint = "";

    if (!isCorrect && !isSynonym && normUserAnswer.length > 0) {
      if (normCorrectAnswer.startsWith(normUserAnswer)) {
        isPartial = true;
        hint = `Correct! Continue... (${normCorrectAnswer.length - normUserAnswer.length} letters left)`;
      } else if (normCorrectAnswer.includes(normUserAnswer)) {
        isPartial = true;
        hint = "Partially correct! Try again!";
      } else if (levenshteinDistance(normUserAnswer, normCorrectAnswer) <= 2) {
        isPartial = true;
        hint = "Very close! Check your answer";
      }
    }

    await client.query(
      `INSERT INTO vy_answers (word_id, answer, is_correct, is_synonym)
       VALUES ($1, $2, $3, $4)`,
      [wordId, rawUserAnswer.toLowerCase(), isCorrect, isSynonym]
    );

    // Автоматическая фиксация активности в сессионном дне (успех или ошибка с тегами и словом)
    try {
      await recordSessionActivity({
        languageId: word.language_id,
        wordId,
        activityType: isCorrect ? "ANSWER_CORRECT" : "ANSWER_ERROR",
        userAnswer: rawUserAnswer,
        client,
      });
    } catch (sessionErr) {
      console.warn("Предупреждение: не удалось зафиксировать активность сессии:", sessionErr);
    }


    // Автозачёт всех 6 форм глагола при изучении конкретного времени (Pretérito Indefinido / Imperfecto)
    if (isCorrect && word.base_word_id) {
      await client.query(
        `INSERT INTO vy_answers (word_id, answer, is_correct)
         SELECT DISTINCT w2.id, w2.english, true
         FROM vy_words w2
         JOIN vy_word_tags wt2 ON wt2.word_id = w2.id
         WHERE w2.base_word_id = $1
           AND w2.id != $2
           AND wt2.tag_id IN (
             SELECT t.id
             FROM vy_word_tags wt
             JOIN vy_tags t ON t.id = wt.tag_id
             WHERE wt.word_id = $2
               AND t.name IN ('Pretérito Indefinido', 'Pretérito Imperfecto')
           )
           AND NOT EXISTS (
             SELECT 1 FROM vy_answers a WHERE a.word_id = w2.id AND a.is_correct = true
           )`,
        [word.base_word_id, wordId]
      );
    }

    if (isSynonym && synonymWord) {
      const existingCorrect = await client.query(
        `SELECT id FROM vy_answers WHERE word_id = $1 AND is_correct = true LIMIT 1`,
        [synonymWord.id]
      );
      if (!existingCorrect.rows[0]) {
        await client.query(
          `INSERT INTO vy_answers (word_id, answer, is_correct) VALUES ($1, $2, true)`,
          [synonymWord.id, rawUserAnswer.toLowerCase()]
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