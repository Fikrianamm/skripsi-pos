-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `app_setting` ADD COLUMN `email` VARCHAR(100) NULL;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
