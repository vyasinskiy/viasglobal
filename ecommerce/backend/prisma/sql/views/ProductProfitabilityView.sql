CREATE OR REPLACE VIEW "ProductProfitabilityView" AS
SELECT
  p.id AS "productId",
  p.sku,
  p.name,
  p.brand,
  p.category,
  AVG(sp."costPrice") AS "avgCostPrice",
  AVG(si."unitPrice") AS "avgSellPrice",
  SUM(si.quantity)::int AS "totalSold",
  SUM(si."totalPrice") AS "totalRevenue",
  SUM(si.quantity * COALESCE(si."costPrice", sp."costPrice", 0)) AS "totalCost",
  SUM(si."totalPrice") - SUM(si.quantity * COALESCE(si."costPrice", sp."costPrice", 0)) AS "grossProfit",
  CASE WHEN SUM(si."totalPrice") > 0
    THEN ROUND(((SUM(si."totalPrice") - SUM(si.quantity * COALESCE(si."costPrice", sp."costPrice", 0))) / SUM(si."totalPrice") * 100)::numeric, 2)
    ELSE NULL
  END AS "marginPercent"
FROM "Product" p
LEFT JOIN "SalesOrderItem" si ON si."productId" = p.id
LEFT JOIN "SupplierProduct" sp ON sp."productId" = p.id
GROUP BY p.id, p.sku, p.name, p.brand, p.category;