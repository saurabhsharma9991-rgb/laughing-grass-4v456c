-- Phase 2: Stripe billing identifiers
ALTER TABLE `users` ADD COLUMN `stripe_customer_id` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `stripe_subscription_id` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `users_stripe_customer_id_key` ON `users`(`stripe_customer_id`);
CREATE UNIQUE INDEX `users_stripe_subscription_id_key` ON `users`(`stripe_subscription_id`);
