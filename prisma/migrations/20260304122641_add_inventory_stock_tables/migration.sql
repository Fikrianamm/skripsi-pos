-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- CreateTable
CREATE TABLE `stok_masuk` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `supplierId` VARCHAR(191) NULL,
    `jumlah` DECIMAL(10, 2) NOT NULL,
    `hargaBeli` DECIMAL(10, 2) NULL,
    `nomorFaktur` VARCHAR(100) NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stok_masuk_productId_idx`(`productId`),
    INDEX `stok_masuk_supplierId_idx`(`supplierId`),
    INDEX `stok_masuk_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_keluar` (
    `id` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `jumlah` DECIMAL(10, 2) NOT NULL,
    `jenis` ENUM('PEMAKAIAN', 'RUSAK', 'RETUR', 'PENYESUAIAN', 'LAINNYA') NOT NULL DEFAULT 'PEMAKAIAN',
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stok_keluar_productId_idx`(`productId`),
    INDEX `stok_keluar_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `stok_masuk` ADD CONSTRAINT `stok_masuk_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_masuk` ADD CONSTRAINT `stok_masuk_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_keluar` ADD CONSTRAINT `stok_keluar_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
