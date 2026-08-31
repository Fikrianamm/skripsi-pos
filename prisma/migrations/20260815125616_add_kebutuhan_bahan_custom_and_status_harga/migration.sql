-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `order_item` ADD COLUMN `statusHarga` ENUM('NA', 'MENUNGGU_DESAIN', 'MENUNGGU_NEGOSIASI', 'DISEPAKATI') NOT NULL DEFAULT 'NA',
    MODIFY `harga` DECIMAL(12, 2) NULL,
    MODIFY `subtotal` DECIMAL(12, 2) NULL;

-- CreateTable
CREATE TABLE `kebutuhan_bahan_custom` (
    `id` VARCHAR(191) NOT NULL,
    `orderItemId` VARCHAR(191) NOT NULL,
    `bahanBakuId` VARCHAR(191) NOT NULL,
    `jumlahDibutuhkan` DECIMAL(10, 2) NOT NULL,
    `satuan` VARCHAR(20) NOT NULL,
    `dicatatOlehId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `kebutuhan_bahan_custom_orderItemId_idx`(`orderItemId`),
    INDEX `kebutuhan_bahan_custom_bahanBakuId_idx`(`bahanBakuId`),
    INDEX `kebutuhan_bahan_custom_dicatatOlehId_idx`(`dicatatOlehId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `kebutuhan_bahan_custom` ADD CONSTRAINT `kebutuhan_bahan_custom_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `order_item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kebutuhan_bahan_custom` ADD CONSTRAINT `kebutuhan_bahan_custom_bahanBakuId_fkey` FOREIGN KEY (`bahanBakuId`) REFERENCES `bahan_baku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kebutuhan_bahan_custom` ADD CONSTRAINT `kebutuhan_bahan_custom_dicatatOlehId_fkey` FOREIGN KEY (`dicatatOlehId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
