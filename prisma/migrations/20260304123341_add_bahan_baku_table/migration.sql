/*
  Warnings:

  - You are about to drop the column `productId` on the `stok_masuk` table. All the data in the column will be lost.
  - Added the required column `bahanBakuId` to the `stok_masuk` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `stok_masuk` DROP FOREIGN KEY `stok_masuk_productId_fkey`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- DropIndex
DROP INDEX `stok_masuk_productId_idx` ON `stok_masuk`;

-- AlterTable
ALTER TABLE `stok_masuk` DROP COLUMN `productId`,
    ADD COLUMN `bahanBakuId` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `bahan_baku` (
    `id` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `satuan` VARCHAR(50) NOT NULL,
    `stok` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `minStok` DECIMAL(10, 2) NULL,
    `keterangan` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bahan_baku_nama_idx`(`nama`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- CreateIndex
CREATE INDEX `stok_masuk_bahanBakuId_idx` ON `stok_masuk`(`bahanBakuId`);

-- AddForeignKey
ALTER TABLE `stok_masuk` ADD CONSTRAINT `stok_masuk_bahanBakuId_fkey` FOREIGN KEY (`bahanBakuId`) REFERENCES `bahan_baku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
