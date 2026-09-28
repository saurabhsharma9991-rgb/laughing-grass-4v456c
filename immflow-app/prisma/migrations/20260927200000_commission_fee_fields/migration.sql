-- Commission fee tracking on marketplace orders and bookings
ALTER TABLE `translation_orders`
  ADD COLUMN `platform_fee_cents` INT NULL,
  ADD COLUMN `provider_share_cents` INT NULL,
  ADD COLUMN `commission_percent` INT NULL;

ALTER TABLE `service_bookings`
  ADD COLUMN `platform_fee_cents` INT NULL,
  ADD COLUMN `provider_share_cents` INT NULL,
  ADD COLUMN `commission_percent` INT NULL;
