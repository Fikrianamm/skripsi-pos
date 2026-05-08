/*
  Warnings:

  - You are about to drop the column `costId` on the `jurnal_umum` table. All the data in the column will be lost.
  - You are about to drop the `cost` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `cost` DROP FOREIGN KEY `cost_akunId_fkey`;

-- DropForeignKey
ALTER TABLE `cost` DROP FOREIGN KEY `cost_userId_fkey`;

-- DropForeignKey
ALTER TABLE `jurnal_umum` DROP FOREIGN KEY `jurnal_umum_costId_fkey`;

-- DropIndex
DROP INDEX `jurnal_umum_costId_idx` ON `jurnal_umum`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `jurnal_umum` DROP COLUMN `costId`,
    ADD COLUMN `buktiNota` TEXT NULL,
    ADD COLUMN `namaBiaya` TEXT NULL;

-- DropTable
DROP TABLE `cost`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
