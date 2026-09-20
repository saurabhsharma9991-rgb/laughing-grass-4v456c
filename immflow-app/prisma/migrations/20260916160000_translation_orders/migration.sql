-- Translation marketplace orders + disk-backed file metadata

CREATE TABLE `translation_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `provider_id` INTEGER NULL,
    `source_language` VARCHAR(191) NOT NULL,
    `target_language` VARCHAR(191) NOT NULL,
    `document_type` VARCHAR(191) NOT NULL,
    `translation_type` VARCHAR(191) NOT NULL DEFAULT 'standard',
    `turnaround` VARCHAR(191) NOT NULL DEFAULT 'regular',
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending_payment',
    `price_cents` INTEGER NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'usd',
    `certification_note` TEXT NULL,
    `client_notes` TEXT NULL,
    `provider_notes` TEXT NULL,
    `stripe_checkout_session_id` VARCHAR(191) NULL,
    `stripe_payment_intent_id` VARCHAR(191) NULL,
    `paid_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `translation_orders_stripe_checkout_session_id_key`(`stripe_checkout_session_id`),
    INDEX `translation_orders_client_id_idx`(`client_id`),
    INDEX `translation_orders_provider_id_idx`(`provider_id`),
    INDEX `translation_orders_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `translation_order_files` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_id` INTEGER NOT NULL,
    `kind` VARCHAR(191) NOT NULL DEFAULT 'source',
    `original_name` VARCHAR(191) NOT NULL,
    `stored_name` VARCHAR(191) NOT NULL,
    `relative_path` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NULL,
    `size_bytes` INTEGER NOT NULL,
    `uploaded_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `translation_order_files_order_id_idx`(`order_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `translation_orders` ADD CONSTRAINT `translation_orders_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `translation_orders` ADD CONSTRAINT `translation_orders_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `translation_order_files` ADD CONSTRAINT `translation_order_files_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `translation_orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `translation_order_files` ADD CONSTRAINT `translation_order_files_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
