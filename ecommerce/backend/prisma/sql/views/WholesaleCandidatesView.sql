-- ==============================================================================
-- Представление: WholesaleCandidatesView (Официальный алиас для CandidatesProductsView)
-- Назначение: Сводный анализ и группировка товаров ASIN по Производителю, Бренду,
--             Продавцу и причине фильтрации (filterReason) для отбора потенциальных
--             кандидатов под оптовую торговлю (Wholesale). Включает список привязанных дистрибьюторов и EAN.
--             Автоматически исключает бренды в работе (status = 'CONTRACTED') 
--             и бренды без дистрибьюторов в ЕС (status = 'NO_EU_DISTRIBUTOR').
-- ==============================================================================

DROP VIEW IF EXISTS public."WholesaleCandidatesView";

CREATE OR REPLACE VIEW public."WholesaleCandidatesView" AS
SELECT * FROM public.get_candidates_products();
