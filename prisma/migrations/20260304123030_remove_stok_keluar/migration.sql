/*
  Warnings:

  - You are about to drop the `stok_keluar` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `stok_keluar` DROP FOREIGN KEY `stok_keluar_productId_fkey`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- DropTable
DROP TABLE `stok_keluar`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
