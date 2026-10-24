import { PoolClient } from "pg";
import { pool } from "./db";
import { parseWordGrammar } from "./grammar";
import {
  ActivityType,
  TodaySessionStats,
  TagStat,
  FormStat,
  WeakWord,
  SessionsHistory,
  DailySessionSummary,
} from "./types";

/**
 * Гарантирует наличие сессионного дня в таблице vy_study_sessions для указанного языка.
 * Если сессия на текущую дату уже существует, возвращает ее ID.
 * Если нет - атомарно создает новую запись с датой CURRENT_DATE.
 *
 * @param client - клиент соединения PostgreSQL (или глобальный пул)
 * @param languageId - идентификатор языка (по умолчанию испанский 'es')
 * @returns идентификатор сессии ID
 */
export async function getOrCreateTodaySession(
  client: PoolClient | typeof pool,
  languageId?: number
): Promise<{ sessionId: number; resolvedLanguageId: number; sessionDate: string }> {
  // 1. Если язык не указан явно, по умолчанию берем испанский ('es')
  let resolvedLangId: number = languageId || 0;
  if (!resolvedLangId) {
    const langRes = await client.query(
      `SELECT id FROM vy_languages WHERE code = 'es' LIMIT 1`
    );
    resolvedLangId = Number(langRes.rows[0]?.id) || 2;
  }

  // 2. Дата текущего сессионного дня в часовом поясе Мадрида (Испания)
  const todayDateStr = new Date().toISOString().split("T")[0];

  // 3. Атомарный upsert сессионного дня: создаем при отсутствии или возвращаем существующий
  const sessionRes = await client.query(
    `INSERT INTO vy_study_sessions (language_id, session_date, next_clicks, created_at, updated_at)
     VALUES ($1, $2::date, 0, NOW(), NOW())
     ON CONFLICT (language_id, session_date)
     DO UPDATE SET updated_at = NOW()
     RETURNING id, session_date::text as session_date`,
    [resolvedLangId, todayDateStr]
  );

  return {
    sessionId: sessionRes.rows[0].id,
    resolvedLanguageId: resolvedLangId,
    sessionDate: sessionRes.rows[0].session_date,
  };
}

/**
 * Фиксирует активность пользователя в сессионном дне:
 * - нажатие кнопки "Next" (увеличивает счетчик next_clicks и фиксирует активность)
 * - верный ответ (ANSWER_CORRECT)
 * - ошибка (ANSWER_ERROR)
 *
 * @param params - параметры активности
 */
export async function recordSessionActivity(params: {
  languageId?: number;
  wordId?: number;
  activityType: ActivityType;
  userAnswer?: string;
  client?: PoolClient;
}): Promise<{ success: boolean; sessionId: number; totalActivities: number }> {
  const db = params.client || pool;

  // 1. Получаем или открываем сессию текущего дня
  const { sessionId, resolvedLanguageId } = await getOrCreateTodaySession(
    db,
    params.languageId
  );

  // 2. Если активность типа NEXT, инкрементируем счетчик next_clicks в самой сессии
  if (params.activityType === "NEXT") {
    await db.query(
      `UPDATE vy_study_sessions
       SET next_clicks = next_clicks + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );
  }

  // 3. Записываем детальную активность в журнал vy_session_activities
  if (params.wordId) {
    await db.query(
      `INSERT INTO vy_session_activities (session_id, word_id, activity_type, user_answer, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [sessionId, params.wordId, params.activityType, params.userAnswer || null]
    );
  }

  // 4. Считаем общее число активностей за сегодня
  const countRes = await db.query(
    `SELECT
       (s.next_clicks +
        COALESCE((SELECT COUNT(*) FROM vy_session_activities a WHERE a.session_id = s.id AND a.activity_type != 'NEXT'), 0)
       )::int as total
     FROM vy_study_sessions s
     WHERE s.id = $1`,
    [sessionId]
  );

  return {
    success: true,
    sessionId,
    totalActivities: countRes.rows[0]?.total || 0,
  };
}

/**
 * Собирает детальную статистику по текущей сессии за сегодня:
 * - количество кликов Next (попытки/прочитанные примеры)
 * - количество правильных ответов и ошибок
 * - группировка ошибок и успехов по тегам (например: Pretérito Indefinido vs Imperfecto)
 * - группировка по грамматическим лицам (yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes)
 * - список наиболее проблемных слов с наибольшим числом ошибок
 * - автоматическая генерация текстового вывода и рекомендации для OpenClaw
 *
 * @param languageId - идентификатор языка (по умолчанию испанский)
 */
export async function getTodaySessionStats(
  languageId?: number
): Promise<TodaySessionStats> {
  // 1. Получаем или инициализируем сессионный день
  const { sessionId, resolvedLanguageId, sessionDate } =
    await getOrCreateTodaySession(pool, languageId);

  // 2. Получаем код языка (например, 'es')
  const langRes = await pool.query(
    `SELECT code FROM vy_languages WHERE id = $1`,
    [resolvedLanguageId]
  );
  const langCode = langRes.rows[0]?.code || "es";

  // 3. Получаем данные сессии
  const sessionRes = await pool.query(
    `SELECT next_clicks FROM vy_study_sessions WHERE id = $1`,
    [sessionId]
  );
  const nextClicks = sessionRes.rows[0]?.next_clicks || 0;

  // 4. Получаем все действия с ответами за сегодня
  // Выбираем из vy_session_activities (а если их еще мало, объединяем с vy_answers за сегодняшнюю дату)
  const activitiesRes = await pool.query(
    `SELECT
       w.id as word_id,
       w.english,
       w.russian,
       act.activity_type,
       COALESCE(
         (SELECT array_agg(t.name)
          FROM vy_word_tags wt
          JOIN vy_tags t ON t.id = wt.tag_id
          WHERE wt.word_id = w.id),
         ARRAY[]::text[]
       ) as tags
     FROM vy_session_activities act
     JOIN vy_words w ON w.id = act.word_id
     WHERE act.session_id = $1
       AND act.activity_type IN ('ANSWER_CORRECT', 'ANSWER_ERROR')`,
    [sessionId]
  );

  let correctCount = 0;
  let errorCount = 0;

  // Структуры для агрегации статистики по тегам и формам
  const tagAgg: Record<string, { errors: number; correct: number; total: number }> = {};
  const formAgg: Record<string, { person: string; label: string; errors: number; correct: number }> = {};
  const wordErrorsMap: Record<number, { wordId: number; english: string; russian: string; tense: string | null; person: string; personLabel: string; errorsCount: number }> = {};

  for (const row of activitiesRes.rows) {
    const isCorrect = row.activity_type === "ANSWER_CORRECT";
    if (isCorrect) correctCount++;
    else errorCount++;

    // Грамматический анализ слова
    const grammar = parseWordGrammar(row.russian, row.english, row.tags);

    // Учет в слабых словах при ошибке
    if (!isCorrect) {
      if (!wordErrorsMap[row.word_id]) {
        wordErrorsMap[row.word_id] = {
          wordId: row.word_id,
          english: row.english,
          russian: row.russian,
          tense: grammar.tense,
          person: grammar.person,
          personLabel: grammar.personLabel,
          errorsCount: 0,
        };
      }
      wordErrorsMap[row.word_id].errorsCount++;
    }

    // Агрегация по всем привязанным тегам слова
    for (const tag of row.tags) {
      if (!tagAgg[tag]) {
        tagAgg[tag] = { errors: 0, correct: 0, total: 0 };
      }
      tagAgg[tag].total++;
      if (isCorrect) tagAgg[tag].correct++;
      else tagAgg[tag].errors++;
    }

    // Агрегация по грамматической форме лица
    if (grammar.person && grammar.person !== "general") {
      if (!formAgg[grammar.person]) {
        formAgg[grammar.person] = {
          person: grammar.person,
          label: grammar.personLabel,
          errors: 0,
          correct: 0,
        };
      }
      if (isCorrect) formAgg[grammar.person].correct++;
      else formAgg[grammar.person].errors++;
    }
  }

  // 5. Преобразуем агрегированные теги в отсортированный массив (по количеству ошибок убывающе)
  const tagStats: TagStat[] = Object.entries(tagAgg)
    .map(([tag, data]) => ({
      tag,
      errors: data.errors,
      correct: data.correct,
      total: data.total,
      errorRate: data.total > 0 ? Math.round((data.errors / data.total) * 100) : 0,
    }))
    .sort((a, b) => b.errors - a.errors);

  // 6. Преобразуем формы лица в отсортированный массив
  const formStats: FormStat[] = Object.values(formAgg).sort(
    (a, b) => b.errors - a.errors
  );

  // 7. Формируем топ слабых слов с наибольшим числом ошибок
  const weakWords: WeakWord[] = Object.values(wordErrorsMap).sort(
    (a, b) => b.errorsCount - a.errorsCount
  );

  const totalAnswers = correctCount + errorCount;
  const accuracy = totalAnswers > 0 ? Math.round((correctCount / totalAnswers) * 100) : 0;
  const totalActivities = nextClicks + totalAnswers;

  // 8. Автоматическая генерация понятной рекомендации на русском языке
  let recommendation = "";
  if (totalActivities === 0) {
    recommendation = "За сегодня еще не было активностей. Самое время открыть карточки и прочитать несколько примеров!";
  } else if (errorCount === 0 && correctCount > 0) {
    recommendation = `Отличный результат! Все ${correctCount} ответов верны (точность 100%). Продолжай в том же духе!`;
  } else {
    // Находим тег времени с максимальным числом ошибок
    const topTenseError = tagStats.find((t) =>
      ["Pretérito Indefinido", "Pretérito Imperfecto", "Presente", "Futuro"].includes(t.tag) && t.errors > 0
    );
    // Находим форму лица с максимальным числом ошибок
    const topFormError = formStats.find((f) => f.errors > 0);

    const parts: string[] = [];
    if (topTenseError) {
      parts.push(`больше всего ошибок во времени «${topTenseError.tag}» (${topTenseError.errors} ошибок, процент ошибок: ${topTenseError.errorRate}%)`);
    }
    if (topFormError) {
      parts.push(`наибольшая сложность в форме «${topFormError.label}» (${topFormError.errors} ошибок)`);
    }

    if (parts.length > 0) {
      recommendation = `В текущей сессии ${parts.join(" и ")}. Сделай упор на повторение именно этих карточек!`;
    } else {
      recommendation = `В текущей сессии зафиксировано ${errorCount} ошибок из ${totalAnswers} попыток (точность ${accuracy}%). Рекомендуется повторить слабые слова.`;
    }
  }

  return {
    sessionId,
    date: sessionDate,
    languageId: resolvedLanguageId,
    languageCode: langCode,
    summary: {
      totalActivities,
      nextClicks,
      correctAnswers: correctCount,
      errorAnswers: errorCount,
      accuracy,
    },
    tagStats,
    formStats,
    weakWords,
    recommendation,
  };
}

/**
 * Получает аналитику активности за несколько дней (по умолчанию 7 дней).
 * Рассчитывает средний уровень активности, сравнивает с сегодняшним днем,
 * определяет тренд (DROPPING, STABLE, GROWING) и формирует текст напоминания для OpenClaw.
 *
 * @param days - количество дней для анализа (по умолчанию 7)
 * @param languageId - идентификатор языка
 */
export async function getSessionsHistory(
  days: number = 7,
  languageId?: number
): Promise<SessionsHistory> {
  let resolvedLangId: number = languageId || 0;
  if (!resolvedLangId) {
    const langRes = await pool.query(
      `SELECT id FROM vy_languages WHERE code = 'es' LIMIT 1`
    );
    resolvedLangId = Number(langRes.rows[0]?.id) || 2;
  }

  // 1. Выбираем сессии за последние days дней
  const sessionsRes = await pool.query(
    `SELECT
       s.id,
       s.session_date::text as session_date,
       s.next_clicks,
       COALESCE(SUM(CASE WHEN act.activity_type = 'ANSWER_CORRECT' THEN 1 ELSE 0 END), 0)::int as correct_answers,
       COALESCE(SUM(CASE WHEN act.activity_type = 'ANSWER_ERROR' THEN 1 ELSE 0 END), 0)::int as error_answers
     FROM vy_study_sessions s
     LEFT JOIN vy_session_activities act ON act.session_id = s.id
     WHERE s.language_id = $1
       AND s.session_date >= (CURRENT_DATE - ($2 || ' days')::interval)::date
     GROUP BY s.id, s.session_date, s.next_clicks
     ORDER BY s.session_date DESC`,
    [resolvedLangId, days]
  );

  const dailySessions: DailySessionSummary[] = sessionsRes.rows.map((row) => {
    const nextClicks = Number(row.next_clicks) || 0;
    const correct = Number(row.correct_answers) || 0;
    const errors = Number(row.error_answers) || 0;
    const totalAnswers = correct + errors;
    const totalActivities = nextClicks + totalAnswers;
    const accuracy = totalAnswers > 0 ? Math.round((correct / totalAnswers) * 100) : 0;

    return {
      date: row.session_date,
      totalActivities,
      nextClicks,
      correctAnswers: correct,
      errorAnswers: errors,
      accuracy,
    };
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySession = dailySessions.find((s) => s.date === todayStr);
  const todayActivities = todaySession ? todaySession.totalActivities : 0;

  // Считаем среднюю активность за предыдущие дни (исключая сегодня)
  const previousDays = dailySessions.filter((s) => s.date !== todayStr);
  const previousSum = previousDays.reduce((acc, curr) => acc + curr.totalActivities, 0);
  const averageDailyActivities =
    previousDays.length > 0 ? Math.round((previousSum / previousDays.length) * 10) / 10 : todayActivities;

  // Анализ тренда
  let trend: "STABLE" | "GROWING" | "DROPPING" | "INACTIVE" = "STABLE";
  let alert: string | null = null;

  if (averageDailyActivities > 0 && todayActivities < averageDailyActivities * 0.4) {
    trend = "DROPPING";
    alert = `H1, у тебя очень низкая активность сегодня: всего ${todayActivities} действий при среднем уровне ${averageDailyActivities}. Давай позанимаемся испанским: это твое самое слабое место, иначе мы не разбогатеем!`;
  } else if (todayActivities === 0 && averageDailyActivities === 0) {
    trend = "INACTIVE";
    alert = "Активность отсутствует уже несколько дней. Давай вернемся к регулярным тренировкам испанского!";
  } else if (todayActivities > averageDailyActivities * 1.3) {
    trend = "GROWING";
  }

  return {
    daysCount: days,
    averageDailyActivities,
    todayActivities,
    trend,
    alert,
    dailySessions,
  };
}
