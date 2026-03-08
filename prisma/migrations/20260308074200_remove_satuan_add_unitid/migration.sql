-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
