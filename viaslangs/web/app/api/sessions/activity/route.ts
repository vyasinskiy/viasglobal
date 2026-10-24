import { NextResponse } from "next/server";
import { recordSessionActivity } from "@/lib/sessions";
import { RecordActivityRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Эндпоинт фиксации активности в сессионном дне (Next, правильный ответ, ошибка)
 * Метод: POST /api/sessions/activity
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RecordActivityRequest;
    const { languageId, wordId, activityType, userAnswer } = body;

    // Проверка обязательного типа активности
    if (!activityType || !["NEXT", "ANSWER_CORRECT", "ANSWER_ERROR"].includes(activityType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Поле activityType обязательно и должно быть одним из: NEXT, ANSWER_CORRECT, ANSWER_ERROR",
        },
        { status: 400 }
      );
    }

    // Фиксация события в базе данных
    const result = await recordSessionActivity({
      languageId,
      wordId,
      activityType,
      userAnswer,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Ошибка при фиксации активности сессии:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Не удалось сохранить активность сессии",
      },
      { status: 500 }
    );
  }
}
