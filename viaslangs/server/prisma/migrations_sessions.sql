-- ==============================================================================
-- Миграция: Таблицы сессий изучения языков и журнала активности пользователя
-- Подпроект: Viaslangs
-- Описание:
--   1. vy_study_sessions - ежедневные сессионные дни (учет даты, языка, кликов Next)
--   2. vy_session_activities - журнал действий (клики Next, успешные ответы, ошибки с привязкой к словам)
-- ==============================================================================

-- 1. Таблица ежедневных сессионных дней
CREATE TABLE IF NOT EXISTS vy_study_sessions (
  id SERIAL PRIMARY KEY,
  language_id INTEGER NOT NULL REFERENCES vy_languages(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  next_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_vy_study_sessions_lang_date UNIQUE (language_id, session_date)
);

-- Индекс для быстрой выборки по диапазону дат
CREATE INDEX IF NOT EXISTS idx_vy_study_sessions_date ON vy_study_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_vy_study_sessions_lang ON vy_study_sessions(language_id);

-- 2. Таблица детального журнала активностей сессии
CREATE TABLE IF NOT EXISTS vy_session_activities (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES vy_study_sessions(id) ON DELETE CASCADE,
  word_id INTEGER NOT NULL REFERENCES vy_words(id) ON DELETE CASCADE,
  activity_type VARCHAR(32) NOT NULL, -- 'NEXT', 'ANSWER_CORRECT', 'ANSWER_ERROR'
  user_answer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индексы для фильтрации и подсчета статистики
CREATE INDEX IF NOT EXISTS idx_vy_session_activities_session ON vy_session_activities(session_id);
CREATE INDEX IF NOT EXISTS idx_vy_session_activities_word ON vy_session_activities(word_id);
CREATE INDEX IF NOT EXISTS idx_vy_session_activities_type ON vy_session_activities(activity_type);
