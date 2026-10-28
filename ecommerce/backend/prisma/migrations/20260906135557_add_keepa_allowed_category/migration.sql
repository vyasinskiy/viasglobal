-- Создание таблицы KeepaAllowedCategory для хранения списка разрешенных категорий
CREATE TABLE "KeepaAllowedCategory" (
    "id" SERIAL NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domainId" INTEGER NOT NULL DEFAULT 4,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeepaAllowedCategory_pkey" PRIMARY KEY ("id")
);

-- Создание уникального индекса по categoryId для предотвращения дубликатов
CREATE UNIQUE INDEX "KeepaAllowedCategory_categoryId_key" ON "KeepaAllowedCategory"("categoryId");

-- Вставка начального набора безопасных категорий для amazon.es (domainId = 4)
-- Данные категории не несут риска для здоровья и жизни потребителя
INSERT INTO "KeepaAllowedCategory" ("categoryId", "name", "domainId", "isActive", "createdAt", "updatedAt")
VALUES
    ('599391031', 'Hogar y cocina', 4, true, NOW(), NOW()),
    ('3528728031', 'Oficina y papelería', 4, true, NOW(), NOW()),
    ('2454133031', 'Bricolaje y herramientas', 4, true, NOW(), NOW()),
    ('2454136031', 'Deportes y aire libre', 4, true, NOW(), NOW()),
    ('1571259031', 'Jardín', 4, true, NOW(), NOW()),
    ('5866088031', 'Industria, empresas y ciencia', 4, true, NOW(), NOW()),
    ('12472654031', 'Productos para mascotas', 4, true, NOW(), NOW())
ON CONFLICT ("categoryId") DO NOTHING;
