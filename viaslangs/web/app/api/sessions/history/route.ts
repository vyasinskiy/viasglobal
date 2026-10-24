import { NextResponse } from "next/server";
import { getSessionsHistory } from "@/lib/sessions";

export const dynamic = "force-dynamic";

/**
 * Эндпоинт получения мульти-дневной истории активности сессий.
 * Метод: GET /api/sessions/history?days=7&languageId=...
 * 
 * Возвращает:
 * - daysCount: количество анализируемых дней
 * - averageDailyActivities: среднее число активностей в день
 * - todayActivities: число активностей сегодня
 * - trend: тренд активности (DROPPING, STABLE, GROWING, INACTIVE)
 * - alert: готовый текст предупреждения для отправки в Telegram при снижении темпа
 * - dailySessions: подневная разбивка активности
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const languageIdParam = searchParams.get("languageId");

    const days = daysParam ? parseInt(daysParam, 10) : 7;
    const languageId = languageIdParam ? parseInt(languageIdParam, 10) : undefined;

    const history = await getSessionsHistory(days, languageId);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Ошибка при получении истории сессий:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Не удалось получить историю сессий",
      },
      { status: 500 }
    );
  }
}
