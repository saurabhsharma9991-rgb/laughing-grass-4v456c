-- Subscription columns were missing from 20260610170000_add_subscription_fields
ALTER TABLE `users` ADD COLUMN `is_pro` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `users` ADD COLUMN `subscription_plan` VARCHAR(191) NOT NULL DEFAULT 'Free';
ALTER TABLE `users` ADD COLUMN `promo_used` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `subscription_expires` DATETIME(3) NULL;
