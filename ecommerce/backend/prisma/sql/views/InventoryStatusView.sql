CREATE OR REPLACE VIEW "InventoryStatusView" AS
SELECT
  ii."productId",
  p.sku,
  p.name,
  ii.warehouse::text AS warehouse,
  ii.quantity,
  ii."reservedQuantity" AS reserved,
  ii.quantity - ii."reservedQuantity" AS available,
  ii."minStockLevel",
  (ii.quantity - ii."reservedQuantity") <= COALESCE(ii."minStockLevel", 0) AS "isLowStock"
FROM "InventoryItem" ii
JOIN "Product" p ON p.id = ii."productId";