-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `product` ADD COLUMN `image` TEXT NULL,
    MODIFY `stok` DECIMAL(10, 2) NULL,
    MODIFY `minStok` DECIMAL(10, 2) NULL;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
