-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `stok_masuk` ADD COLUMN `buktiNota` TEXT NULL;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
