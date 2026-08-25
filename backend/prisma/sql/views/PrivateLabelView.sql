-- ==============================================================================
-- Представление: PrivateLabelView
-- Назначение: Просмотр подтвержденных связок Бренд + Продавец (Private Label).
-- ==============================================================================

DROP VIEW IF EXISTS public."PrivateLabelView";

CREATE VIEW public."PrivateLabelView" AS
SELECT
  -- Идентификатор связки
  pl.id,
  -- Идентификатор бренда
  pl."brandId",
  -- Идентификатор продавца
  pl."sellerId",
  -- Название бренда
  b.name AS "brandName",
  -- Имя продавца
  s.name AS "sellerName",
  -- Результаты и заметки детального анализа связки
  pl.notes,
  -- Дата добавления связки
  pl."createdAt",
  -- Дата последнего обновления
  pl."updatedAt"
FROM "PrivateLabel" pl
JOIN "Brand" b ON pl."brandId" = b.id
JOIN "Seller" s ON pl."sellerId" = s.id;
