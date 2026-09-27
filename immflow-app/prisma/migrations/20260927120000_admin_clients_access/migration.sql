-- Grant Support roles access to the new Clients admin area.
UPDATE `admin_roles`
SET `permissions` = JSON_SET(
  `permissions`,
  '$.clients.view', TRUE,
  '$.clients.edit', TRUE
)
WHERE `slug` = 'support' AND JSON_VALID(`permissions`);

-- Super Admin already receives full permissions on seed; keep existing installs in sync.
UPDATE `admin_roles`
SET `permissions` = JSON_SET(
  `permissions`,
  '$.clients.view', TRUE,
  '$.clients.edit', TRUE
)
WHERE `slug` = 'super_admin' AND JSON_VALID(`permissions`);
