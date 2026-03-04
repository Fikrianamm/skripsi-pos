-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `design_file` ADD COLUMN `thumbnailPath` TEXT NULL;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
