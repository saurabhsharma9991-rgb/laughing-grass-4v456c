ALTER TABLE `service_bookings`
  ADD COLUMN `stripe_checkout_session_id` VARCHAR(191) NULL,
  ADD COLUMN `stripe_payment_intent_id` VARCHAR(191) NULL,
  ADD COLUMN `paid_at` DATETIME(3) NULL,
  ADD UNIQUE INDEX `service_bookings_stripe_checkout_session_id_key` (`stripe_checkout_session_id`);

ALTER TABLE `site_content`
  ADD COLUMN `translations` JSON NULL;

-- Existing Support roles gain the marketplace moderation areas introduced
-- after the role was first seeded. Custom roles remain least-privilege.
UPDATE `admin_roles`
SET `permissions` = JSON_SET(
  `permissions`,
  '$.categories.view', TRUE,
  '$.providers.view', TRUE,
  '$.providers.edit', TRUE,
  '$.orders.view', TRUE,
  '$.orders.edit', TRUE,
  '$.bookings.view', TRUE,
  '$.bookings.edit', TRUE
)
WHERE `slug` = 'support' AND JSON_VALID(`permissions`);
