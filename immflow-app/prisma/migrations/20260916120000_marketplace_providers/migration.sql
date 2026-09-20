-- Marketplace Phase A: service categories + universal providers

ALTER TABLE `users` ADD COLUMN `preferred_locale` VARCHAR(191) NOT NULL DEFAULT 'en';

CREATE TABLE `service_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `profile_schema` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `service_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `providers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `category_id` INTEGER NOT NULL,
    `display_name` VARCHAR(191) NOT NULL,
    `initials` VARCHAR(5) NULL,
    `photo_url` MEDIUMTEXT NULL,
    `bio` TEXT NULL,
    `location` VARCHAR(191) NULL,
    `experience_years` INTEGER NULL,
    `rate` VARCHAR(191) NULL,
    `availability` VARCHAR(191) NULL,
    `remote_available` BOOLEAN NOT NULL DEFAULT true,
    `in_person_available` BOOLEAN NOT NULL DEFAULT false,
    `languages` TEXT NULL,
    `verification_status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `rejection_reason` TEXT NULL,
    `stars` DECIMAL(2, 1) NOT NULL DEFAULT 5.0,
    `reviews_count` INTEGER NOT NULL DEFAULT 0,
    `availability_slots` JSON NULL,
    `profile_data` JSON NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `providers_user_id_category_id_key`(`user_id`, `category_id`),
    INDEX `providers_category_id_idx`(`category_id`),
    INDEX `providers_verification_status_idx`(`verification_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `provider_credentials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider_id` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `organization` VARCHAR(191) NULL,
    `credential_number` VARCHAR(191) NULL,
    `issued_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `document_url` MEDIUMTEXT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `provider_credentials_provider_id_idx`(`provider_id`),
    INDEX `provider_credentials_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `provider_language_pairs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider_id` INTEGER NOT NULL,
    `source_language` VARCHAR(191) NOT NULL,
    `target_language` VARCHAR(191) NOT NULL,
    UNIQUE INDEX `provider_lang_pairs_unique`(`provider_id`, `source_language`, `target_language`),
    INDEX `provider_lang_pairs_provider_idx`(`provider_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `providers` ADD CONSTRAINT `providers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `providers` ADD CONSTRAINT `providers_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `service_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `provider_credentials` ADD CONSTRAINT `provider_credentials_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `provider_language_pairs` ADD CONSTRAINT `provider_language_pairs_provider_id_fkey` FOREIGN KEY (`provider_id`) REFERENCES `providers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default categories (admin can edit/add more)
INSERT INTO `service_categories` (`slug`, `name`, `description`, `icon`, `is_active`, `sort_order`, `profile_schema`, `updated_at`) VALUES
('attorney', 'Immigration Attorneys', 'Verified immigration attorneys for hearing coverage, outsourcing, and referrals.', 'scale', true, 1, JSON_OBJECT('fields', JSON_ARRAY('barNumber', 'stateBar', 'specialties')), NOW(3)),
('translation', 'Certified Translation', 'Certified and professional document translation services.', 'translate', true, 2, JSON_OBJECT('fields', JSON_ARRAY('translatorType', 'languagePairs', 'certification', 'turnaround', 'rushAvailable', 'documentTypes')), NOW(3)),
('interpreter', 'Interpreters', 'In-person, phone, and video interpretation for legal and immigration settings.', 'mic', true, 3, JSON_OBJECT('fields', JSON_ARRAY('languagePairs', 'serviceTypes', 'hourlyRate', 'minimumBooking')), NOW(3)),
('psychological', 'Psychological Services', 'Licensed mental-health professionals for immigration-related evaluations.', 'heart', true, 4, JSON_OBJECT('fields', JSON_ARRAY('professionalType', 'licenseType', 'licenseState', 'licenseNumber', 'licenseExpires', 'evaluationTypes', 'telehealth')), NOW(3));

-- Migrate existing attorneys into providers
INSERT INTO `providers` (
  `user_id`, `category_id`, `display_name`, `initials`, `photo_url`, `bio`, `location`,
  `experience_years`, `rate`, `availability`, `remote_available`, `in_person_available`,
  `languages`, `verification_status`, `stars`, `reviews_count`, `availability_slots`,
  `profile_data`, `is_active`, `updated_at`
)
SELECT
  a.`user_id`,
  (SELECT `id` FROM `service_categories` WHERE `slug` = 'attorney' LIMIT 1),
  a.`name`,
  a.`initials`,
  a.`photo_url`,
  a.`bio`,
  a.`location`,
  a.`experience_years`,
  a.`rate`,
  a.`availability`,
  true,
  true,
  a.`languages`,
  CASE WHEN a.`is_verified` = true THEN 'verified' ELSE 'pending' END,
  a.`stars`,
  a.`reviews_count`,
  a.`availability_slots`,
  JSON_OBJECT(
    'barNumber', a.`bar_number`,
    'stateBar', a.`state_bar`,
    'specialties', a.`specialties`
  ),
  true,
  NOW(3)
FROM `attorneys` a
WHERE NOT EXISTS (
  SELECT 1 FROM `providers` p
  WHERE p.`user_id` = a.`user_id`
    AND p.`category_id` = (SELECT `id` FROM `service_categories` WHERE `slug` = 'attorney' LIMIT 1)
);

-- Copy bar credentials for migrated attorneys
INSERT INTO `provider_credentials` (
  `provider_id`, `label`, `organization`, `credential_number`, `status`, `updated_at`
)
SELECT
  p.`id`,
  'State bar',
  JSON_UNQUOTE(JSON_EXTRACT(p.`profile_data`, '$.stateBar')),
  JSON_UNQUOTE(JSON_EXTRACT(p.`profile_data`, '$.barNumber')),
  CASE WHEN p.`verification_status` = 'verified' THEN 'verified' ELSE 'pending' END,
  NOW(3)
FROM `providers` p
JOIN `service_categories` c ON c.`id` = p.`category_id` AND c.`slug` = 'attorney'
WHERE JSON_EXTRACT(p.`profile_data`, '$.barNumber') IS NOT NULL
  AND JSON_UNQUOTE(JSON_EXTRACT(p.`profile_data`, '$.barNumber')) <> 'null'
  AND NOT EXISTS (
    SELECT 1 FROM `provider_credentials` pc WHERE pc.`provider_id` = p.`id` AND pc.`label` = 'State bar'
  );
