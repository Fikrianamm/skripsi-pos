/*
  Warnings:

  - You are about to drop the column `saldoAwal` on the `kas_bank` table. All the data in the column will be lost.
  - You are about to drop the column `saldoSaatIni` on the `kas_bank` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `kas_bank` DROP COLUMN `saldoAwal`,
    DROP COLUMN `saldoSaatIni`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
