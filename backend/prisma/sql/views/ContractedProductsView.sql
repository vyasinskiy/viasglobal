-- ==============================================================================
-- Представление: ContractedProductsView
-- Назначение: Сводное SQL-представление для отображения товаров брендов, 
--             находящихся в работе (BrandStatus = 'CONTRACTED').
-- ==============================================================================

DROP VIEW IF EXISTS public."ContractedProductsView";

CREATE OR REPLACE VIEW public."ContractedProductsView" AS
SELECT * FROM public.get_contracted_products();
