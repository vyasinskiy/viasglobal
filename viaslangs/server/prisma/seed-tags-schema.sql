CREATE TABLE IF NOT EXISTS vy_tags (
  id          SERIAL PRIMARY KEY,
  language_id INTEGER NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (language_id, name)
);

ALTER TABLE vy_tags DROP CONSTRAINT IF EXISTS fk_vy_tags_language_id;
ALTER TABLE vy_tags
  ADD CONSTRAINT fk_vy_tags_language_id
  FOREIGN KEY (language_id) REFERENCES vy_languages(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS vy_word_tags (
  word_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (word_id, tag_id)
);

ALTER TABLE vy_word_tags DROP CONSTRAINT IF EXISTS fk_vy_word_tags_word_id;
ALTER TABLE vy_word_tags
  ADD CONSTRAINT fk_vy_word_tags_word_id
  FOREIGN KEY (word_id) REFERENCES vy_words(id) ON DELETE CASCADE;

ALTER TABLE vy_word_tags DROP CONSTRAINT IF EXISTS fk_vy_word_tags_tag_id;
ALTER TABLE vy_word_tags
  ADD CONSTRAINT fk_vy_word_tags_tag_id
  FOREIGN KEY (tag_id) REFERENCES vy_tags(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vy_word_tags_tag_id ON vy_word_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_vy_tags_language_id ON vy_tags (language_id);