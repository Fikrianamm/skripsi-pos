-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- CreateTable
CREATE TABLE `product_bahan_baku` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `bahanBakuId` VARCHAR(191) NOT NULL,
    `jumlahButuh` DECIMAL(10, 4) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `product_bahan_baku_productId_idx`(`productId`),
    INDEX `product_bahan_baku_bahanBakuId_idx`(`bahanBakuId`),
    UNIQUE INDEX `product_bahan_baku_productId_bahanBakuId_key`(`productId`, `bahanBakuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `product_bahan_baku` ADD CONSTRAINT `product_bahan_baku_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_bahan_baku` ADD CONSTRAINT `product_bahan_baku_bahanBakuId_fkey` FOREIGN KEY (`bahanBakuId`) REFERENCES `bahan_baku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
