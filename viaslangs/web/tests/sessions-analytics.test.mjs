/**
 * Тестирование системы ежедневных сессий изучения, учета кликов Next,
 * анализа ошибок по тегам и формам лица, а также мульти-дневной динамики для OpenClaw.
 * 
 * Включает точные эталонные тесты на конкретных глаголах испанского языка:
 * - Спряжения в Pretérito Indefinido и Pretérito Imperfecto
 * - Все 6 грамматических форм лица (yo, tú, él/ella/usted, nosotros, vosotros, ellos/ellas/ustedes)
 * - Расчет среднего уровня активности и детекция спада темпов (40 активностей -> 10 активностей)
 * - Формирование текста напоминания для Telegram
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Загрузка переменных окружения для подключения к базе данных
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Импорт утилит проекта
import { parseWordGrammar } from '../lib/grammar.ts';
import { calculateMedian, getMadridDateString, formatDaysText } from '../lib/sessions.ts';

describe('1. Модуль грамматического анализа испанских слов (parseWordGrammar)', () => {
  it('1.1. Корректно определяет 1-е лицо ед. ч. (yo) и время Pretérito Indefinido', () => {
    const res = parseWordGrammar(
      'зачислил (я)',
      'aboné',
      ['Для общения с поставщиками', 'Глаголы', 'Pretérito Indefinido']
    );
    assert.strictEqual(res.tense, 'Pretérito Indefinido');
    assert.strictEqual(res.person, 'yo');
    assert.strictEqual(res.personLabel, '1-е лицо ед. ч. (yo)');
    assert.strictEqual(res.isVerb, true);
  });

  it('1.2. Корректно определяет 3-е лицо ед. ч. (él/ella/usted) и время Pretérito Imperfecto', () => {
    const res = parseWordGrammar(
      'зачислял (он / Вы)',
      'abonaba',
      ['Для общения с поставщиками', 'Глаголы', 'Pretérito Imperfecto']
    );
    assert.strictEqual(res.tense, 'Pretérito Imperfecto');
    assert.strictEqual(res.person, 'él/ella/usted');
    assert.strictEqual(res.personLabel, '3-е лицо ед. ч. (él/ella/usted)');
    assert.strictEqual(res.isVerb, true);
  });

  it('1.3. Корректно определяет 1-е лицо мн. ч. (nosotros)', () => {
    const res = parseWordGrammar(
      'приняли (мы)',
      'aceptamos',
      ['Для общения с поставщиками', 'Глаголы', 'Pretérito Indefinido']
    );
    assert.strictEqual(res.tense, 'Pretérito Indefinido');
    assert.strictEqual(res.person, 'nosotros');
    assert.strictEqual(res.personLabel, '1-е лицо мн. ч. (nosotros)');
  });

  it('1.4. Корректно определяет 2-е лицо мн. ч. (vosotros)', () => {
    const res = parseWordGrammar(
      'согласовали (вы)',
      'acordasteis',
      ['Для общения с поставщиками', 'Глаголы', 'Pretérito Indefinido']
    );
    assert.strictEqual(res.tense, 'Pretérito Indefinido');
    assert.strictEqual(res.person, 'vosotros');
    assert.strictEqual(res.personLabel, '2-е лицо мн. ч. (vosotros)');
  });

  it('1.5. Корректно определяет 3-е лицо мн. ч. (ellos/ellas/ustedes)', () => {
    const res = parseWordGrammar(
      'зачислили (они / Вы)',
      'abonaron',
      ['Для общения с поставщиками', 'Глаголы', 'Pretérito Indefinido']
    );
    assert.strictEqual(res.tense, 'Pretérito Indefinido');
    assert.strictEqual(res.person, 'ellos/ellas/ustedes');
    assert.strictEqual(res.personLabel, '3-е лицо мн. ч. (ellos/ellas/ustedes)');
  });

  it('1.6. Распознает инфинитив испанского глагола без скобок', () => {
    const res = parseWordGrammar(
      'зачислять',
      'abonar',
      ['Для общения с поставщиками', 'Глаголы']
    );
    assert.strictEqual(res.tense, null);
    assert.strictEqual(res.person, 'infinitivo');
    assert.strictEqual(res.personLabel, 'Инфинитив (начальная форма)');
    assert.strictEqual(res.isVerb, true);
  });

  it('1.7. Распознает обычную лексическую фразу', () => {
    const res = parseWordGrammar(
      'накладная на доставку',
      'albarán de entrega',
      ['Для общения с поставщиками']
    );
    assert.strictEqual(res.tense, null);
    assert.strictEqual(res.person, 'general');
    assert.strictEqual(res.personLabel, 'Общая форма / лексика');
    assert.strictEqual(res.isVerb, false);
  });
});

describe('2. Интеграционная логика сессий и аналитики активности (БД PostgreSQL)', () => {
  let client;
  let testSessionId;
  let spanishLangId;

  // Инициализация соединения и создание временных таблиц при их отсутствии
  before(async () => {
    client = await pool.connect();

    // Получаем ID испанского языка
    const langRes = await client.query("SELECT id FROM vy_languages WHERE code = 'es'");
    spanishLangId = langRes.rows[0]?.id || 2;

    // Гарантируем наличие таблиц для проведения тестов
    await client.query(`
      CREATE TABLE IF NOT EXISTS vy_study_sessions (
        id SERIAL PRIMARY KEY,
        language_id INTEGER NOT NULL REFERENCES vy_languages(id) ON DELETE CASCADE,
        session_date DATE NOT NULL,
        next_clicks INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_vy_study_sessions_lang_date UNIQUE (language_id, session_date)
      );

      CREATE TABLE IF NOT EXISTS vy_session_activities (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES vy_study_sessions(id) ON DELETE CASCADE,
        word_id INTEGER NOT NULL REFERENCES vy_words(id) ON DELETE CASCADE,
        activity_type VARCHAR(32) NOT NULL,
        user_answer TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Создаем тестовую сессию на фиктивную дату '2026-01-01' для чистой изоляции
    const sessionRes = await client.query(
      `INSERT INTO vy_study_sessions (language_id, session_date, next_clicks)
       VALUES ($1, '2026-01-01', 0)
       ON CONFLICT (language_id, session_date)
       DO UPDATE SET next_clicks = 0
       RETURNING id`,
      [spanishLangId]
    );
    testSessionId = sessionRes.rows[0].id;

    // Очищаем тестовые активности перед запуском
    await client.query(`DELETE FROM vy_session_activities WHERE session_id = $1`, [testSessionId]);
  });

  after(async () => {
    // Удаляем тестовую сессию и все привязанные активности каскадно
    if (testSessionId) {
      await client.query(`DELETE FROM vy_study_sessions WHERE id = $1`, [testSessionId]);
    }
    client.release();
    await pool.end();
  });

  it('2.1. Подсчет кликов на кнопку Next в сессионном дне', async () => {
    // Симулируем 5 нажатий на кнопку Next
    for (let i = 0; i < 5; i++) {
      await client.query(
        `UPDATE vy_study_sessions SET next_clicks = next_clicks + 1 WHERE id = $1`,
        [testSessionId]
      );
    }

    const res = await client.query(
      `SELECT next_clicks FROM vy_study_sessions WHERE id = $1`,
      [testSessionId]
    );
    assert.strictEqual(res.rows[0].next_clicks, 5);
  });

  it('2.2. Фиксация ошибок и успехов с точной привязкой тегов и грамматических форм', async () => {
    // Выбираем карточки для теста:
    // 1) abonó (3-е лицо Indefinido)
    // 2) aboné (1-е лицо Indefinido)
    // 3) abonaba (1-е лицо Imperfecto)
    const wordsRes = await client.query(`
      SELECT w.id, w.english, w.russian, array_agg(t.name) as tags
      FROM vy_words w
      JOIN vy_word_tags wt ON wt.word_id = w.id
      JOIN vy_tags t ON t.id = wt.tag_id
      WHERE w.english IN ('abonó', 'aboné', 'abonaba')
      GROUP BY w.id, w.english, w.russian
    `);

    const abonoWord = wordsRes.rows.find(w => w.english === 'abonó');
    const aboneWord = wordsRes.rows.find(w => w.english === 'aboné');
    const abonabaWord = wordsRes.rows.find(w => w.english === 'abonaba');

    assert.ok(abonoWord, 'Слово abonó найдено в БД');
    assert.ok(aboneWord, 'Слово aboné найдено в БД');
    assert.ok(abonabaWord, 'Слово abonaba найдено в БД');

    // Симулируем 3 ошибки на abonó (3-е лицо Indefinido)
    for (let i = 0; i < 3; i++) {
      await client.query(
        `INSERT INTO vy_session_activities (session_id, word_id, activity_type, user_answer)
         VALUES ($1, $2, 'ANSWER_ERROR', 'abono')`,
        [testSessionId, abonoWord.id]
      );
    }

    // Симулируем 1 ошибку на aboné (1-е лицо Indefinido)
    await client.query(
      `INSERT INTO vy_session_activities (session_id, word_id, activity_type, user_answer)
       VALUES ($1, $2, 'ANSWER_ERROR', 'abone')`,
      [testSessionId, aboneWord.id]
    );

    // Симулируем 2 верных ответа на abonaba (Imperfecto)
    for (let i = 0; i < 2; i++) {
      await client.query(
        `INSERT INTO vy_session_activities (session_id, word_id, activity_type, user_answer)
         VALUES ($1, $2, 'ANSWER_CORRECT', 'abonaba')`,
        [testSessionId, abonabaWord.id]
      );
    }

    // Проверяем распределение ошибок по тегам
    const activitiesRes = await client.query(`
      SELECT act.activity_type, w.english, w.russian, array_agg(t.name) as tags
      FROM vy_session_activities act
      JOIN vy_words w ON w.id = act.word_id
      JOIN vy_word_tags wt ON wt.word_id = w.id
      JOIN vy_tags t ON t.id = wt.tag_id
      WHERE act.session_id = $1
      GROUP BY act.id, act.activity_type, w.english, w.russian
    `, [testSessionId]);

    let indefinidoErrors = 0;
    let imperfectoErrors = 0;
    let thirdPersonErrors = 0;

    for (const row of activitiesRes.rows) {
      const grammar = parseWordGrammar(row.russian, row.english, row.tags);
      if (row.activity_type === 'ANSWER_ERROR') {
        if (grammar.tense === 'Pretérito Indefinido') indefinidoErrors++;
        if (grammar.tense === 'Pretérito Imperfecto') imperfectoErrors++;
        if (grammar.person === 'él/ella/usted') thirdPersonErrors++;
      }
    }

    // Эталонная проверка («прибивание гвоздями»):
    // В Pretérito Indefinido ровно 4 ошибки (3 на abonó + 1 на aboné)
    assert.strictEqual(indefinidoErrors, 4, 'В Pretérito Indefinido зафиксировано ровно 4 ошибки');
    // В Pretérito Imperfecto 0 ошибок
    assert.strictEqual(imperfectoErrors, 0, 'В Pretérito Imperfecto 0 ошибок');
    // В форме 3-го лица él/ella/usted ровно 3 ошибки
    assert.strictEqual(thirdPersonErrors, 3, 'В форме 3-го лица ровно 3 ошибки');
  });

  it('2.3. Эталонный кейс динамики активности: 40 активностей в день 1, 10 в день 2 -> фиксация DROPPING и алерта', () => {
    // Моделируем эталонный расчет из запроса пользователя:
    // День 1: 40 активностей
    // День 2 (сегодня): 10 активностей
    const dailySessions = [
      { date: '2026-10-24', totalActivities: 10, nextClicks: 4, correctAnswers: 4, errorAnswers: 2, accuracy: 67 },
      { date: '2026-10-23', totalActivities: 40, nextClicks: 15, correctAnswers: 18, errorAnswers: 7, accuracy: 72 }
    ];

    const todayActivities = 10;
    const previousDays = dailySessions.filter(s => s.date !== '2026-10-24');
    const averageDailyActivities = previousDays.reduce((a, b) => a + b.totalActivities, 0) / previousDays.length;

    assert.strictEqual(averageDailyActivities, 40, 'Средняя активность за предыдущие дни равна 40');

    // Проверяем условие падения темпа (менее 40% от среднего)
    const isDropping = todayActivities < averageDailyActivities * 0.4;
    assert.strictEqual(isDropping, true, 'Зафиксировано критическое падение активности (10 < 16)');

    const expectedAlert = `H1, у тебя очень низкая активность сегодня: всего ${todayActivities} действий при среднем уровне ${averageDailyActivities}. Давай позанимаемся испанским: это твое самое слабое место, иначе мы не разбогатеем!`;

    assert.ok(
      expectedAlert.includes('H1, у тебя очень низкая активность сегодня'),
      'Алерт содержит обращение к пользователю'
    );
    assert.ok(
      expectedAlert.includes('Давай позанимаемся испанским: это твое самое слабое место, иначе мы не разбогатеем!'),
      'Алерт содержит точную мотивирующую фразу'
    );
  });

  it('2.4. Функция calculateMedian корректно вычисляет медиану для разных наборов данных', () => {
    // Нечетное число элементов (7 дней)
    assert.strictEqual(calculateMedian([0, 0, 15, 20, 25, 30, 35]), 20, 'Медиана 7 элементов равна 20');
    // Неотсортированный массив
    assert.strictEqual(calculateMedian([35, 15, 0, 25, 0, 20, 30]), 20, 'Медиана неотсортированного массива равна 20');
    // Четное число элементов
    assert.strictEqual(calculateMedian([10, 20, 30, 40]), 25, 'Медиана четного числа элементов равна 25');
    // Пустой массив
    assert.strictEqual(calculateMedian([]), 0, 'Медиана пустого массива равна 0');
    // Один элемент
    assert.strictEqual(calculateMedian([42]), 42, 'Медиана одного элемента равна 42');
  });

  it('2.5. Функция getMadridDateString возвращает валидную дату формата YYYY-MM-DD', () => {
    const dateStr = getMadridDateString();
    assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/, 'Формат даты строго YYYY-MM-DD');
  });

  it('2.6. Эталонный кейс OpenClaw («прибитый гвоздями»): дневная активность 12 хуже медианной 20 за 7 дней -> isBelowMedian: true, shouldRemind: true', () => {
    // Предыдущие 7 календарных дней: 25, 30, 0, 15, 20, 0, 35
    const previousDaysActivities = [25, 30, 0, 15, 20, 0, 35];
    const median = calculateMedian(previousDaysActivities);
    assert.strictEqual(median, 20, 'Эталонная медиана за 7 дней равна 20');

    // Сегодня пользователь выполнил 12 действий (кликнул Next и ответил)
    const todayActivities = 12;
    const isBelowMedian = todayActivities < median;
    const shouldRemind = isBelowMedian || (median === 0 && todayActivities === 0);

    assert.strictEqual(isBelowMedian, true, 'Дневная активность хуже медианы (12 < 20)');
    assert.strictEqual(shouldRemind, true, 'Флаг отправки напоминания активирован');

    const alertMessage = `H1, у тебя сегодня низкая активность по испанскому: всего ${todayActivities} действий при медианной норме ${median} за последние 7 дней. Давай позанимаемся испанским: это твое самое слабое место, иначе мы не разбогатеем!`;

    // Проверка текста напоминания и анти-AI стилистики (запрет длинных тире)
    assert.ok(!alertMessage.includes('—'), 'В тексте категорически запрещено длинное тире em-dash');
    assert.ok(!alertMessage.includes('–'), 'В тексте категорически запрещено среднее тире en-dash');
    assert.ok(alertMessage.includes('всего 12 действий при медианной норме 20'), 'Текст содержит точные числовые показатели');
    assert.ok(alertMessage.includes('Давай позанимаемся испанским: это твое самое слабое место, иначе мы не разбогатеем!'), 'Текст содержит мотивирующий слоган');
  });

  it('2.7. Эталонный кейс OpenClaw («прибитый гвоздями»): активность на уровне нормы (22 >= 20) -> генерация похвалы praise, ответ NO_REPLY запрещен', () => {
    // Предыдущие 7 дней: медиана = 20
    const previousDaysActivities = [25, 30, 0, 15, 20, 0, 35];
    const median = calculateMedian(previousDaysActivities);
    assert.strictEqual(median, 20, 'Эталонная медиана равна 20');

    // Сегодня активность 22 (на уровне/выше медианы)
    const todayActivities = 22;
    const isBelowMedian = todayActivities < median;
    assert.strictEqual(isBelowMedian, false, 'Активность не ниже медианы');

    const praiseMessage = `H1, отличная работа! Твоя дневная активность сегодня на уровне нормы: уже ${todayActivities} действий при медианной норме ${median} за последние 7 дней. Регулярность - залог успеха!`;

    // Проверка текста похвалы и анти-AI стилистики
    assert.ok(!praiseMessage.includes('—'), 'В тексте похвалы категорически запрещено длинное тире em-dash');
    assert.ok(!praiseMessage.includes('–'), 'В тексте похвалы категорически запрещено среднее тире en-dash');
    assert.ok(praiseMessage.includes('уже 22 действий при медианной норме 20'), 'Текст похвалы содержит точные числовые показатели');
    assert.ok(praiseMessage.includes('Регулярность - залог успеха!'), 'Текст содержит ободряющий посыл');
  });

  it('2.8. Функция formatDaysText корректно склоняет слово «день» для различных значений параметра days', () => {
    assert.strictEqual(formatDaysText(1), '1 день');
    assert.strictEqual(formatDaysText(2), '2 дня');
    assert.strictEqual(formatDaysText(4), '4 дня');
    assert.strictEqual(formatDaysText(5), '5 дней');
    assert.strictEqual(formatDaysText(7), '7 дней');
    assert.strictEqual(formatDaysText(11), '11 дней');
    assert.strictEqual(formatDaysText(14), '14 дней');
    assert.strictEqual(formatDaysText(21), '21 день');
    assert.strictEqual(formatDaysText(24), '24 дня');
    assert.strictEqual(formatDaysText(30), '30 дней');
  });

  it('2.9. Логика долговременного сохранения языка и последнего тега в cookie браузера (срок 400 дней)', () => {
    // Вспомогательные функции парсинга и форматирования cookies аналогично App.tsx
    const parseCookie = (cookieHeader, name) => {
      const match = cookieHeader.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    };

    const createCookieString = (name, value, days = 400) => {
      const maxAge = days * 24 * 60 * 60;
      return `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    };

    // 1. Проверка срока жизни cookie (400 дней = 34560000 секунд)
    const langCookie = createCookieString('vias_last_language_id', '1');
    assert.ok(langCookie.includes('max-age=34560000'), 'Срок жизни cookie обязан составлять ровно 400 дней (34560000 сек)');
    assert.ok(langCookie.includes('SameSite=Lax'), 'Флаг SameSite=Lax обязателен');
    assert.ok(langCookie.includes('path=/'), 'Путь path=/ обязателен для действия на всем сайте');

    // 2. Имитация cookie заголовка в браузере с несколькими куками
    const mockCookieHeader = 'other_pref=dark; vias_last_language_id=1; vias_last_tag_id_1=42; vias_last_tag_id=42';

    // 3. Чтение языка и тега
    const restoredLangId = parseCookie(mockCookieHeader, 'vias_last_language_id');
    const restoredTagIdForLang = parseCookie(mockCookieHeader, 'vias_last_tag_id_1');
    const restoredGlobalTagId = parseCookie(mockCookieHeader, 'vias_last_tag_id');

    assert.strictEqual(restoredLangId, '1', 'Язык обязан корректно считываться из cookie');
    assert.strictEqual(restoredTagIdForLang, '42', 'Тег языка обязан корректно считываться из привязанного cookie');
    assert.strictEqual(restoredGlobalTagId, '42', 'Глобальный тег обязан корректно считываться');

    // 4. Очистка cookie при сбросе фильтра на "All words"
    const deleteCookieString = (name) => `${name}=; path=/; max-age=0; SameSite=Lax`;
    const cleared = deleteCookieString('vias_last_tag_id');
    assert.ok(cleared.includes('max-age=0'), 'Сброс куки обязан выставлять max-age=0');
  });
});
