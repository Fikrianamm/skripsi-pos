/*
  Warnings:

  - You are about to drop the column `isActive` on the `akun` table. All the data in the column will be lost.
  - You are about to alter the column `kelompok` on the `akun` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to drop the column `costCategoryId` on the `cost` table. All the data in the column will be lost.
  - You are about to drop the `cost_category` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[paymentId]` on the table `jurnal_umum` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[costId]` on the table `jurnal_umum` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[penerimaanId]` on the table `jurnal_umum` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `akunId` to the `cost` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `cost` DROP FOREIGN KEY `cost_costCategoryId_fkey`;

-- DropForeignKey
ALTER TABLE `cost_category` DROP FOREIGN KEY `cost_category_akunId_fkey`;

-- DropIndex
DROP INDEX `cost_costCategoryId_idx` ON `cost`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `akun` DROP COLUMN `isActive`,
    MODIFY `kelompok` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `cost` DROP COLUMN `costCategoryId`,
    ADD COLUMN `akunId` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `jurnal_umum` ADD COLUMN `penerimaanId` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `cost_category`;

-- CreateIndex
CREATE INDEX `cost_akunId_idx` ON `cost`(`akunId`);

-- CreateIndex
CREATE UNIQUE INDEX `jurnal_umum_paymentId_key` ON `jurnal_umum`(`paymentId`);

-- CreateIndex
CREATE UNIQUE INDEX `jurnal_umum_costId_key` ON `jurnal_umum`(`costId`);

-- CreateIndex
CREATE UNIQUE INDEX `jurnal_umum_penerimaanId_key` ON `jurnal_umum`(`penerimaanId`);

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `cost` ADD CONSTRAINT `cost_akunId_fkey` FOREIGN KEY (`akunId`) REFERENCES `akun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_penerimaanId_fkey` FOREIGN KEY (`penerimaanId`) REFERENCES `penerimaan_barang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
