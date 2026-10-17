-- Free tier no longer includes any active job board listings.
UPDATE `site_content` SET `value` = '0' WHERE `key` = 'platform.free_listing_limit';
