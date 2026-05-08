/*
  Warnings:

  - You are about to drop the `stok_opname` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `stok_opname_item` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `stok_opname` DROP FOREIGN KEY `stok_opname_addedById_fkey`;

-- DropForeignKey
ALTER TABLE `stok_opname_item` DROP FOREIGN KEY `stok_opname_item_bahanBakuId_fkey`;

-- DropForeignKey
ALTER TABLE `stok_opname_item` DROP FOREIGN KEY `stok_opname_item_opnameId_fkey`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- DropTable
DROP TABLE `stok_opname`;

-- DropTable
DROP TABLE `stok_opname_item`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
