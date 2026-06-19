-- Indexes for applications and messages (subscription columns synced via schema/db push)

CREATE UNIQUE INDEX `applications_listing_id_applicant_id_key` ON `applications`(`listing_id`, `applicant_id`);
CREATE INDEX `messages_sender_id_idx` ON `messages`(`sender_id`);
CREATE INDEX `messages_receiver_id_idx` ON `messages`(`receiver_id`);
