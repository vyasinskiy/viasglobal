-- ==============================================================================
-- Представление: CandidatesProductsView
-- Назначение: Сводный анализ и группировка товаров ASIN по Производителю, Бренду,
--             Продавцу и причине фильтрации (filterReason) для отбора потенциальных
--             кандидатов под оптовую торговлю (Wholesale). Включает список привязанных дистрибьюторов и EAN.
-- ==============================================================================

DROP VIEW IF EXISTS public."CandidatesProductsView";

CREATE OR REPLACE VIEW public."CandidatesProductsView" AS
SELECT * FROM public.get_candidates_products();
