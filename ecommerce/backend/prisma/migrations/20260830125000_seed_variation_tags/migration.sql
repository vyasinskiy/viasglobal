-- Seed the default variation tags
INSERT INTO "Tag" (name) VALUES ('DEAD_VARIATION'), ('MISSING_VARIATION') ON CONFLICT DO NOTHING;
