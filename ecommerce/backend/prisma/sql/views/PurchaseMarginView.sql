CREATE OR REPLACE VIEW "PurchaseMarginView" AS
SELECT
  p.id AS "purchaseId",
  p."orderNumber",
  s.name AS "supplierName",
  p."orderDate",
  p.status::text AS status,
  SUM(pi."totalPrice") AS "totalCost",
  p."shippingCost",
  p."taxAmount",
  p."totalAmount",
  COALESCE(SUM(si."totalPrice"), 0) AS "totalRevenue",
  COALESCE(SUM(si."totalPrice"), 0) - p."totalAmount" AS "grossProfit",
  CASE WHEN COALESCE(SUM(si."totalPrice"), 0) > 0
    THEN ROUND(((COALESCE(SUM(si."totalPrice"), 0) - p."totalAmount") / COALESCE(SUM(si."totalPrice"), 1) * 100)::numeric, 2)
    ELSE NULL
  END AS "marginPercent"
FROM "Purchase" p
JOIN "Supplier" s ON s.id = p."supplierId"
LEFT JOIN "PurchaseItem" pi ON pi."purchaseId" = p.id
LEFT JOIN "SalesOrderItem" si ON si."productId" = pi."productId"
GROUP BY p.id, p."orderNumber", s.name, p."orderDate", p.status::text, p."shippingCost", p."taxAmount", p."totalAmount";