-- ==============================================================================
-- Представление: ContractedAllProductsView
-- Назначение: Сводное SQL-представление для отображения ВСЕХ товаров брендов в работе
--             без каких-либо ограничений по BSR, цене или доле присутствия Amazon.
-- ==============================================================================

DROP VIEW IF EXISTS public."ContractedAllProductsView";

CREATE OR REPLACE VIEW public."ContractedAllProductsView" AS
SELECT * FROM public.get_contracted_all_products();
