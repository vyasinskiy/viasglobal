-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ASINToTag" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ASINToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "_ASINToTag_B_index" ON "_ASINToTag"("B");

-- AddForeignKey
ALTER TABLE "_ASINToTag" ADD CONSTRAINT "_ASINToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "ASIN"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ASINToTag" ADD CONSTRAINT "_ASINToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration: Insert unique tags
INSERT INTO "Tag" ("id", "name")
SELECT gen_random_uuid()::TEXT, unnested_tag
FROM (
  SELECT DISTINCT unnest("tags") AS unnested_tag
  FROM "ASIN"
) sub
WHERE unnested_tag IS NOT NULL
ON CONFLICT ("name") DO NOTHING;

-- Data Migration: Map tags to ASINs
INSERT INTO "_ASINToTag" ("A", "B")
SELECT a.id, t.id
FROM "ASIN" a
CROSS JOIN LATERAL unnest(a."tags") AS unnested_tag
JOIN "Tag" t ON t.name = unnested_tag
ON CONFLICT ("A", "B") DO NOTHING;

-- AlterTable
ALTER TABLE "ASIN" DROP COLUMN "tags";
