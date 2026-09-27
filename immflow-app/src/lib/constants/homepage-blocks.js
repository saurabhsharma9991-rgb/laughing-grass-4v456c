import { createBlockId } from "./cms-page-blocks.js";

const GENERIC_HOME_BLOCKS = [
  { type: "heading", label: "Heading", description: "Section title (H2 / H3)", icon: "🔠" },
  { type: "paragraph", label: "Paragraph", description: "Body text with line breaks", icon: "¶" },
  { type: "cards", label: "Feature cards", description: "Cards in a row with links", icon: "▦" },
  { type: "cta", label: "Call to action", description: "Highlighted box with button", icon: "👉" },
  { type: "html", label: "Custom HTML", description: "Free-hand HTML block", icon: "</>" },
  { type: "divider", label: "Divider", description: "Horizontal rule between sections", icon: "—" },
];

export const HOME_BLOCK_TYPES = [
  {
    type: "home_hero",
    label: "Marketplace hero",
    description: "Headline, badge, CTAs (+ category tiles & AI finder)",
    icon: "🏠",
  },
  {
    type: "home_network",
    label: "Attorney network strip",
    description: "Network promo with AI match panel",
    icon: "🤝",
  },
  {
    type: "home_stats",
    label: "Stats banner",
    description: "Four stats (live counts override where applicable)",
    icon: "📊",
  },
  {
    type: "home_ways",
    label: "Ways to Use ImmFlow",
    description: "Dynamic feature cards with links",
    icon: "✦",
  },
  {
    type: "home_ai",
    label: "AI matcher promo",
    description: "AI section heading and CTA",
    icon: "🤖",
  },
  {
    type: "home_featured",
    label: "Featured attorneys",
    description: "Featured block heading",
    icon: "⭐",
  },
  {
    type: "home_pricing",
    label: "Pricing",
    description: "Pricing section intro",
    icon: "💳",
  },
  {
    type: "home_join",
    label: "Join CTA",
    description: "Bottom call-to-action banner",
    icon: "🚀",
  },
  ...GENERIC_HOME_BLOCKS,
];

export function defaultHomeBlockData(type) {
  switch (type) {
    case "home_hero":
      return {
        badge: "Immigration services marketplace",
        title: "Find the right\nimmigration help",
        subtitle:
          "Attorneys, certified translation, interpreters, and psychological evaluations — verified professionals in one place.",
        cta_primary: "Find an attorney",
        cta_primary_href: "/attorneys",
        cta_secondary: "Browse job board",
        cta_secondary_href: "/jobs",
        cta_tertiary: "Join free →",
        cta_tertiary_href: "#signup",
      };
    case "home_network":
      return {
        badge: "Attorney network",
        title: "Hearing coverage, jobs & referrals",
        body: "Attorneys can still post listings, find coverage, and connect peer-to-peer — alongside the services marketplace.",
        primaryLabel: "Find an attorney",
        primaryHref: "/attorneys",
        secondaryLabel: "Browse job board",
        secondaryHref: "/jobs",
        aiPanelTitle: "✦ AI matched for you",
        aiPanelCta: "Run AI match ✦",
        aiPanelHref: "/matcher",
      };
    case "home_stats":
      return {
        attorneys_label: "Verified attorneys",
        states_count: "50 states",
        states_label: "Coverage",
        listings_label: "Active listings",
        languages_label: "Languages",
      };
    case "home_ways":
      return {
        badge: "Ways to use ImmFlow",
        title: "Ways to Use ImmFlow",
        cards: [
          {
            icon: "⚖️",
            title: "Find an attorney",
            desc: "Browse verified immigration attorneys by case type, language, and availability.",
            cta: "Browse attorneys",
            href: "/attorneys",
          },
          {
            icon: "🌐",
            title: "Translation, interpreters & psych",
            desc: "Book certified translation, interpreters ($150/hr remote · $200/hr in-person), and psychological evaluations.",
            cta: "Browse services",
            href: "/services",
          },
          {
            icon: "🤝",
            title: "Job board & attorney network",
            desc: "Post and find roles, hearing coverage, and peer connections for coverage, co-counsel, and referrals.",
            cta: "Explore network",
            href: "/network",
          },
        ],
      };
    case "home_ai":
      return {
        badge: "AI-powered",
        title: "Smart matching, not just search",
        cta: "Try the AI matcher ✦",
        href: "/matcher",
      };
    case "home_featured":
      return {
        badge: "Featured",
        title: "Top-rated attorneys",
        cta: "See all",
        href: "/attorneys",
      };
    case "home_pricing":
      return {
        badge: "Pricing",
        title: "Simple, transparent pricing",
        subtitle: "Free to start. Upgrade when you're ready to grow.",
      };
    case "home_join":
      return {
        title: "Ready to join ImmFlow?",
        subtitle: "Free to join. Post listings, find coverage, build your reputation.",
        cta: "Create free attorney account →",
        href: "#signup",
        cta_secondary: "Browse listings",
        secondary_href: "/jobs",
      };
    case "heading":
      return { text: "Section heading", level: 2 };
    case "paragraph":
      return { text: "Write your paragraph here." };
    case "cards":
      return {
        items: [
          { icon: "✦", title: "Card one", body: "Short description.", href: "/" },
          { icon: "✦", title: "Card two", body: "Short description.", href: "/" },
        ],
      };
    case "cta":
      return {
        title: "Ready to get started?",
        text: "Create a free account or browse services.",
        buttonLabel: "Browse services",
        buttonHref: "/services",
      };
    case "html":
      return { html: "<div class=\"custom\">\n  <p>Your custom HTML here</p>\n</div>" };
    case "divider":
      return {};
    default:
      return {};
  }
}

export function createHomeBlock(type) {
  return {
    id: createBlockId(),
    type,
    data: defaultHomeBlockData(type),
  };
}

const CARD_HREFS = ["/attorneys", "/services", "/network"];

/** Build homepage layout from legacy flat CMS keys when home.layout is missing. */
export function buildDefaultHomepageDocument(getFn) {
  const get = typeof getFn === "function" ? getFn : () => "";

  const waysCards = [1, 2, 3].map((n, i) => ({
    icon: get(`home.card${n}.icon`, defaultHomeBlockData("home_ways").cards[i]?.icon || "✦"),
    title: get(`home.card${n}.title`, defaultHomeBlockData("home_ways").cards[i]?.title || ""),
    desc: get(
      `home.card${n}.desc`,
      defaultHomeBlockData("home_ways").cards[i]?.desc || ""
    ),
    cta: get(`home.card${n}.cta`, defaultHomeBlockData("home_ways").cards[i]?.cta || "Learn more"),
    href: CARD_HREFS[i] || "/",
  }));

  const heroDefaults = defaultHomeBlockData("home_hero");
  const networkDefaults = defaultHomeBlockData("home_network");

  const blocks = [
    createHomeBlock("home_hero"),
    createHomeBlock("home_network"),
    createHomeBlock("home_stats"),
    createHomeBlock("home_ways"),
    createHomeBlock("home_ai"),
    createHomeBlock("home_featured"),
    createHomeBlock("home_pricing"),
    createHomeBlock("home_join"),
  ];

  blocks[0].data = {
    badge: get("home.hero.badge", heroDefaults.badge),
    title: get("home.hero.title", heroDefaults.title),
    subtitle: get("home.hero.subtitle", heroDefaults.subtitle),
    cta_primary: get("home.hero.cta_primary", heroDefaults.cta_primary),
    cta_primary_href: heroDefaults.cta_primary_href,
    cta_secondary: get("home.hero.cta_secondary", heroDefaults.cta_secondary),
    cta_secondary_href: heroDefaults.cta_secondary_href,
    cta_tertiary: get("home.hero.cta_tertiary", heroDefaults.cta_tertiary),
    cta_tertiary_href: heroDefaults.cta_tertiary_href,
  };

  blocks[1].data = {
    ...networkDefaults,
    primaryLabel: get("home.hero.cta_primary", networkDefaults.primaryLabel),
    secondaryLabel: get("home.hero.cta_secondary", networkDefaults.secondaryLabel),
  };

  blocks[2].data = {
    attorneys_label: get("home.stats.attorneys_label", "Verified attorneys"),
    states_count: get("home.stats.states_count", "50 states"),
    states_label: get("home.stats.states_label", "Coverage"),
    listings_label: get("home.stats.listings_label", "Active listings"),
    languages_label: get("home.stats.languages_label", "Languages"),
  };

  blocks[3].data = {
    badge: get("home.how_it_works.badge", "Ways to use ImmFlow"),
    title: get("home.how_it_works.title", "Ways to Use ImmFlow"),
    cards: waysCards,
  };

  blocks[4].data = {
    badge: get("home.ai.badge", defaultHomeBlockData("home_ai").badge),
    title: get("home.ai.title", defaultHomeBlockData("home_ai").title),
    cta: get("home.ai.cta", defaultHomeBlockData("home_ai").cta),
    href: defaultHomeBlockData("home_ai").href,
  };

  blocks[5].data = {
    badge: get("home.featured.badge", defaultHomeBlockData("home_featured").badge),
    title: get("home.featured.title", defaultHomeBlockData("home_featured").title),
    cta: get("home.featured.cta", defaultHomeBlockData("home_featured").cta),
    href: defaultHomeBlockData("home_featured").href,
  };

  blocks[6].data = {
    badge: get("home.pricing.badge", defaultHomeBlockData("home_pricing").badge),
    title: get("home.pricing.title", defaultHomeBlockData("home_pricing").title),
    subtitle: get("home.pricing.subtitle", defaultHomeBlockData("home_pricing").subtitle),
  };

  blocks[7].data = {
    title: get("home.join.title", defaultHomeBlockData("home_join").title),
    subtitle: get("home.join.subtitle", defaultHomeBlockData("home_join").subtitle),
    cta: get("home.join.cta", defaultHomeBlockData("home_join").cta),
    href: defaultHomeBlockData("home_join").href,
    cta_secondary: get("home.join.cta_secondary", defaultHomeBlockData("home_join").cta_secondary),
    secondary_href: defaultHomeBlockData("home_join").secondary_href,
  };

  return {
    version: 1,
    blocks,
  };
}

export function createEmptyHomepageDocument() {
  return {
    version: 1,
    blocks: [createHomeBlock("home_hero")],
  };
}
