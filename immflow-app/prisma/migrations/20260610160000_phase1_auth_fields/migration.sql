-- AlterTable
ALTER TABLE `users` ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `verification_token` VARCHAR(191) NULL,
    ADD COLUMN `reset_token` VARCHAR(191) NULL,
    ADD COLUMN `reset_token_expires` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `listings` ADD COLUMN `description` TEXT NULL;
