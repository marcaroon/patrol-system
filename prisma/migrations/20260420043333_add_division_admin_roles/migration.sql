-- CreateTable
CREATE TABLE `hse_visit_photos` (
    `id` VARCHAR(191) NOT NULL,
    `areaVisitId` VARCHAR(191) NOT NULL,
    `photoUrl` TEXT NOT NULL,
    `description` TEXT NULL,
    `photoTimestamp` DATETIME(3) NOT NULL,
    `photoLatitude` DOUBLE NULL,
    `photoLongitude` DOUBLE NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `hse_visit_photos` ADD CONSTRAINT `hse_visit_photos_areaVisitId_fkey` FOREIGN KEY (`areaVisitId`) REFERENCES `hse_area_visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
