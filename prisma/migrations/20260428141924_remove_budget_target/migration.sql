/*
  Warnings:

  - You are about to drop the `budget_target` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- DropTable
DROP TABLE `budget_target`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
