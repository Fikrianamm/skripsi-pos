-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `customer` ADD COLUMN `image` TEXT NULL;

-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `image` TEXT NULL;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
