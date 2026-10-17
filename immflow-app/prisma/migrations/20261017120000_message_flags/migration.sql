-- Flag messages that share contact details for admin review
ALTER TABLE `messages`
  ADD COLUMN `flagged` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `flag_reason` VARCHAR(120) NULL;

CREATE INDEX `messages_flagged_idx` ON `messages`(`flagged`);
