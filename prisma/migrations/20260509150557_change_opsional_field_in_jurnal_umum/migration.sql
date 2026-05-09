/*
  Warnings:

  - Made the column `namaBiaya` on table `jurnal_umum` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `jurnal_umum` MODIFY `keterangan` TEXT NULL,
    MODIFY `namaBiaya` TEXT NOT NULL;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
