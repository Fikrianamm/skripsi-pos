-- DropForeignKey
ALTER TABLE `jurnal_umum` DROP FOREIGN KEY `jurnal_umum_costId_fkey`;

-- DropForeignKey
ALTER TABLE `jurnal_umum` DROP FOREIGN KEY `jurnal_umum_paymentId_fkey`;

-- DropForeignKey
ALTER TABLE `jurnal_umum` DROP FOREIGN KEY `jurnal_umum_penerimaanId_fkey`;

-- DropIndex
DROP INDEX `jurnal_umum_costId_key` ON `jurnal_umum`;

-- DropIndex
DROP INDEX `jurnal_umum_paymentId_key` ON `jurnal_umum`;

-- DropIndex
DROP INDEX `jurnal_umum_penerimaanId_key` ON `jurnal_umum`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));
