CREATE OR REPLACE VIEW "KeepaExportView" AS
SELECT 
    ke."id",
    b."name" AS "brandName",
    s."name" AS "sellerName",
    ke."createdAt",
    ke."brandId",
    ke."sellerId"
FROM "KeepaExport" ke
LEFT JOIN "Brand" b ON ke."brandId" = b."id"
LEFT JOIN "Seller" s ON ke."sellerId" = s."id";
