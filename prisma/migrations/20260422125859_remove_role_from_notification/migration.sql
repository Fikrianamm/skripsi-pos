/*
  Warnings:

  - You are about to drop the column `role` on the `notification` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `notification` DROP COLUMN `role`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_costId_fkey` FOREIGN KEY (`costId`) REFERENCES `cost`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_penerimaanId_fkey` FOREIGN KEY (`penerimaanId`) REFERENCES `penerimaan_barang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
