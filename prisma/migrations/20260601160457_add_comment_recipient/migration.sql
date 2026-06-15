-- DropIndex
DROP INDEX `product_sku_idx` ON `product`;

-- AlterTable
ALTER TABLE `notification` MODIFY `jenis` ENUM('ORDER_BARU', 'STATUS_ORDER_UBAH', 'DEADLINE_DEKAT', 'STOK_MENIPIS', 'PENERIMAAN_BARU', 'PAYMENT_MASUK', 'BIAYA_DICATAT', 'BARANG_KELUAR', 'SISTEM') NOT NULL;

-- CreateTable
CREATE TABLE `comment_recipient` (
    `id` VARCHAR(191) NOT NULL,
    `commentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `comment_recipient_userId_isRead_idx`(`userId`, `isRead`),
    UNIQUE INDEX `comment_recipient_commentId_userId_key`(`commentId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `product_sku_idx` ON `product`(`sku`(191));

-- AddForeignKey
ALTER TABLE `comment_recipient` ADD CONSTRAINT `comment_recipient_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `order_comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_recipient` ADD CONSTRAINT `comment_recipient_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
