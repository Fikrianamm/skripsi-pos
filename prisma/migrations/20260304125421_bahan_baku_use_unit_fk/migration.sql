/*
  Warnings:

  - You are about to drop the column `satuan` on the `bahan_baku` table. All the data in the column will be lost.
  - Added the required column `unitId` to the `bahan_baku` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `bahan_baku` DROP COLUMN `satuan`,
    ADD COLUMN `unitId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `bahan_baku_unitId_idx` ON `bahan_baku`(`unitId`);

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `bahan_baku` ADD CONSTRAINT `bahan_baku_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
