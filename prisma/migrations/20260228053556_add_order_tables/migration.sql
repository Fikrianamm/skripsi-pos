-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- CreateTable
CREATE TABLE `order` (
    `id` VARCHAR(191) NOT NULL,
    `customerId` VARCHAR(191) NOT NULL,
    `nomorOrder` VARCHAR(50) NOT NULL,
    `channel` ENUM('LANGSUNG', 'WHATSAPP', 'INSTAGRAM', 'MARKETPLACE', 'WEBSITE', 'LAINNYA') NOT NULL DEFAULT 'LANGSUNG',
    `statusProduksi` ENUM('PENDING', 'DESAIN', 'POTONG', 'SABLON', 'JAHIT', 'PACKING', 'SELESAI', 'BATAL') NOT NULL DEFAULT 'PENDING',
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
    INDEX `order_nomorOrder_idx`(`nomorOrder`),
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

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `order` ADD CONSTRAINT `order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_item` ADD CONSTRAINT `order_item_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `design_file` ADD CONSTRAINT `design_file_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `design_file` ADD CONSTRAINT `design_file_uploadedById_fkey` FOREIGN KEY (`uploadedById`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
