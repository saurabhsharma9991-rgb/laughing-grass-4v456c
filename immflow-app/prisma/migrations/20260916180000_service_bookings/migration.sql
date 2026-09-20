CREATE TABLE `service_bookings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `provider_id` INTEGER NULL,
    `booking_type` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'requested',
    `language` VARCHAR(191) NULL,
    `source_language` VARCHAR(191) NULL,
    `target_language` VARCHAR(191) NULL,
    `service_type` VARCHAR(191) NULL,
    `modality` VARCHAR(191) NOT NULL DEFAULT 'remote',
    `scheduled_at` DATETIME(3) NULL,
    `duration_minutes` INTEGER NULL,
    `location` VARCHAR(191) NULL,
    `price_cents` INTEGER NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'usd',
    `client_notes` TEXT NULL,
    `provider_notes` TEXT NULL,
    `disclaimer_ack` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `service_bookings_client_id_idx`(`client_id`),
    INDEX `service_bookings_provider_id_idx`(`provider_id`),
    INDEX `service_bookings_booking_type_idx`(`booking_type`),
    INDEX `service_bookings_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `service_bookings` ADD CONSTRAINT `service_bookings_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `service_bookings` ADD CONSTRAINT `service_bookings_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
