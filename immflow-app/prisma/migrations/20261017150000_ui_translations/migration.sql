-- CreateTable
CREATE TABLE `ui_translations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `locale` VARCHAR(10) NOT NULL,
    `source_hash` CHAR(64) NOT NULL,
    `source` TEXT NOT NULL,
    `translated` TEXT NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ui_translations_locale_source_hash_key`(`locale`, `source_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
