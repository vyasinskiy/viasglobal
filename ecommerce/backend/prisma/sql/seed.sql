-- Seed data for ecommerce CRM

-- Platforms
INSERT INTO "Platform" ("name", "code") VALUES
  ('Amazon', 'amazon'),
  ('Etsy', 'etsy')
ON CONFLICT (code) DO NOTHING;

-- Admin user (password: admin123)
INSERT INTO "User" ("email", "passwordHash", "name", "role", "updatedAt") VALUES
  ('admin@viasglobal.com', '$2b$10$eoNFVgHHXi9AP717ygf84.IFUJ31jyB9ghb61g3kAAWfN/FY.dCmW', 'Admin', 'ADMIN', NOW())
ON CONFLICT (email) DO UPDATE SET "passwordHash" = EXCLUDED."passwordHash";