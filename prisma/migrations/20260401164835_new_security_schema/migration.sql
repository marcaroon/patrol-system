-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `division` ENUM('SECURITY', 'HSE') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'VIEWER') NOT NULL DEFAULT 'VIEWER',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patrol_areas` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patrol_areas_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `area_sections` (
    `id` VARCHAR(191) NOT NULL,
    `areaId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `referenceImageUrl` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `security_reports` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `patrolDate` VARCHAR(191) NOT NULL,
    `patrolTime` VARCHAR(191) NOT NULL,
    `formOpenedAt` DATETIME(3) NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `selfiePhotoUrl` TEXT NULL,
    `selfiePhotoTimestamp` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_area_visits` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `areaId` VARCHAR(191) NOT NULL,
    `order` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `section_entries` (
    `id` VARCHAR(191) NOT NULL,
    `areaVisitId` VARCHAR(191) NOT NULL,
    `areaSectionId` VARCHAR(191) NOT NULL,
    `status` ENUM('NO_FINDING', 'FINDING') NOT NULL,
    `findingDescription` TEXT NULL,
    `photoUrl` TEXT NOT NULL,
    `photoTimestamp` DATETIME(3) NOT NULL,
    `photoLatitude` DOUBLE NULL,
    `photoLongitude` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hse_reports` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `visitDate` VARCHAR(191) NOT NULL,
    `visitTime` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `hseSignatureUrl` TEXT NULL,
    `witnessSignatureUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hse_area_visits` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `areaName` VARCHAR(191) NOT NULL,
    `workActivities` TEXT NOT NULL,
    `hazardDescription` TEXT NOT NULL,
    `socializationDescription` TEXT NOT NULL,
    `evidencePhotoUrl` TEXT NOT NULL,
    `evidencePhotoTimestamp` DATETIME(3) NOT NULL,
    `evidencePhotoLatitude` DOUBLE NULL,
    `evidencePhotoLongitude` DOUBLE NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hse_hazards` (
    `id` VARCHAR(191) NOT NULL,
    `areaVisitId` VARCHAR(191) NOT NULL,
    `hazardType` ENUM('TERJATUH', 'TERGELINCIR', 'TERKENA_BENDA_TAJAM', 'TERBAKAR', 'TERSENGAT_LISTRIK', 'TERTIMPA_BENDA', 'TERHIRUP_GAS', 'KONTAK_BAHAN_KIMIA', 'KEBISINGAN', 'KELELAHAN', 'LAINNYA') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uploaded_files` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `area_sections` ADD CONSTRAINT `area_sections_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `patrol_areas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `security_reports` ADD CONSTRAINT `security_reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_area_visits` ADD CONSTRAINT `report_area_visits_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `security_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_area_visits` ADD CONSTRAINT `report_area_visits_areaId_fkey` FOREIGN KEY (`areaId`) REFERENCES `patrol_areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `section_entries` ADD CONSTRAINT `section_entries_areaVisitId_fkey` FOREIGN KEY (`areaVisitId`) REFERENCES `report_area_visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `section_entries` ADD CONSTRAINT `section_entries_areaSectionId_fkey` FOREIGN KEY (`areaSectionId`) REFERENCES `area_sections`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hse_reports` ADD CONSTRAINT `hse_reports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hse_area_visits` ADD CONSTRAINT `hse_area_visits_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `hse_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hse_hazards` ADD CONSTRAINT `hse_hazards_areaVisitId_fkey` FOREIGN KEY (`areaVisitId`) REFERENCES `hse_area_visits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
