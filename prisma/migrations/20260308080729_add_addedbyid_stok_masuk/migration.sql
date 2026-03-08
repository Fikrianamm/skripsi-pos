-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `stok_masuk` ADD COLUMN `addedById` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- CreateIndex
CREATE INDEX `stok_masuk_addedById_idx` ON `stok_masuk`(`addedById`);

-- AddForeignKey
ALTER TABLE `stok_masuk` ADD CONSTRAINT `stok_masuk_addedById_fkey` FOREIGN KEY (`addedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
