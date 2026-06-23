/*
  Warnings:

  - You are about to drop the column `nationalId` on the `registrations` table. All the data in the column will be lost.
  - Added the required column `jobTitle` to the `registrations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `registrations` DROP COLUMN `nationalId`,
    ADD COLUMN `jobTitle` VARCHAR(191) NOT NULL;
