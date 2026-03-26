/*
  Warnings:

  - You are about to drop the column `hargaSatuan` on the `stok_masuk` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `stok_masuk` DROP COLUMN `hargaSatuan`,
    ADD COLUMN `hargaBeli` DECIMAL(10, 2) NULL;

-- CreateTable
CREATE TABLE `pengeluaran_barang` (
    `id` VARCHAR(191) NOT NULL,
    `spkId` VARCHAR(191) NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` TEXT NULL,
    `addedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pengeluaran_barang_spkId_idx`(`spkId`),
    INDEX `pengeluaran_barang_addedById_idx`(`addedById`),
    INDEX `pengeluaran_barang_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_keluar` (
    `id` VARCHAR(191) NOT NULL,
    `pengeluaranId` VARCHAR(191) NOT NULL,
    `bahanBakuId` VARCHAR(191) NOT NULL,
    `jumlah` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stok_keluar_pengeluaranId_idx`(`pengeluaranId`),
    INDEX `stok_keluar_bahanBakuId_idx`(`bahanBakuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `pengeluaran_barang` ADD CONSTRAINT `pengeluaran_barang_spkId_fkey` FOREIGN KEY (`spkId`) REFERENCES `spk`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran_barang` ADD CONSTRAINT `pengeluaran_barang_addedById_fkey` FOREIGN KEY (`addedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_keluar` ADD CONSTRAINT `stok_keluar_pengeluaranId_fkey` FOREIGN KEY (`pengeluaranId`) REFERENCES `pengeluaran_barang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_keluar` ADD CONSTRAINT `stok_keluar_bahanBakuId_fkey` FOREIGN KEY (`bahanBakuId`) REFERENCES `bahan_baku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
