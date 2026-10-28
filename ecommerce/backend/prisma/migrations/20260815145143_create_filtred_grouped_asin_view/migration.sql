CREATE VIEW public."FiltredGroupedAsinView" AS
SELECT 
    "Manufacturer",
    "Brand",
    "AsinCount",
    "AsinsList"
FROM public."GroupedAsinView"
WHERE "isPrivate" = false;
