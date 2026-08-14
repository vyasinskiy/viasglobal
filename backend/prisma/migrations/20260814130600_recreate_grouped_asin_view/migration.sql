DROP VIEW IF EXISTS public."GroupedAsinView";

CREATE VIEW public."GroupedAsinView" AS
SELECT 
    (EXISTS ( SELECT 1
           FROM "PrivateLabel" pl
          WHERE pl."brandId" = b.id AND pl."manufacturerId" = m.id)) AS "isPrivate",
    m.name AS "Manufacturer",
    b.name AS "Brand",
    count(a.id) AS "AsinCount",
    string_agg(a.code, ', '::text) AS "AsinsList"
   FROM "ASIN" a
     JOIN "Brand" b ON b.id = a."brandId"
     JOIN "Manufacturer" m ON m.id = a."manufacturerId"
  GROUP BY m.id, m.name, b.id, b.name
  ORDER BY (count(a.id)) DESC;
