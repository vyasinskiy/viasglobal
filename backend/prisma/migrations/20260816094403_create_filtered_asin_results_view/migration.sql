-- Drop the view if it exists (in case we run this multiple times)
DROP VIEW IF EXISTS public."FilteredAsinResultsView";

-- Create the grouped view
CREATE VIEW public."FilteredAsinResultsView" AS
SELECT 
    m.name AS "Manufacturer",
    b.name AS "Brand",
    public.get_asin_filter_reason(a.id) AS "FilterReason",
    COUNT(a.id) AS "AsinCount",
    string_agg(a.code, ', ') AS "AsinsList"
FROM "ASIN" a
LEFT JOIN "Brand" b ON a."brandId" = b.id
LEFT JOIN "Manufacturer" m ON a."manufacturerId" = m.id
GROUP BY m.name, b.name, public.get_asin_filter_reason(a.id)
ORDER BY "AsinCount" DESC;