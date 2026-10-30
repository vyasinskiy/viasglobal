CREATE TABLE IF NOT EXISTS tags (
  id          SERIAL PRIMARY KEY,
  language_id INTEGER NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (language_id, name)
);

ALTER TABLE tags DROP CONSTRAINT IF EXISTS fk_tags_language_id;
ALTER TABLE tags
  ADD CONSTRAINT fk_tags_language_id
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS word_tags (
  word_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (word_id, tag_id)
);

ALTER TABLE word_tags DROP CONSTRAINT IF EXISTS fk_word_tags_word_id;
ALTER TABLE word_tags
  ADD CONSTRAINT fk_word_tags_word_id
  FOREIGN KEY (word_id) REFERENCES words(id) ON DELETE CASCADE;

ALTER TABLE word_tags DROP CONSTRAINT IF EXISTS fk_word_tags_tag_id;
ALTER TABLE word_tags
  ADD CONSTRAINT fk_word_tags_tag_id
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_word_tags_tag_id ON word_tags (tag_id);
CREATE INDEX IF NOT EXISTS idx_tags_language_id ON tags (language_id);