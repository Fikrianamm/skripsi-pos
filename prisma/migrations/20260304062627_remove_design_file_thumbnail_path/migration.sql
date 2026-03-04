/*
  Warnings:

  - You are about to drop the column `thumbnailPath` on the `design_file` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `design_file` DROP COLUMN `thumbnailPath`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
