/*
  Warnings:

  - You are about to alter the column `nominal` on the `cost` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.

*/
-- DropIndex
DROP INDEX `cost_nama_idx` ON `cost`;

-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `cost` ADD COLUMN `userId` VARCHAR(191) NULL,
    MODIFY `nominal` DECIMAL(12, 2) NOT NULL,
    MODIFY `keterangan` TEXT NULL,
    MODIFY `buktiNota` TEXT NULL;

-- AlterTable
ALTER TABLE `cost_category` ADD COLUMN `akunId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `akun` (
    `id` VARCHAR(191) NOT NULL,
    `kodeAkun` VARCHAR(20) NOT NULL,
    `namaAkun` TEXT NOT NULL,
    `kelompok` ENUM('AKTIVA_LANCAR', 'AKTIVA_TETAP', 'KEWAJIBAN', 'MODAL', 'PENDAPATAN', 'BEBAN_HPP', 'BEBAN_MARKETING', 'BEBAN_GAJI', 'BEBAN_ADMINISTRASI') NOT NULL,
    `posisiNormal` ENUM('DEBET', 'KREDIT') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `akun_kodeAkun_key`(`kodeAkun`),
    INDEX `akun_kodeAkun_idx`(`kodeAkun`),
    INDEX `akun_kelompok_idx`(`kelompok`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jurnal_umum` (
    `id` VARCHAR(191) NOT NULL,
    `ref` VARCHAR(30) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL,
    `keterangan` TEXT NOT NULL,
    `akunDebetId` VARCHAR(191) NOT NULL,
    `akunKreditId` VARCHAR(191) NOT NULL,
    `debet` DECIMAL(12, 2) NOT NULL,
    `kredit` DECIMAL(12, 2) NOT NULL,
    `bulan` INTEGER NOT NULL,
    `tahun` INTEGER NOT NULL,
    `sumber` ENUM('PAYMENT', 'COST', 'TABUNGAN', 'MANUAL') NOT NULL DEFAULT 'MANUAL',
    `paymentId` VARCHAR(191) NULL,
    `costId` VARCHAR(191) NULL,
    `tabunganId` VARCHAR(191) NULL,
    `divisi` ENUM('KONVEKSI', 'PRINTING', 'TEXTILE', 'HQ') NOT NULL DEFAULT 'HQ',
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `jurnal_umum_tanggal_idx`(`tanggal`),
    INDEX `jurnal_umum_bulan_tahun_idx`(`bulan`, `tahun`),
    INDEX `jurnal_umum_sumber_idx`(`sumber`),
    INDEX `jurnal_umum_paymentId_idx`(`paymentId`),
    INDEX `jurnal_umum_costId_idx`(`costId`),
    INDEX `jurnal_umum_tabunganId_idx`(`tabunganId`),
    INDEX `jurnal_umum_akunDebetId_idx`(`akunDebetId`),
    INDEX `jurnal_umum_akunKreditId_idx`(`akunKreditId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jenis_tabungan` (
    `id` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `keterangan` TEXT NULL,
    `akunId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `jenis_tabungan_akunId_idx`(`akunId`),
    INDEX `jenis_tabungan_nama_idx`(`nama`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tabungan` (
    `id` VARCHAR(191) NOT NULL,
    `jenisTabunganId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `nominal` DECIMAL(12, 2) NOT NULL,
    `bulan` INTEGER NOT NULL,
    `tahun` INTEGER NOT NULL,
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tabungan_bulan_tahun_idx`(`bulan`, `tahun`),
    INDEX `tabungan_jenisTabunganId_idx`(`jenisTabunganId`),
    UNIQUE INDEX `tabungan_jenisTabunganId_bulan_tahun_key`(`jenisTabunganId`, `bulan`, `tahun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kas_bank` (
    `id` VARCHAR(191) NOT NULL,
    `namaRekening` TEXT NOT NULL,
    `jenisRekening` VARCHAR(20) NOT NULL,
    `nomorRekening` VARCHAR(50) NULL,
    `saldoAwal` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `saldoSaatIni` DECIMAL(14, 2) NOT NULL DEFAULT 0,
    `akunId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `kas_bank_akunId_idx`(`akunId`),
    INDEX `kas_bank_jenisRekening_idx`(`jenisRekening`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `budget_target` (
    `id` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `tipe` VARCHAR(30) NOT NULL,
    `nominal` DECIMAL(14, 2) NOT NULL,
    `bulan` INTEGER NOT NULL,
    `tahun` INTEGER NOT NULL,
    `keterangan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `budget_target_bulan_tahun_idx`(`bulan`, `tahun`),
    UNIQUE INDEX `budget_target_tipe_bulan_tahun_key`(`tipe`, `bulan`, `tahun`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `cost_userId_idx` ON `cost`(`userId`);

-- CreateIndex
CREATE INDEX `cost_tanggal_idx` ON `cost`(`tanggal`);

-- CreateIndex
CREATE INDEX `cost_category_akunId_idx` ON `cost_category`(`akunId`);

-- CreateIndex
CREATE INDEX `order_statusPembayaran_idx` ON `order`(`statusPembayaran`);

-- CreateIndex
CREATE INDEX `order_createdAt_idx` ON `order`(`createdAt`);

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `cost_category` ADD CONSTRAINT `cost_category_akunId_fkey` FOREIGN KEY (`akunId`) REFERENCES `akun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cost` ADD CONSTRAINT `cost_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_akunDebetId_fkey` FOREIGN KEY (`akunDebetId`) REFERENCES `akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_akunKreditId_fkey` FOREIGN KEY (`akunKreditId`) REFERENCES `akun`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_paymentId_fkey` FOREIGN KEY (`paymentId`) REFERENCES `payment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_costId_fkey` FOREIGN KEY (`costId`) REFERENCES `cost`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_tabunganId_fkey` FOREIGN KEY (`tabunganId`) REFERENCES `tabungan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jenis_tabungan` ADD CONSTRAINT `jenis_tabungan_akunId_fkey` FOREIGN KEY (`akunId`) REFERENCES `akun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tabungan` ADD CONSTRAINT `tabungan_jenisTabunganId_fkey` FOREIGN KEY (`jenisTabunganId`) REFERENCES `jenis_tabungan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tabungan` ADD CONSTRAINT `tabungan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kas_bank` ADD CONSTRAINT `kas_bank_akunId_fkey` FOREIGN KEY (`akunId`) REFERENCES `akun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `cost` RENAME INDEX `cost_costCategoryId_fkey` TO `cost_costCategoryId_idx`;

-- RenameIndex
ALTER TABLE `order` RENAME INDEX `order_userId_fkey` TO `order_userId_idx`;
