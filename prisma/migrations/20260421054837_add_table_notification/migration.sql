-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- CreateTable
CREATE TABLE `notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NULL,
    `title` VARCHAR(100) NOT NULL,
    `message` TEXT NOT NULL,
    `jenis` ENUM('ORDER_BARU', 'STATUS_ORDER_UBAH', 'DEADLINE_DEKAT', 'STOK_MENIPIS', 'PENERIMAAN_BARU', 'PAYMENT_MASUK', 'BIAYA_DICATAT', 'SISTEM') NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `linkUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notification_userId_idx`(`userId`),
    INDEX `notification_isRead_idx`(`isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
