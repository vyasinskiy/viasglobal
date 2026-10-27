import { NextResponse } from "next/server";
import { getTodayTrainingPhrases } from "@/lib/sessions";

export const dynamic = "force-dynamic";

/**
 * Эндпоинт получения предложений для тренировки в лайв-режиме (Gemini Gem / OpenClaw).
 * Метод: GET /api/sessions/training-phrases?limit=10&languageId=2
 *
 * Приоритет выборки:
 * 1. В первую очередь: слова с ошибками за сегодня (ANSWER_ERROR).
 * 2. Во вторую очередь: слова, пропущенные сегодня через кнопку Next (NEXT).
 * 3. При необходимости дополняет неизученными словами до запрошенного лимита.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 10;
    const languageIdParam = searchParams.get("languageId");
    const languageId = languageIdParam ? parseInt(languageIdParam, 10) : undefined;

    const data = await getTodayTrainingPhrases({ limit, languageId });

    // Если запрошен сырой компактный JSON (для OpenClaw / Telegram без лишней обертки)
    if (searchParams.get("format") === "raw_compact") {
      return new Response(data.compactJson, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Ошибка при получении предложений для тренировки:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Не удалось получить предложения для тренировки",
      },
      { status: 500 }
    );
  }
}
