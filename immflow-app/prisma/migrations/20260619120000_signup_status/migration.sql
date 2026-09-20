-- Phase 3: admin approve/reject signup flow
ALTER TABLE `users` ADD COLUMN `signup_status` VARCHAR(191) NOT NULL DEFAULT 'pending';
ALTER TABLE `users` ADD COLUMN `rejection_reason` TEXT NULL;

-- Existing accounts are grandfathered as approved
UPDATE `users` SET `signup_status` = 'approved' WHERE `signup_status` = 'pending';
