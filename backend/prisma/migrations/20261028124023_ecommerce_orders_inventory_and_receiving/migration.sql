-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'SHIPPED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WarehouseLocation" AS ENUM ('SVH', 'MAIN', 'FBA');

-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('RECEIPT', 'TRANSFER', 'SALE_OUT', 'ADJUSTMENT', 'RETURN');

-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "OrderDocumentType" AS ENUM ('ALBARAN', 'INVOICE', 'RECEIVING_PHOTO', 'MEASUREMENT_PHOTO', 'PAYMENT_RECEIPT', 'SHIPPING_LABEL', 'OTHER');

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" SERIAL NOT NULL,
    "distributorId" INTEGER NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDeliveryDate" TIMESTAMP(3),
    "actualDeliveryDate" TIMESTAMP(3),
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotalNetto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalEcoTasa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGross" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentMethod" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" SERIAL NOT NULL,
    "purchaseOrderId" INTEGER NOT NULL,
    "asinId" INTEGER,
    "sku" TEXT NOT NULL,
    "ean" TEXT,
    "title" TEXT NOT NULL,
    "quantityOrdered" INTEGER NOT NULL,
    "quantityReceived" INTEGER NOT NULL DEFAULT 0,
    "priceNetto" DOUBLE PRECISION NOT NULL,
    "ecoTasa" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPrice" DOUBLE PRECISION NOT NULL,
    "totalCostGross" DOUBLE PRECISION NOT NULL,
    "packageLengthCm" DOUBLE PRECISION,
    "packageWidthCm" DOUBLE PRECISION,
    "packageHeightCm" DOUBLE PRECISION,
    "packageWeightG" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseStock" (
    "id" SERIAL NOT NULL,
    "warehouse" "WarehouseLocation" NOT NULL,
    "sku" TEXT NOT NULL,
    "asinId" INTEGER,
    "title" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "minStockAlert" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WarehouseStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" SERIAL NOT NULL,
    "sku" TEXT NOT NULL,
    "asinId" INTEGER,
    "fromWarehouse" "WarehouseLocation",
    "toWarehouse" "WarehouseLocation",
    "type" "StockMovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "purchaseOrderId" INTEGER,
    "purchaseOrderItemId" INTEGER,
    "salesOrderId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'AMAZON',
    "orderNumber" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'PENDING',
    "fulfillmentChannel" TEXT NOT NULL DEFAULT 'FBM',
    "warehouse" "WarehouseLocation" NOT NULL DEFAULT 'SVH',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "platformFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "customerCity" TEXT,
    "customerCountry" TEXT DEFAULT 'ES',
    "trackingNumber" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" SERIAL NOT NULL,
    "salesOrderId" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "asinId" INTEGER,
    "quantity" INTEGER NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "costPrice" DOUBLE PRECISION,
    "netProfit" DOUBLE PRECISION,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchSalesAllocation" (
    "id" SERIAL NOT NULL,
    "purchaseOrderItemId" INTEGER NOT NULL,
    "salesOrderItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "costPriceAtAllocation" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchSalesAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderDocument" (
    "id" SERIAL NOT NULL,
    "distributorId" INTEGER,
    "purchaseOrderId" INTEGER,
    "purchaseOrderItemId" INTEGER,
    "salesOrderId" INTEGER,
    "documentType" "OrderDocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchaseOrder_distributorId_idx" ON "PurchaseOrder"("distributorId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_distributorId_orderNumber_key" ON "PurchaseOrder"("distributorId", "orderNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_asinId_idx" ON "PurchaseOrderItem"("asinId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_sku_idx" ON "PurchaseOrderItem"("sku");

-- CreateIndex
CREATE INDEX "WarehouseStock_warehouse_idx" ON "WarehouseStock"("warehouse");

-- CreateIndex
CREATE INDEX "WarehouseStock_sku_idx" ON "WarehouseStock"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "WarehouseStock_warehouse_sku_key" ON "WarehouseStock"("warehouse", "sku");

-- CreateIndex
CREATE INDEX "StockMovement_sku_createdAt_idx" ON "StockMovement"("sku", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "StockMovement_type_idx" ON "StockMovement"("type");

-- CreateIndex
CREATE INDEX "StockMovement_purchaseOrderId_idx" ON "StockMovement"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "StockMovement_salesOrderId_idx" ON "StockMovement"("salesOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_orderNumber_key" ON "SalesOrder"("orderNumber");

-- CreateIndex
CREATE INDEX "SalesOrder_orderDate_idx" ON "SalesOrder"("orderDate");

-- CreateIndex
CREATE INDEX "SalesOrder_status_idx" ON "SalesOrder"("status");

-- CreateIndex
CREATE INDEX "SalesOrderItem_salesOrderId_idx" ON "SalesOrderItem"("salesOrderId");

-- CreateIndex
CREATE INDEX "SalesOrderItem_sku_idx" ON "SalesOrderItem"("sku");

-- CreateIndex
CREATE INDEX "BatchSalesAllocation_purchaseOrderItemId_idx" ON "BatchSalesAllocation"("purchaseOrderItemId");

-- CreateIndex
CREATE INDEX "BatchSalesAllocation_salesOrderItemId_idx" ON "BatchSalesAllocation"("salesOrderItemId");

-- CreateIndex
CREATE INDEX "OrderDocument_distributorId_idx" ON "OrderDocument"("distributorId");

-- CreateIndex
CREATE INDEX "OrderDocument_purchaseOrderId_idx" ON "OrderDocument"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "OrderDocument_documentType_idx" ON "OrderDocument"("documentType");

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "ASIN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseStock" ADD CONSTRAINT "WarehouseStock_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "ASIN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "ASIN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_asinId_fkey" FOREIGN KEY ("asinId") REFERENCES "ASIN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSalesAllocation" ADD CONSTRAINT "BatchSalesAllocation_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchSalesAllocation" ADD CONSTRAINT "BatchSalesAllocation_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_distributorId_fkey" FOREIGN KEY ("distributorId") REFERENCES "Distributor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_purchaseOrderItemId_fkey" FOREIGN KEY ("purchaseOrderItemId") REFERENCES "PurchaseOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderDocument" ADD CONSTRAINT "OrderDocument_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
