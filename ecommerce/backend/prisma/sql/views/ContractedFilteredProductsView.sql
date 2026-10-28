-- ==============================================================================
-- Представление: ContractedFilteredProductsView
-- Назначение: Сводное SQL-представление для отображения товаров брендов в работе
--             с применением строгих оптовых фильтров (BSR <= 100k, Amazon <= 50%, BuyBox >= 10€).
-- ==============================================================================

DROP VIEW IF EXISTS public."ContractedFilteredProductsView";

CREATE OR REPLACE VIEW public."ContractedFilteredProductsView" AS
SELECT * FROM public.get_contracted_products();
