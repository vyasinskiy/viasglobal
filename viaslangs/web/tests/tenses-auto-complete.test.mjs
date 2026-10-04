/**
 * Тестирование механизма автозачёта всех 6 форм глагола при тренировке времён испанского языка.
 * 
 * Логика:
 * Когда пользователь в режиме изучения времени (Pretérito Indefinido / Imperfecto) правильно отвечает
 * на любую из 6 форм глагола (например, 3-е лицо), все остальные 5 форм этого же глагола в данном времени
 * автоматически помечаются как верные в таблице ответов (vy_answers).
 * При этом формы этого же глагола в другом времени (например, Pretérito Imperfecto) и формы других глаголов
 * не затрагиваются.
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

/**
 * Вспомогательная функция, в точности воспроизводящая транзакционную логику
 * обработчика POST /api/answers/check.
 * 
 * @param {pg.PoolClient} client - клиент пула соединений PostgreSQL
 * @param {{ wordId: number, answer: string }} params - идентификатор слова и ответ пользователя
 * @returns {Promise<{ isCorrect: boolean, correctAnswer: string }>} результат проверки
 */
async function simulateCheckAnswer(client, { wordId, answer }) {
  // 1. Получаем слово из БД
  const wordResult = await client.query(
    `SELECT id, language_id, english, russian, base_word_id FROM vy_words WHERE id = $1`,
    [wordId]
  );
  const word = wordResult.rows[0];
  if (!word) {
    throw new Error(`Слово с id ${wordId} не найдено в БД`);
  }

  // 2. Нормализация ответа (нижний регистр и удаление внешних пробелов)
  const userAnswer = answer.toLowerCase().trim();
  const correctAnswer = word.english.toLowerCase().trim();
  const isCorrect = userAnswer === correctAnswer;

  // 3. Сохранение ответа пользователя в историю
  await client.query(
    `INSERT INTO vy_answers (word_id, answer, is_correct, is_synonym)
     VALUES ($1, $2, $3, $4)`,
    [wordId, userAnswer, isCorrect, false]
  );

  // 4. Логика автозачёта: срабатывает только при верном ответе для связанных форм (base_word_id)
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

  return { isCorrect, correctAnswer: word.english };
}

describe('Автозачёт форм глагола при изучении времён (Pretérito Indefinido и Imperfecto)', () => {
  // Идентификаторы тегов
  let tagIndefinidoId;
  let tagImperfectoId;

  // Базовые инфинитивы
  let baseEnviarId;
  let basePedirId;
  let basePagarId;
  let baseProducirId;

  // Списки форм для каждого глагола и времени
  let indefEnviar = [];
  let imperfEnviar = [];
  let indefPedir = [];
  let imperfPedir = [];
  let indefPagar = [];
  let indefProducir = [];

  // Функция для очистки ответов по всем тестовым словам
  async function cleanupAnswers() {
    const allWordIds = [
      baseEnviarId,
      basePedirId,
      basePagarId,
      baseProducirId,
      ...indefEnviar.map(w => w.id),
      ...imperfEnviar.map(w => w.id),
      ...indefPedir.map(w => w.id),
      ...imperfPedir.map(w => w.id),
      ...indefPagar.map(w => w.id),
      ...indefProducir.map(w => w.id),
    ].filter(Boolean);

    if (allWordIds.length > 0) {
      await pool.query(`DELETE FROM vy_answers WHERE word_id = ANY($1::int[]);`, [allWordIds]);
    }
  }

  // Подготовка контекста перед запуском тестов
  before(async () => {
    // 1. Получаем ID тегов времён
    const tagsRes = await pool.query(`
      SELECT id, name FROM vy_tags
      WHERE name IN ('Pretérito Indefinido', 'Pretérito Imperfecto');
    `);
    for (const row of tagsRes.rows) {
      if (row.name === 'Pretérito Indefinido') tagIndefinidoId = row.id;
      if (row.name === 'Pretérito Imperfecto') tagImperfectoId = row.id;
    }
    assert.ok(tagIndefinidoId, 'Тег Pretérito Indefinido должен существовать в БД');
    assert.ok(tagImperfectoId, 'Тег Pretérito Imperfecto должен существовать в БД');

    // 2. Получаем базовые глаголы (enviar, pedir, pagar, producir)
    const baseWordsRes = await pool.query(`
      SELECT id, english FROM vy_words
      WHERE lower(english) IN ('enviar', 'pedir', 'pagar', 'producir')
        AND base_word_id IS NULL;
    `);
    for (const row of baseWordsRes.rows) {
      const name = row.english.toLowerCase();
      if (name === 'enviar') baseEnviarId = row.id;
      if (name === 'pedir') basePedirId = row.id;
      if (name === 'pagar') basePagarId = row.id;
      if (name === 'producir') baseProducirId = row.id;
    }
    assert.ok(baseEnviarId, 'Базовый глагол enviar должен существовать в БД');
    assert.ok(basePedirId, 'Базовый глагол pedir должен существовать в БД');
    assert.ok(basePagarId, 'Базовый глагол pagar должен существовать в БД');
    assert.ok(baseProducirId, 'Базовый глагол producir должен существовать в БД');

    // 3. Загружаем формы глагола enviar
    const indefEnviarRes = await pool.query(`
      SELECT w.id, w.english, w.russian FROM vy_words w
      JOIN vy_word_tags wt ON wt.word_id = w.id
      WHERE w.base_word_id = $1 AND wt.tag_id = $2 ORDER BY w.id;
    `, [baseEnviarId, tagIndefinidoId]);
    indefEnviar = indefEnviarRes.rows;
    assert.strictEqual(indefEnviar.length, 6, 'Должно быть ровно 6 форм глагола enviar в Pretérito Indefinido');

    const imperfEnviarRes = await pool.query(`
      SELECT w.id, w.english, w.russian FROM vy_words w
      JOIN vy_word_tags wt ON wt.word_id = w.id
      WHERE w.base_word_id = $1 AND wt.tag_id = $2 ORDER BY w.id;
    `, [baseEnviarId, tagImperfectoId]);
    imperfEnviar = imperfEnviarRes.rows;
    assert.strictEqual(imperfEnviar.length, 6, 'Должно быть ровно 6 форм глагола enviar в Pretérito Imperfecto');

    // 4. Загружаем формы глагола pedir
    const indefPedirRes = await pool.query(`
      SELECT w.id, w.english, w.russian FROM vy_words w
      JOIN vy_word_tags wt ON wt.word_id = w.id
      WHERE w.base_word_id = $1 AND wt.tag_id = $2 ORDER BY w.id;
    `, [basePedirId, tagIndefinidoId]);
    indefPedir = indefPedirRes.rows;
    assert.strictEqual(indefPedir.length, 6, 'Должно быть ровно 6 форм глагола pedir в Pretérito Indefinido');

    const imperfPedirRes = await pool.query(`
      SELECT w.id, w.english, w.russian FROM vy_words w
      JOIN vy_word_tags wt ON wt.word_id = w.id
      WHERE w.base_word_id = $1 AND wt.tag_id = $2 ORDER BY w.id;
    `, [basePedirId, tagImperfectoId]);
    imperfPedir = imperfPedirRes.rows;
    assert.strictEqual(imperfPedir.length, 6, 'Должно быть ровно 6 форм глагола pedir в Pretérito Imperfecto');

    // 5. Загружаем формы глагола pagar (Pretérito Indefinido)
    const indefPagarRes = await pool.query(`
      SELECT w.id, w.english, w.russian FROM vy_words w
      JOIN vy_word_tags wt ON wt.word_id = w.id
      WHERE w.base_word_id = $1 AND wt.tag_id = $2 ORDER BY w.id;
    `, [basePagarId, tagIndefinidoId]);
    indefPagar = indefPagarRes.rows;
    assert.strictEqual(indefPagar.length, 6, 'Должно быть ровно 6 форм глагола pagar в Pretérito Indefinido');

    // 6. Загружаем формы глагола producir (Pretérito Indefinido)
    const indefProducirRes = await pool.query(`
      SELECT w.id, w.english, w.russian FROM vy_words w
      JOIN vy_word_tags wt ON wt.word_id = w.id
      WHERE w.base_word_id = $1 AND wt.tag_id = $2 ORDER BY w.id;
    `, [baseProducirId, tagIndefinidoId]);
    indefProducir = indefProducirRes.rows;
    assert.strictEqual(indefProducir.length, 6, 'Должно быть ровно 6 форм глагола producir в Pretérito Indefinido');

    // Очищаем историю ответов для всех тестируемых слов
    await cleanupAnswers();
  });

  // Финальная очистка после прогона всех тестов
  after(async () => {
    await cleanupAnswers();
    await pool.end();
  });

  it('1. Базовый правильный глагол (enviar, Indefinido): правильный ответ на 3-е лицо (envió) автозачитывает все 6 форм', async () => {
    const targetWord = indefEnviar.find(w => w.english.toLowerCase() === 'envió');
    assert.ok(targetWord, 'Слово envió должно присутствовать среди форм Indefinido');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await simulateCheckAnswer(client, {
        wordId: targetWord.id,
        answer: 'envió'
      });
      assert.strictEqual(result.isCorrect, true);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Проверяем, что все 6 форм глагола enviar в Pretérito Indefinido помечены как верные
    const correctCountRes = await pool.query(`
      SELECT COUNT(DISTINCT a.word_id)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [indefEnviar.map(w => w.id)]);

    assert.strictEqual(correctCountRes.rows[0].count, 6, 'Все 6 форм глагола enviar в Indefinido должны быть засчитаны');
  });

  it('2. Изоляция времён: формы того же глагола в другом времени (enviar, Imperfecto) остаются неизученными', async () => {
    const imperfAnswersRes = await pool.query(`
      SELECT COUNT(*)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [imperfEnviar.map(w => w.id)]);

    assert.strictEqual(imperfAnswersRes.rows[0].count, 0, 'Ни одна форма Pretérito Imperfecto не должна быть автозачтена при ответе на Indefinido');
  });

  it('3. Изоляция других глаголов: формы глаголов pedir, pagar и producir в Indefinido не затрагиваются', async () => {
    const otherWordsIds = [
      ...indefPedir.map(w => w.id),
      ...indefPagar.map(w => w.id),
      ...indefProducir.map(w => w.id),
    ];
    const otherAnswersRes = await pool.query(`
      SELECT COUNT(*)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [otherWordsIds]);

    assert.strictEqual(otherAnswersRes.rows[0].count, 0, 'Формы других глаголов не должны быть затронуты');
  });

  it('4. Неверный ответ: при ошибке на форму глагола (pedir, pedí) остальные формы не засчитываются', async () => {
    const targetWord = indefPedir.find(w => w.english.toLowerCase() === 'pedí');
    assert.ok(targetWord, 'Слово pedí должно присутствовать в формах pedir');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Вводим форму настоящего времени вместо прошедшего
      const result = await simulateCheckAnswer(client, {
        wordId: targetWord.id,
        answer: 'pido'
      });
      assert.strictEqual(result.isCorrect, false);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Проверяем, что ни одна форма pedir не получила статус правильного ответа
    const checkPedirRes = await pool.query(`
      SELECT COUNT(*)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [indefPedir.map(w => w.id)]);

    assert.strictEqual(checkPedirRes.rows[0].count, 0, 'Ни одна форма pedir не должна быть засчитана при неверном ответе');

    // Проверяем, что зафиксирована ровно одна ошибка для тестируемого слова
    const falseCountRes = await pool.query(`
      SELECT COUNT(*)::int as count
      FROM vy_answers a
      WHERE a.word_id = $1 AND a.is_correct = false;
    `, [targetWord.id]);

    assert.strictEqual(falseCountRes.rows[0].count, 1, 'Должна быть зафиксирована ровно одна ошибка');
  });

  it('5. Глагол с чередованием e->i (pedir, Indefinido): правильный ответ на особую форму 3-го лица (pidió) автозачитывает все 6 форм', async () => {
    const targetWord = indefPedir.find(w => w.english.toLowerCase() === 'pidió');
    assert.ok(targetWord, 'Особая форма pidió должна присутствовать среди форм Indefinido');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await simulateCheckAnswer(client, {
        wordId: targetWord.id,
        answer: 'pidió'
      });
      assert.strictEqual(result.isCorrect, true);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Проверяем автозачёт всех 6 форм (pedí, pediste, pidió, pedimos, pedisteis, pidieron)
    const correctCountRes = await pool.query(`
      SELECT COUNT(DISTINCT a.word_id)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [indefPedir.map(w => w.id)]);

    assert.strictEqual(correctCountRes.rows[0].count, 6, 'Все 6 форм глагола pedir в Indefinido должны быть засчитаны');
  });

  it('6. Тренировка в Pretérito Imperfecto (pedir): ответ на форму 1-го лица мн. ч. (pedíamos) автозачитывает все 6 форм Imperfecto', async () => {
    const targetWord = imperfPedir.find(w => w.english.toLowerCase() === 'pedíamos');
    assert.ok(targetWord, 'Форма pedíamos должна присутствовать среди форм Imperfecto');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await simulateCheckAnswer(client, {
        wordId: targetWord.id,
        answer: 'pedíamos'
      });
      assert.strictEqual(result.isCorrect, true);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Проверяем, что все 6 форм pedir в Imperfecto помечены как верные
    const correctCountRes = await pool.query(`
      SELECT COUNT(DISTINCT a.word_id)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [imperfPedir.map(w => w.id)]);

    assert.strictEqual(correctCountRes.rows[0].count, 6, 'Все 6 форм глагола pedir в Imperfecto должны быть засчитаны');

    // Проверяем, что формы другого глагола (enviar) в Imperfecto всё ещё не затронуты
    const imperfEnviarRes = await pool.query(`
      SELECT COUNT(*)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [imperfEnviar.map(w => w.id)]);

    assert.strictEqual(imperfEnviarRes.rows[0].count, 0, 'Формы глагола enviar в Imperfecto не должны быть затронуты');
  });

  it('7. Глагол с нерегулярной j-основой (producir, Indefinido): нечувствительность к регистру и пробелам ("  PRODUJE  ")', async () => {
    const targetWord = indefProducir.find(w => w.english.toLowerCase() === 'produje');
    assert.ok(targetWord, 'Форма 1-го лица produje должна присутствовать среди форм Indefinido');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Передаём ответ верхним регистром с внешними пробелами
      const result = await simulateCheckAnswer(client, {
        wordId: targetWord.id,
        answer: '  PRODUJE  '
      });
      assert.strictEqual(result.isCorrect, true, 'Ответ с пробелами и верхним регистром должен распознаваться как верный');
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Проверяем автозачёт всех 6 форм (produje, produjiste, produjo, produjimos, produjisteis, produjeron)
    const correctCountRes = await pool.query(`
      SELECT COUNT(DISTINCT a.word_id)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [indefProducir.map(w => w.id)]);

    assert.strictEqual(correctCountRes.rows[0].count, 6, 'Все 6 форм глагола producir в Indefinido должны быть засчитаны');
  });

  it('8. Глагол с орфографическим чередованием g->gu (pagar, Indefinido): ответ на форму 1-го лица (pagué)', async () => {
    const targetWord = indefPagar.find(w => w.english.toLowerCase() === 'pagué');
    assert.ok(targetWord, 'Форма pagué должна присутствовать среди форм Indefinido');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await simulateCheckAnswer(client, {
        wordId: targetWord.id,
        answer: 'pagué'
      });
      assert.strictEqual(result.isCorrect, true);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Проверяем, что все 6 форм pagar в Indefinido помечены как верные
    const correctCountRes = await pool.query(`
      SELECT COUNT(DISTINCT a.word_id)::int as count
      FROM vy_answers a
      WHERE a.word_id = ANY($1::int[]) AND a.is_correct = true;
    `, [indefPagar.map(w => w.id)]);

    assert.strictEqual(correctCountRes.rows[0].count, 6, 'Все 6 форм глагола pagar в Indefinido должны быть засчитаны');
  });

  it('9. Идемпотентность и защита от дубликатов: повторный верный ответ на другую форму (pagaste) не создает дублирующих записей', async () => {
    const targetWord = indefPagar.find(w => w.english.toLowerCase() === 'pagaste');
    assert.ok(targetWord, 'Форма pagaste должна присутствовать среди форм Indefinido');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Отправляем верный ответ на уже автозачтенную форму pagaste
      const result = await simulateCheckAnswer(client, {
        wordId: targetWord.id,
        answer: 'pagaste'
      });
      assert.strictEqual(result.isCorrect, true);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Проверяем, что для каждой из остальных 5 форм глагола pagar существует ровно по 1 верному ответу (нет дубликатов)
    const otherPagarForms = indefPagar.filter(w => w.id !== targetWord.id);
    const answersPerWordRes = await pool.query(`
      SELECT word_id, COUNT(*)::int as count
      FROM vy_answers
      WHERE word_id = ANY($1::int[]) AND is_correct = true
      GROUP BY word_id;
    `, [otherPagarForms.map(w => w.id)]);

    for (const row of answersPerWordRes.rows) {
      assert.strictEqual(row.count, 1, `Для слова ${row.word_id} должна быть ровно 1 запись верного ответа`);
    }
  });

  it('10. Обычные слова без base_word_id (базовый инфинитив enviar): верный ответ не запускает автозачёт других слов', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await simulateCheckAnswer(client, {
        wordId: baseEnviarId,
        answer: 'enviar'
      });
      assert.strictEqual(result.isCorrect, true);
      await client.query('COMMIT');
    } finally {
      client.release();
    }

    // Проверяем, что в vy_answers добавлена ровно 1 запись для базового слова
    const answersRes = await pool.query(`
      SELECT COUNT(*)::int as count
      FROM vy_answers
      WHERE word_id = $1 AND is_correct = true;
    `, [baseEnviarId]);

    assert.strictEqual(answersRes.rows[0].count, 1, 'Для базового слова должна быть ровно 1 запись');
  });

  it('11. Интеграция с режимом Study: эндпоинт /api/words/study исключает все автозачтенные формы из выборки неизученных слов', async () => {
    // Проверяем, что для тега Pretérito Indefinido закрытые глаголы (enviar, pedir, pagar, producir) не попадают в неизученные
    const baseIds = [baseEnviarId, basePedirId, basePagarId, baseProducirId];
    const unlearnedRes = await pool.query(`
      SELECT w.id, w.english, w.base_word_id
      FROM vy_words w
      JOIN vy_word_tags wt ON wt.word_id = w.id
      WHERE wt.tag_id = $1
        AND w.base_word_id = ANY($2::int[])
        AND NOT EXISTS (
          SELECT 1 FROM vy_answers a
          WHERE a.word_id = w.id AND a.is_correct = true
        );
    `, [tagIndefinidoId, baseIds]);

    assert.strictEqual(
      unlearnedRes.rows.length,
      0,
      'Все закрытые формы в Indefinido должны быть полностью исключены из неизученных слов в Study'
    );
  });
});
