/*
  Warnings:

  - You are about to drop the column `addedById` on the `stok_masuk` table. All the data in the column will be lost.
  - You are about to drop the column `buktiNota` on the `stok_masuk` table. All the data in the column will be lost.
  - You are about to drop the column `hargaBeli` on the `stok_masuk` table. All the data in the column will be lost.
  - You are about to drop the column `keterangan` on the `stok_masuk` table. All the data in the column will be lost.
  - You are about to drop the column `nomorFaktur` on the `stok_masuk` table. All the data in the column will be lost.
  - You are about to drop the column `supplierId` on the `stok_masuk` table. All the data in the column will be lost.
  - You are about to drop the column `tanggal` on the `stok_masuk` table. All the data in the column will be lost.
  - Added the required column `penerimaanId` to the `stok_masuk` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `stok_masuk` DROP FOREIGN KEY `stok_masuk_addedById_fkey`;

-- DropForeignKey
ALTER TABLE `stok_masuk` DROP FOREIGN KEY `stok_masuk_supplierId_fkey`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- DropIndex
DROP INDEX `stok_masuk_addedById_idx` ON `stok_masuk`;

-- DropIndex
DROP INDEX `stok_masuk_supplierId_idx` ON `stok_masuk`;

-- DropIndex
DROP INDEX `stok_masuk_tanggal_idx` ON `stok_masuk`;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `spk` ADD COLUMN `userId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `stok_masuk` DROP COLUMN `addedById`,
    DROP COLUMN `buktiNota`,
    DROP COLUMN `hargaBeli`,
    DROP COLUMN `keterangan`,
    DROP COLUMN `nomorFaktur`,
    DROP COLUMN `supplierId`,
    DROP COLUMN `tanggal`,
    ADD COLUMN `hargaSatuan` DECIMAL(10, 2) NULL,
    ADD COLUMN `penerimaanId` VARCHAR(191) NOT NULL,
    ADD COLUMN `totalHargaItem` DECIMAL(12, 2) NULL;

-- CreateTable
CREATE TABLE `penerimaan_barang` (
    `id` VARCHAR(191) NOT NULL,
    `nomorFaktur` VARCHAR(100) NULL,
    `supplierId` VARCHAR(191) NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` TEXT NULL,
    `buktiNota` TEXT NULL,
    `totalTagihan` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `addedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `penerimaan_barang_supplierId_idx`(`supplierId`),
    INDEX `penerimaan_barang_addedById_idx`(`addedById`),
    INDEX `penerimaan_barang_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- CreateIndex
CREATE INDEX `stok_masuk_penerimaanId_idx` ON `stok_masuk`(`penerimaanId`);

-- AddForeignKey
ALTER TABLE `penerimaan_barang` ADD CONSTRAINT `penerimaan_barang_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penerimaan_barang` ADD CONSTRAINT `penerimaan_barang_addedById_fkey` FOREIGN KEY (`addedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_masuk` ADD CONSTRAINT `stok_masuk_penerimaanId_fkey` FOREIGN KEY (`penerimaanId`) REFERENCES `penerimaan_barang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk` ADD CONSTRAINT `spk_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
