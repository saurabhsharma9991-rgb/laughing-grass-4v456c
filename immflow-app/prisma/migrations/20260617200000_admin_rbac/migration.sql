-- Phase 2 RBAC: admin roles and staff permissions
CREATE TABLE `admin_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `permissions` TEXT NOT NULL,
    `is_system` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admin_roles_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `users` ADD COLUMN `admin_role_id` INTEGER NULL;
ALTER TABLE `users` ADD COLUMN `display_name` VARCHAR(191) NULL;

ALTER TABLE `users` ADD CONSTRAINT `users_admin_role_id_fkey` FOREIGN KEY (`admin_role_id`) REFERENCES `admin_roles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
