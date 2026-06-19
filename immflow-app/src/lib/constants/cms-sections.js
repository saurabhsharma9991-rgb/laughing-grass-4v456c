/** Shopify-style CMS section map for the admin content editor. */
export const CMS_SECTION_GROUPS = [
  {
    page: "Global",
    sections: [
      { id: "navigation", label: "Navigation bar", description: "Logo and auth buttons" },
    ],
  },
  {
    page: "Homepage",
    sections: [
      { id: "home.hero", label: "Hero", description: "Main headline, CTAs, badge" },
      { id: "home.stats", label: "Stats banner", description: "Numbers below the hero" },
      { id: "home.how_it_works", label: "How it works", description: "Section heading" },
      { id: "home.card1", label: "Card — Find attorney", description: "First feature card" },
      { id: "home.card2", label: "Card — Job board", description: "Second feature card" },
      { id: "home.card3", label: "Card — Network", description: "Third feature card" },
      { id: "home.ai", label: "AI matcher promo", description: "AI section copy" },
      { id: "home.featured", label: "Featured attorneys", description: "Featured block heading" },
      { id: "home.pricing", label: "Pricing", description: "Pricing section intro" },
      { id: "home.join", label: "Join CTA", description: "Bottom call-to-action banner" },
    ],
  },
  {
    page: "Footer",
    sections: [
      { id: "footer", label: "Footer", description: "Logo, description, legal" },
    ],
  },
];

export const CMS_SECTION_IDS = CMS_SECTION_GROUPS.flatMap((g) =>
  g.sections.map((s) => s.id)
);
