/*
  Warnings:

  - You are about to drop the column `catatan` on the `order_item` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `designReviewStatus` ENUM('PENDING_REVIEW', 'REVISI', 'ACC') NULL;

-- AlterTable
ALTER TABLE `order_item` DROP COLUMN `catatan`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
