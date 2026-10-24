import { NextResponse } from "next/server";
import { getTodaySessionStats } from "@/lib/sessions";

export const dynamic = "force-dynamic";

/**
 * Эндпоинт получения детальной статистики по текущей сессии за сегодня.
 * Метод: GET /api/sessions/today?languageId=...
 * 
 * Возвращает:
 * - summary: общее число активностей, кликов Next, верных ответов, ошибок, точность
 * - tagStats: ошибки и успехи в разрезе тегов (включая времена Pretérito Indefinido / Imperfecto)
 * - formStats: ошибки в разрезе грамматических форм лица (yo, tú, él/ella/usted, ...)
 * - weakWords: список наиболее проблемных карточек слов
 * - recommendation: готовая рекомендация на русском языке для ассистента OpenClaw
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const languageIdParam = searchParams.get("languageId");
    const languageId = languageIdParam ? parseInt(languageIdParam, 10) : undefined;

    const stats = await getTodaySessionStats(languageId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Ошибка при получении статистики сессии за сегодня:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Не удалось получить статистику сессии за сегодня",
      },
      { status: 500 }
    );
  }
}
