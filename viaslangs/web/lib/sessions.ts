import type { PoolClient } from "pg";
import { pool } from "./db.ts";
import { parseWordGrammar } from "./grammar.ts";
import type {
  ActivityType,
  TodaySessionStats,
  TagStat,
  FormStat,
  WeakWord,
  SessionsHistory,
  DailySessionSummary,
  TrainingPhrase,
  TrainingPhrasesData,
} from "./types.ts";

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
 * Возвращает строковую дату в формате YYYY-MM-DD для часового пояса Europe/Madrid.
 * Позволяет избежать сдвигов дат из-за разницы с UTC около полуночи.
 */
export function getMadridDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date);
}

/**
 * Вычисляет медианное значение числового массива.
 * Для нечетного количества элементов берется центральный элемент отсортированного массива.
 * Для четного количества элементов берется среднее арифметическое двух центральных элементов.
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Math.round(((sorted[mid - 1] + sorted[mid]) / 2) * 10) / 10;
}

/**
 * Склоняет слово «день» в зависимости от числительного на русском языке.
 */
export function formatDaysText(days: number): string {
  const mod10 = days % 10;
  const mod100 = days % 100;
  if (mod100 >= 11 && mod100 <= 19) {
    return `${days} дней`;
  }
  if (mod10 === 1) {
    return `${days} день`;
  }
  if (mod10 >= 2 && mod10 <= 4) {
    return `${days} дня`;
  }
  return `${days} дней`;
}

/**
 * Получает аналитику активности за несколько дней (по умолчанию 7 дней).
 * Рассчитывает средний и медианный уровень активности, сравнивает с сегодняшним днем,
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

  const todayStr = getMadridDateString();
  const todaySession = dailySessions.find((s) => s.date === todayStr);
  const todayActivities = todaySession ? todaySession.totalActivities : 0;

  // Формируем массив дневной активности ровно за предыдущие N дней (исключая сегодня).
  // Для дней, когда пользователь вообще не занимался, активность равна 0.
  const previousDaysActivities: number[] = [];
  const now = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = getMadridDateString(d);
    const found = dailySessions.find((s) => s.date === dateStr);
    previousDaysActivities.push(found ? found.totalActivities : 0);
  }

  // Считаем среднее и медиану за предыдущие дни
  const previousSum = previousDaysActivities.reduce((acc, curr) => acc + curr, 0);
  const averageDailyActivities =
    previousDaysActivities.length > 0
      ? Math.round((previousSum / previousDaysActivities.length) * 10) / 10
      : 0;

  const medianDailyActivities = calculateMedian(previousDaysActivities);

  // Сравниваем сегодняшнюю активность с медианной нормой
  const isBelowMedian = todayActivities < medianDailyActivities;
  const shouldRemind = isBelowMedian || (medianDailyActivities === 0 && todayActivities === 0);

  // Анализ тренда, напоминаний и похвалы без длинных тире
  let trend: "STABLE" | "GROWING" | "DROPPING" | "INACTIVE" = "STABLE";
  let alert: string | null = null;
  let praise: string | null = null;
  const periodText = formatDaysText(days);

  if (isBelowMedian) {
    trend = "DROPPING";
    alert = `Виталий, у тебя сегодня низкая активность по испанскому: всего ${todayActivities} действий при медианной норме ${medianDailyActivities} за последние ${periodText}. Давай позанимаемся испанским: это твое самое слабое место, иначе мы не разбогатеем!`;
  } else if (todayActivities === 0 && medianDailyActivities === 0) {
    trend = "INACTIVE";
    alert = "Виталий, за сегодня еще не было занятий по испанскому. Давай откроем приложение и прочитаем несколько примеров!";
  } else if (medianDailyActivities > 0 && todayActivities > medianDailyActivities * 1.3) {
    trend = "GROWING";
    praise = `Виталий, великолепный прогресс по испанскому! Твоя дневная активность значительно превышает норму: уже ${todayActivities} действий при медианной норме ${medianDailyActivities} за последние ${periodText}. Отличный темп, так держать!`;
  } else if (todayActivities >= medianDailyActivities && medianDailyActivities > 0) {
    trend = "STABLE";
    praise = `Виталий, отличная работа! Твоя дневная активность сегодня на уровне нормы: уже ${todayActivities} действий при медианной норме ${medianDailyActivities} за последние ${periodText}. Регулярность - залог успеха!`;
  }

  return {
    daysCount: days,
    averageDailyActivities,
    medianDailyActivities,
    todayActivities,
    isBelowMedian,
    shouldRemind,
    trend,
    alert,
    praise,
    dailySessions,
  };
}

/**
 * Выбирает предложения для тренировки в лайв-режиме (Gemini Gem / OpenClaw):
 * 1. В первую очередь: слова с ошибками за сегодня (ANSWER_ERROR), отсортированные по убыванию числа ошибок.
 * 2. Во вторую очередь: слова, пропущенные сегодня через кнопку Next (NEXT).
 * 3. При необходимости дополняет неизученными словами из базы до запрошенного лимита.
 *
 * @param options - параметры выборки (limit, languageId, client)
 */
export async function getTodayTrainingPhrases(options?: {
  limit?: number;
  languageId?: number;
  sessionId?: number;
  client?: PoolClient | typeof pool;
}): Promise<TrainingPhrasesData> {
  const db = options?.client || pool;
  const limit = options?.limit && options.limit > 0 ? Math.min(options.limit, 100) : 10;

  // 1. Получаем или открываем сессию текущего дня (или используем переданный sessionId в тестах)
  let sessionId = options?.sessionId || 0;
  let resolvedLanguageId = options?.languageId || 2;
  let sessionDate = new Date().toISOString().split("T")[0];

  if (!sessionId) {
    const todaySession = await getOrCreateTodaySession(db, options?.languageId);
    sessionId = todaySession.sessionId;
    resolvedLanguageId = todaySession.resolvedLanguageId;
    sessionDate = todaySession.sessionDate;
  }

  interface CandidateItem {
    wordId: number;
    reason: "error" | "skipped_next" | "unlearned";
    errorCount: number;
    lastUserAnswer: string | null;
  }

  const selectedItems: CandidateItem[] = [];
  const selectedWordIdsSet = new Set<number>();

  // 2. Шаг 1: Ошибки за сегодня (ANSWER_ERROR)
  const errorWordsRes = await db.query(
    `SELECT
       act.word_id,
       COUNT(*)::int as error_count,
       (ARRAY_AGG(act.user_answer ORDER BY act.created_at DESC))[1] as last_user_answer,
       MAX(act.created_at) as latest_activity
     FROM vy_session_activities act
     WHERE act.session_id = $1 AND act.activity_type = 'ANSWER_ERROR'
     GROUP BY act.word_id
     ORDER BY error_count DESC, latest_activity DESC
     LIMIT $2`,
    [sessionId, limit]
  );

  for (const row of errorWordsRes.rows) {
    selectedItems.push({
      wordId: row.word_id,
      reason: "error",
      errorCount: row.error_count,
      lastUserAnswer: row.last_user_answer || null,
    });
    selectedWordIdsSet.add(row.word_id);
  }

  // 3. Шаг 2: Пропущенные через кнопку Next (NEXT), если лимит еще не достигнут
  const remainingForNext = limit - selectedItems.length;
  if (remainingForNext > 0) {
    const excludedIds = Array.from(selectedWordIdsSet);
    const nextWordsRes = await db.query(
      `SELECT
         act.word_id,
         MAX(act.created_at) as latest_activity
       FROM vy_session_activities act
       WHERE act.session_id = $1 AND act.activity_type = 'NEXT'
         AND ($2::int[] IS NULL OR NOT (act.word_id = ANY($2::int[])))
       GROUP BY act.word_id
       ORDER BY latest_activity DESC
       LIMIT $3`,
      [sessionId, excludedIds.length > 0 ? excludedIds : null, remainingForNext]
    );

    for (const row of nextWordsRes.rows) {
      selectedItems.push({
        wordId: row.word_id,
        reason: "skipped_next",
        errorCount: 0,
        lastUserAnswer: null,
      });
      selectedWordIdsSet.add(row.word_id);
    }
  }

  // 4. Шаг 3: Если активностей сегодня было меньше лимита, дополняем неизученными словами
  const remainingForUnlearned = limit - selectedItems.length;
  if (remainingForUnlearned > 0) {
    const excludedIds = Array.from(selectedWordIdsSet);
    const unlearnedWordsRes = await db.query(
      `SELECT w.id as word_id
       FROM vy_words w
       WHERE w.language_id = $1
         AND ($2::int[] IS NULL OR NOT (w.id = ANY($2::int[])))
         AND NOT EXISTS (
           SELECT 1 FROM vy_answers a WHERE a.word_id = w.id AND a.is_correct = true
         )
       ORDER BY RANDOM()
       LIMIT $3`,
      [resolvedLanguageId, excludedIds.length > 0 ? excludedIds : null, remainingForUnlearned]
    );

    for (const row of unlearnedWordsRes.rows) {
      selectedItems.push({
        wordId: row.word_id,
        reason: "unlearned",
        errorCount: 0,
        lastUserAnswer: null,
      });
      selectedWordIdsSet.add(row.word_id);
    }
  }

  if (selectedItems.length === 0) {
    return {
      sessionId,
      date: sessionDate,
      languageId: resolvedLanguageId,
      totalPhrases: 0,
      errorCount: 0,
      skippedNextCount: 0,
      unlearnedCount: 0,
      phrases: [],
    };
  }

  // 5. Загружаем подробную информацию по всем выбранным словам
  const allWordIds = selectedItems.map((item) => item.wordId);
  const wordsRes = await db.query(
    `SELECT
       w.id,
       w.english,
       w.russian,
       w.example_en,
       w.example_ru,
       COALESCE(
         (SELECT array_agg(t.name)
          FROM vy_word_tags wt
          JOIN vy_tags t ON t.id = wt.tag_id
          WHERE wt.word_id = w.id),
         ARRAY[]::text[]
       ) as tags
     FROM vy_words w
     WHERE w.id = ANY($1::int[])`,
    [allWordIds]
  );

  const wordsMap = new Map<
    number,
    {
      id: number;
      english: string;
      russian: string;
      example_en: string | null;
      example_ru: string | null;
      tags: string[];
    }
  >();

  for (const row of wordsRes.rows) {
    wordsMap.set(row.id, row);
  }

  // 6. Формируем итоговый упорядоченный список фраз
  const phrases: TrainingPhrase[] = [];
  let errorCount = 0;
  let skippedNextCount = 0;
  let unlearnedCount = 0;
  let phraseIndex = 1;

  for (const item of selectedItems) {
    const word = wordsMap.get(item.wordId);
    if (!word) continue;

    if (item.reason === "error") errorCount++;
    else if (item.reason === "skipped_next") skippedNextCount++;
    else if (item.reason === "unlearned") unlearnedCount++;

    const grammar = parseWordGrammar(word.russian, word.english, word.tags);

    const russianSentence = (word.example_ru && word.example_ru.trim()) || word.russian.trim();
    const spanishSentence = (word.example_en && word.example_en.trim()) || word.english.trim();

    phrases.push({
      id: phraseIndex++,
      wordId: word.id,
      russianSentence,
      spanishSentence,
      targetWord: word.english.trim(),
      targetWordRu: word.russian.trim(),
      tense: grammar.tense,
      person: grammar.person,
      personLabel: grammar.personLabel,
      reason: item.reason,
      userErrorsCount: item.errorCount,
      lastUserAnswer: item.lastUserAnswer,
    });
  }

  return {
    sessionId,
    date: sessionDate,
    languageId: resolvedLanguageId,
    totalPhrases: phrases.length,
    errorCount,
    skippedNextCount,
    unlearnedCount,
    phrases,
  };
}
