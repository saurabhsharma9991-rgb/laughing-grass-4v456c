-- Admin-managed free-form site pages (About, Terms, Pricing, custom, …)
CREATE TABLE `cms_pages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(120) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `excerpt` TEXT NULL,
    `body` LONGTEXT NOT NULL,
    `translations` JSON NULL,
    `footer_column` VARCHAR(40) NULL,
    `show_in_footer` BOOLEAN NOT NULL DEFAULT false,
    `show_in_nav` BOOLEAN NOT NULL DEFAULT false,
    `footer_sort` INTEGER NOT NULL DEFAULT 0,
    `nav_sort` INTEGER NOT NULL DEFAULT 0,
    `is_published` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cms_pages_slug_key`(`slug`),
    INDEX `cms_pages_is_published_show_in_footer_idx`(`is_published`, `show_in_footer`),
    INDEX `cms_pages_is_published_show_in_nav_idx`(`is_published`, `show_in_nav`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Seed starter company / attorney pages so footer links are real out of the box
INSERT INTO `cms_pages`
  (`slug`, `title`, `excerpt`, `body`, `footer_column`, `show_in_footer`, `show_in_nav`, `footer_sort`, `nav_sort`, `is_published`, `updated_at`)
VALUES
  (
    'about',
    'About ImmFlow',
    'A marketplace for verified immigration service professionals.',
    'ImmFlow is a marketplace that helps people find verified immigration attorneys, translators, interpreters, and psychological evaluation professionals.\n\nWe focus on discovery and connection — professionals on ImmFlow operate independently. ImmFlow does not provide legal advice or legal services.',
    'company',
    true,
    false,
    10,
    0,
    true,
    CURRENT_TIMESTAMP(3)
  ),
  (
    'contact',
    'Contact us',
    'Get in touch with the ImmFlow team.',
    'Have a question about ImmFlow, your account, or a listing?\n\nEmail us at support@myimmflow.com and we will get back to you as soon as we can.\n\nFor marketplace help and common questions, visit our Help & FAQ page.',
    'company',
    true,
    false,
    20,
    0,
    true,
    CURRENT_TIMESTAMP(3)
  ),
  (
    'terms',
    'Terms of use',
    'Terms that govern use of the ImmFlow marketplace.',
    'By using ImmFlow you agree to use the platform lawfully and respectfully.\n\nImmFlow is a discovery and connection marketplace. Profiles, listings, and messages are created by independent users. ImmFlow does not provide legal advice, legal representation, translation services, interpretation, or clinical services.\n\nYou are responsible for the accuracy of information you post. We may suspend accounts that misuse the platform, spam others, or violate applicable law.\n\nThese terms may be updated from time to time. Continued use of ImmFlow after changes means you accept the updated terms.\n\nFor questions, contact support@myimmflow.com.',
    'company',
    true,
    false,
    40,
    0,
    true,
    CURRENT_TIMESTAMP(3)
  ),
  (
    'pricing',
    'Pricing',
    'Free discovery for clients. ImmFlow Pro for professionals and power users.',
    'ImmFlow Free includes browsing professionals, applying to listings, and client-to-professional contact.\n\nImmFlow Pro unlocks AI matcher rankings, unlimited active job board listings, professional peer messaging, and priority intake for Pro clients.\n\nYou can manage billing anytime from your Dashboard. Pricing shown on the homepage reflects the current Pro subscription offer.',
    'attorneys',
    true,
    false,
    30,
    0,
    true,
    CURRENT_TIMESTAMP(3)
  ),
  (
    'create-profile',
    'Create a professional profile',
    'Join ImmFlow as an attorney or service provider.',
    'Attorneys and other immigration service professionals can create a verified profile on ImmFlow to appear in search, receive client inquiries, and post job board listings.\n\nSign up from the homepage, choose a professional account, complete your profile, and submit for verification. Once approved, your profile can appear in the directory and network.\n\nNeed help getting started? Email support@myimmflow.com.',
    'attorneys',
    true,
    false,
    10,
    0,
    true,
    CURRENT_TIMESTAMP(3)
  );
