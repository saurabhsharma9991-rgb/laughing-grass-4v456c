CREATE TABLE `ai_response_cache` (
  `cache_key` VARCHAR(64) NOT NULL,
  `feature` VARCHAR(40) NOT NULL,
  `model` VARCHAR(80) NOT NULL,
  `payload` JSON NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`cache_key`),
  INDEX `ai_response_cache_feature_expires_at_idx` (`feature`, `expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
