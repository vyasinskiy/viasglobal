-- AlterTable
ALTER TABLE "PrivateLabel" DROP COLUMN "brandName",
DROP COLUMN "manufacturerName";

-- CreateView
CREATE VIEW public."PrivateLabelView" AS
SELECT 
    pl.id,
    pl."brandId",
    pl."manufacturerId",
    b.name AS "brandName",
    m.name AS "manufacturerName",
    pl."createdAt",
    pl."updatedAt"
FROM "PrivateLabel" pl
JOIN "Brand" b ON pl."brandId" = b.id
JOIN "Manufacturer" m ON pl."manufacturerId" = m.id;
