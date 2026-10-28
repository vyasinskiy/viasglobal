-- CreateTable
CREATE TABLE "KeepaExport" (
    "id" SERIAL NOT NULL,
    "sellerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeepaExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ASINToKeepaExport" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ASINToKeepaExport_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ASINToKeepaExport_B_index" ON "_ASINToKeepaExport"("B");

-- AddForeignKey
ALTER TABLE "KeepaExport" ADD CONSTRAINT "KeepaExport_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ASINToKeepaExport" ADD CONSTRAINT "_ASINToKeepaExport_A_fkey" FOREIGN KEY ("A") REFERENCES "ASIN"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ASINToKeepaExport" ADD CONSTRAINT "_ASINToKeepaExport_B_fkey" FOREIGN KEY ("B") REFERENCES "KeepaExport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
