-- ==============================================================================
-- Представление: WholesaleCandidatesView
-- Назначение: Сводный анализ и группировка товаров ASIN по Производителю, Бренду,
--             Продавцу и причине фильтрации (filterReason) для отбора потенциальных
--             кандидатов под оптовую торговлю (Wholesale). Включает список привязанных дистрибьюторов и EAN.
-- ==============================================================================

DROP VIEW IF EXISTS public."WholesaleCandidatesView";

CREATE OR REPLACE VIEW public."WholesaleCandidatesView" AS
SELECT * FROM public.get_wholesale_candidates();
