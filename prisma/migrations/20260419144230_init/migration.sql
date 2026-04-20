-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `name` TEXT NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `banExpires` DATETIME(3) NULL,
    `banReason` TEXT NULL,
    `banned` BOOLEAN NULL DEFAULT false,
    `role` TEXT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ipAddress` TEXT NULL,
    `userAgent` TEXT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `impersonatedBy` TEXT NULL,

    UNIQUE INDEX `session_token_key`(`token`),
    INDEX `session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` TEXT NOT NULL,
    `providerId` TEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `idToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `account_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` TEXT NOT NULL,
    `value` TEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `verification_identifier_idx`(`identifier`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `category_nama_idx`(`nama`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unit` (
    `id` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `unit_nama_idx`(`nama`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product` (
    `id` VARCHAR(191) NOT NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `image` TEXT NULL,
    `hpp` DECIMAL(10, 2) NOT NULL,
    `hargaJual` DECIMAL(10, 2) NOT NULL,
    `stok` DECIMAL(10, 2) NULL,
    `minStok` DECIMAL(10, 2) NULL,
    `isService` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `product_sku_key`(`sku`),
    INDEX `product_sku_idx`(`sku`(191)),
    INDEX `product_nama_idx`(`nama`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer` (
    `id` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `nomorHp` TEXT NOT NULL,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `customer_nama_idx`(`nama`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier` (
    `id` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `nomorHp` TEXT NOT NULL,
    `email` TEXT NULL,
    `image` TEXT NULL,
    `alamat` TEXT NULL,
    `keterangan` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `supplier_nama_idx`(`nama`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bahan_baku` (
    `id` VARCHAR(191) NOT NULL,
    `unitId` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `stok` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `minStok` DECIMAL(10, 2) NULL,
    `keterangan` TEXT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `bahan_baku_nama_idx`(`nama`(191)),
    INDEX `bahan_baku_unitId_idx`(`unitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `penerimaan_barang` (
    `id` VARCHAR(191) NOT NULL,
    `nomorFaktur` VARCHAR(100) NULL,
    `supplierId` VARCHAR(191) NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` TEXT NULL,
    `buktiNota` TEXT NULL,
    `totalTagihan` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `addedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `penerimaan_barang_supplierId_idx`(`supplierId`),
    INDEX `penerimaan_barang_addedById_idx`(`addedById`),
    INDEX `penerimaan_barang_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_masuk` (
    `id` VARCHAR(191) NOT NULL,
    `penerimaanId` VARCHAR(191) NOT NULL,
    `bahanBakuId` VARCHAR(191) NOT NULL,
    `jumlah` DECIMAL(10, 2) NOT NULL,
    `hargaBeli` DECIMAL(10, 2) NULL,
    `totalHargaItem` DECIMAL(12, 2) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stok_masuk_penerimaanId_idx`(`penerimaanId`),
    INDEX `stok_masuk_bahanBakuId_idx`(`bahanBakuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_keluar` (
    `id` VARCHAR(191) NOT NULL,
    `pengeluaranId` VARCHAR(191) NOT NULL,
    `bahanBakuId` VARCHAR(191) NOT NULL,
    `jumlah` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stok_keluar_pengeluaranId_idx`(`pengeluaranId`),
    INDEX `stok_keluar_bahanBakuId_idx`(`bahanBakuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_opname` (
    `id` VARCHAR(191) NOT NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` TEXT NULL,
    `addedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stok_opname_addedById_idx`(`addedById`),
    INDEX `stok_opname_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stok_opname_item` (
    `id` VARCHAR(191) NOT NULL,
    `opnameId` VARCHAR(191) NOT NULL,
    `bahanBakuId` VARCHAR(191) NOT NULL,
    `stokSistem` DECIMAL(10, 2) NOT NULL,
    `stokFisik` DECIMAL(10, 2) NOT NULL,
    `selisih` DECIMAL(10, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `stok_opname_item_opnameId_idx`(`opnameId`),
    INDEX `stok_opname_item_bahanBakuId_idx`(`bahanBakuId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `nomorOrder` VARCHAR(50) NOT NULL,
    `channel` ENUM('LANGSUNG', 'WHATSAPP', 'INSTAGRAM', 'MARKETPLACE', 'WEBSITE', 'LAINNYA') NOT NULL DEFAULT 'LANGSUNG',
    `statusProduksi` ENUM('PENDING', 'DESAIN', 'PRODUKSI', 'PACKING', 'SELESAI', 'BATAL') NOT NULL DEFAULT 'PENDING',
    `statusPembayaran` ENUM('BELUM_BAYAR', 'DP', 'LUNAS', 'REFUND') NOT NULL DEFAULT 'BELUM_BAYAR',
    `metodePembayaran` ENUM('TUNAI', 'TRANSFER', 'QRIS', 'KREDIT', 'LAINNYA') NOT NULL DEFAULT 'TUNAI',
    `deadline` DATETIME(3) NULL,
    `catatan` TEXT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `diskon` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `ongkir` DECIMAL(12, 2) NULL,
    `grandTotal` DECIMAL(12, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `order_nomorOrder_key`(`nomorOrder`),
    INDEX `order_customerId_idx`(`customerId`),
    INDEX `order_userId_idx`(`userId`),
    INDEX `order_nomorOrder_idx`(`nomorOrder`),
    INDEX `order_statusPembayaran_idx`(`statusPembayaran`),
    INDEX `order_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_item` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `productId` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `harga` DECIMAL(12, 2) NOT NULL,
    `qty` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(12, 2) NOT NULL,
    `catatan` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `order_item_orderId_idx`(`orderId`),
    INDEX `order_item_productId_idx`(`productId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `design_file` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `nama` TEXT NOT NULL,
    `filePath` TEXT NOT NULL,
    `uploadedById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `design_file_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `nomorSpk` VARCHAR(50) NULL,
    `karyawanId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `tahapProduksi` ENUM('PENDING', 'DESAIN', 'PRODUKSI', 'PACKING', 'SELESAI', 'BATAL') NOT NULL,
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
    UNIQUE INDEX `spk_nomorSpk_key`(`nomorSpk`),
    INDEX `spk_karyawanId_idx`(`karyawanId`),
    INDEX `spk_tahapProduksi_idx`(`tahapProduksi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pengeluaran_barang` (
    `id` VARCHAR(191) NOT NULL,
    `spkId` VARCHAR(191) NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `keterangan` TEXT NULL,
    `addedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pengeluaran_barang_spkId_idx`(`spkId`),
    INDEX `pengeluaran_barang_addedById_idx`(`addedById`),
    INDEX `pengeluaran_barang_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment` (
    `id` VARCHAR(191) NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `nominal` DECIMAL(12, 2) NOT NULL,
    `metodePembayaran` ENUM('TUNAI', 'TRANSFER', 'QRIS', 'KREDIT', 'LAINNYA') NOT NULL DEFAULT 'TUNAI',
    `keterangan` TEXT NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payment_orderId_idx`(`orderId`),
    INDEX `payment_userId_idx`(`userId`),
    INDEX `payment_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cost` (
    `id` VARCHAR(191) NOT NULL,
    `akunId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `nama` TEXT NOT NULL,
    `nominal` DECIMAL(12, 2) NOT NULL,
    `keterangan` TEXT NULL,
    `buktiNota` TEXT NULL,
    `tanggal` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cost_akunId_idx`(`akunId`),
    INDEX `cost_userId_idx`(`userId`),
    INDEX `cost_tanggal_idx`(`tanggal`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `akun` (
    `id` VARCHAR(191) NOT NULL,
    `kodeAkun` VARCHAR(20) NOT NULL,
    `namaAkun` TEXT NOT NULL,
    `kelompok` VARCHAR(191) NOT NULL,
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
    `nominal` DECIMAL(12, 2) NOT NULL,
    `paymentId` VARCHAR(191) NULL,
    `costId` VARCHAR(191) NULL,
    `penerimaanId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `jurnal_umum_paymentId_key`(`paymentId`),
    UNIQUE INDEX `jurnal_umum_costId_key`(`costId`),
    UNIQUE INDEX `jurnal_umum_penerimaanId_key`(`penerimaanId`),
    INDEX `jurnal_umum_tanggal_idx`(`tanggal`),
    INDEX `jurnal_umum_paymentId_idx`(`paymentId`),
    INDEX `jurnal_umum_costId_idx`(`costId`),
    INDEX `jurnal_umum_akunDebetId_idx`(`akunDebetId`),
    INDEX `jurnal_umum_akunKreditId_idx`(`akunKreditId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kas_bank` (
    `id` VARCHAR(191) NOT NULL,
    `namaRekening` TEXT NOT NULL,
    `jenisRekening` VARCHAR(20) NOT NULL,
    `nomorRekening` VARCHAR(50) NULL,
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

-- CreateTable
CREATE TABLE `app_setting` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `namaPerusahaan` VARCHAR(100) NOT NULL DEFAULT 'CV. Haqi Koleksi',
    `logoUrl` TEXT NULL,
    `alamat` TEXT NULL,
    `nomorKontak` VARCHAR(50) NULL,
    `prefixOrder` VARCHAR(20) NOT NULL DEFAULT 'INV-HQ-',
    `catatanKakiStruk` TEXT NULL,
    `prefixSpk` VARCHAR(20) NOT NULL DEFAULT 'SPK-',
    `estimasiHariPengerjaan` INTEGER NOT NULL DEFAULT 14,
    `defaultPendapatanAkunId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product` ADD CONSTRAINT `product_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bahan_baku` ADD CONSTRAINT `bahan_baku_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `unit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penerimaan_barang` ADD CONSTRAINT `penerimaan_barang_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `supplier`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `penerimaan_barang` ADD CONSTRAINT `penerimaan_barang_addedById_fkey` FOREIGN KEY (`addedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_masuk` ADD CONSTRAINT `stok_masuk_penerimaanId_fkey` FOREIGN KEY (`penerimaanId`) REFERENCES `penerimaan_barang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_masuk` ADD CONSTRAINT `stok_masuk_bahanBakuId_fkey` FOREIGN KEY (`bahanBakuId`) REFERENCES `bahan_baku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_keluar` ADD CONSTRAINT `stok_keluar_pengeluaranId_fkey` FOREIGN KEY (`pengeluaranId`) REFERENCES `pengeluaran_barang`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_keluar` ADD CONSTRAINT `stok_keluar_bahanBakuId_fkey` FOREIGN KEY (`bahanBakuId`) REFERENCES `bahan_baku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_opname` ADD CONSTRAINT `stok_opname_addedById_fkey` FOREIGN KEY (`addedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_opname_item` ADD CONSTRAINT `stok_opname_item_opnameId_fkey` FOREIGN KEY (`opnameId`) REFERENCES `stok_opname`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stok_opname_item` ADD CONSTRAINT `stok_opname_item_bahanBakuId_fkey` FOREIGN KEY (`bahanBakuId`) REFERENCES `bahan_baku`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `design_file` ADD CONSTRAINT `design_file_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `design_file` ADD CONSTRAINT `design_file_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk` ADD CONSTRAINT `spk_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk` ADD CONSTRAINT `spk_karyawanId_fkey` FOREIGN KEY (`karyawanId`) REFERENCES `karyawan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `spk` ADD CONSTRAINT `spk_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran_barang` ADD CONSTRAINT `pengeluaran_barang_spkId_fkey` FOREIGN KEY (`spkId`) REFERENCES `spk`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pengeluaran_barang` ADD CONSTRAINT `pengeluaran_barang_addedById_fkey` FOREIGN KEY (`addedById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment` ADD CONSTRAINT `payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cost` ADD CONSTRAINT `cost_akunId_fkey` FOREIGN KEY (`akunId`) REFERENCES `akun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_penerimaanId_fkey` FOREIGN KEY (`penerimaanId`) REFERENCES `penerimaan_barang`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jurnal_umum` ADD CONSTRAINT `jurnal_umum_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kas_bank` ADD CONSTRAINT `kas_bank_akunId_fkey` FOREIGN KEY (`akunId`) REFERENCES `akun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `app_setting` ADD CONSTRAINT `app_setting_defaultPendapatanAkunId_fkey` FOREIGN KEY (`defaultPendapatanAkunId`) REFERENCES `akun`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
