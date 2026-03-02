-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- CreateTable
CREATE TABLE `karyawan` (
    `id` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `nomorHp` TEXT NULL,
    `posisi` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `karyawan_nama_idx`(`nama`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `spk` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `karyawanId` VARCHAR(191) NOT NULL,
    `tahapProduksi` ENUM('PENDING', 'DESAIN', 'POTONG', 'SABLON', 'JAHIT', 'PACKING', 'SELESAI', 'BATAL') NOT NULL,
    `model` TEXT NULL,
    `tali` TEXT NULL,
    `ukuran` TEXT NULL,
    `jumlah` DECIMAL(10, 2) NOT NULL,
    `catatan` TEXT NULL,
    `tanggalSetor` DATETIME(3) NULL,
    `accCetak` BOOLEAN NOT NULL DEFAULT false,
    `accCetakAt` DATETIME(3) NULL,
    `accCetakOleh` TEXT NULL,
    `statusSPK` ENUM('DRAFT', 'AKTIF', 'SELESAI', 'REVISI', 'BATAL') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `spk_orderId_key`(`orderId`),
    INDEX `spk_karyawanId_idx`(`karyawanId`),
    INDEX `spk_tahapProduksi_idx`(`tahapProduksi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `spk` ADD CONSTRAINT `spk_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk` ADD CONSTRAINT `spk_karyawanId_fkey` FOREIGN KEY (`karyawanId`) REFERENCES `karyawan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
