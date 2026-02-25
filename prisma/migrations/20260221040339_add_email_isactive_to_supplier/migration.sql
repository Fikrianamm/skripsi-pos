-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `supplier` ADD COLUMN `email` TEXT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
