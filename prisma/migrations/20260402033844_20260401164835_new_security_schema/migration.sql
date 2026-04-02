/*
  Warnings:

  - You are about to drop the column `referenceImageUrl` on the `area_sections` table. All the data in the column will be lost.
  - You are about to drop the column `findingDescription` on the `section_entries` table. All the data in the column will be lost.
  - You are about to drop the column `photoLatitude` on the `section_entries` table. All the data in the column will be lost.
  - You are about to drop the column `photoLongitude` on the `section_entries` table. All the data in the column will be lost.
  - You are about to drop the column `photoTimestamp` on the `section_entries` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `section_entries` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `section_entries` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `area_sections` DROP COLUMN `referenceImageUrl`;

-- AlterTable
ALTER TABLE `patrol_areas` ADD COLUMN `referenceImageUrl1` TEXT NULL,
    ADD COLUMN `referenceImageUrl2` TEXT NULL;

-- AlterTable
ALTER TABLE `section_entries` DROP COLUMN `findingDescription`,
    DROP COLUMN `photoLatitude`,
    DROP COLUMN `photoLongitude`,
    DROP COLUMN `photoTimestamp`,
    DROP COLUMN `photoUrl`,
    DROP COLUMN `status`;

-- CreateTable
CREATE TABLE `section_findings` (
    `id` VARCHAR(191) NOT NULL,
    `sectionEntryId` VARCHAR(191) NOT NULL,
    `status` ENUM('NO_FINDING', 'FINDING') NOT NULL,
    `findingDescription` TEXT NULL,
    `photoUrl` TEXT NOT NULL,
    `photoTimestamp` DATETIME(3) NOT NULL,
    `photoLatitude` DOUBLE NULL,
    `photoLongitude` DOUBLE NULL,
    `order` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `section_findings` ADD CONSTRAINT `section_findings_sectionEntryId_fkey` FOREIGN KEY (`sectionEntryId`) REFERENCES `section_entries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
