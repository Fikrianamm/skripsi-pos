/*
  Warnings:

  - You are about to drop the `jenis_tabungan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `jenis_tabungan` DROP FOREIGN KEY `jenis_tabungan_akunId_fkey`;

-- DropForeignKey
ALTER TABLE `tabungan` DROP FOREIGN KEY `tabungan_jenisTabunganId_fkey`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- DropTable
DROP TABLE `jenis_tabungan`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `tabungan` ADD CONSTRAINT `tabungan_jenisTabunganId_fkey` FOREIGN KEY (`jenisTabunganId`) REFERENCES `akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
