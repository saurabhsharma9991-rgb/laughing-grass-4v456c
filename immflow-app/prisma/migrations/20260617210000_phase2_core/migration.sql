-- PDF Phase 2: reviews, availability calendar, application messages
ALTER TABLE `attorneys` ADD COLUMN `availability_slots` TEXT NULL;

ALTER TABLE `applications` ADD COLUMN `message` TEXT NULL;

CREATE TABLE `reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `attorney_id` INTEGER NOT NULL,
    `reviewer_id` INTEGER NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_attorney_id_reviewer_id_key`(`attorney_id`, `reviewer_id`),
    INDEX `reviews_attorney_id_idx`(`attorney_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `reviews` ADD CONSTRAINT `reviews_attorney_id_fkey` FOREIGN KEY (`attorney_id`) REFERENCES `attorneys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_reviewer_id_fkey` FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
