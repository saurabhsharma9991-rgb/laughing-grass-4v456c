/** Default feature access — admin can override via dashboard. */
export const DEFAULT_FEATURE_FLAGS = {
  browse_attorneys: {
    label: "Browse attorneys",
    description: "View the attorney directory and profiles.",
    free: true,
    pro: true,
  },
  apply_to_listings: {
    label: "Apply to listings",
    description: "Submit applications on the job board.",
    free: true,
    pro: true,
  },
  post_listings: {
    label: "Post listings",
    description: "Create job board listings (subject to listing limit on Free).",
    free: true,
    pro: true,
  },
  unlimited_listings: {
    label: "Unlimited active listings",
    description: "Bypass the Free tier active listing cap.",
    free: false,
    pro: true,
  },
  ai_matcher: {
    label: "AI matcher",
    description: "Rank attorneys with the smart matcher. Available to Pro clients and Pro attorneys.",
    free: false,
    pro: true,
  },
  direct_messaging: {
    label: "Direct messaging",
    description:
      "Professional peer chat for Pro attorneys/providers. Client-to-professional contact works on Free; Pro clients get priority intake messaging.",
    free: false,
    pro: true,
  },
  priority_contact: {
    label: "Priority professional contact",
    description:
      "Pro clients are marked as priority when contacting attorneys and providers.",
    free: false,
    pro: true,
  },
  attorney_network: {
    label: "Attorney network",
    description: "Browse the network page and connections.",
    free: true,
    pro: true,
  },
};

export const DEFAULT_FREE_LISTING_LIMIT = 1;

export const PROMO_CODE_TEST = "IMMFLOW2026";
