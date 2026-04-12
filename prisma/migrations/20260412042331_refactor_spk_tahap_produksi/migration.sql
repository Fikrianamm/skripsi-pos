/*
  Warnings:

  - The values [POTONG,SABLON,JAHIT] on the enum `spk_tahapProduksi` will be removed. If these variants are still used in the database, this will fail.
  - The values [POTONG,SABLON,JAHIT] on the enum `spk_tahapProduksi` will be removed. If these variants are still used in the database, this will fail.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `order` MODIFY `statusProduksi` ENUM('PENDING', 'DESAIN', 'PRODUKSI', 'PACKING', 'SELESAI', 'BATAL') NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE `spk` MODIFY `tahapProduksi` ENUM('PENDING', 'DESAIN', 'PRODUKSI', 'PACKING', 'SELESAI', 'BATAL') NOT NULL;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
