/*
  Warnings:

  - You are about to drop the column `bulan` on the `jurnal_umum` table. All the data in the column will be lost.
  - You are about to drop the column `debet` on the `jurnal_umum` table. All the data in the column will be lost.
  - You are about to drop the column `divisi` on the `jurnal_umum` table. All the data in the column will be lost.
  - You are about to drop the column `kredit` on the `jurnal_umum` table. All the data in the column will be lost.
  - You are about to drop the column `sumber` on the `jurnal_umum` table. All the data in the column will be lost.
  - You are about to drop the column `tabunganId` on the `jurnal_umum` table. All the data in the column will be lost.
  - You are about to drop the column `tahun` on the `jurnal_umum` table. All the data in the column will be lost.
  - You are about to drop the `tabungan` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `nominal` to the `jurnal_umum` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `jurnal_umum` DROP FOREIGN KEY `jurnal_umum_tabunganId_fkey`;

-- DropForeignKey
ALTER TABLE `tabungan` DROP FOREIGN KEY `tabungan_jenisTabunganId_fkey`;

-- DropForeignKey
ALTER TABLE `tabungan` DROP FOREIGN KEY `tabungan_userId_fkey`;

-- DropIndex
DROP INDEX `jurnal_umum_bulan_tahun_idx` ON `jurnal_umum`;

-- DropIndex
DROP INDEX `jurnal_umum_sumber_idx` ON `jurnal_umum`;

-- DropIndex
DROP INDEX `jurnal_umum_tabunganId_idx` ON `jurnal_umum`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `jurnal_umum` DROP COLUMN `bulan`,
    DROP COLUMN `debet`,
    DROP COLUMN `divisi`,
    DROP COLUMN `kredit`,
    DROP COLUMN `sumber`,
    DROP COLUMN `tabunganId`,
    DROP COLUMN `tahun`,
    ADD COLUMN `nominal` DECIMAL(12, 2) NOT NULL;

-- DropTable
DROP TABLE `tabungan`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
