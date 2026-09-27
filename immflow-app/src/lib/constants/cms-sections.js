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
      {
        id: "home.layout",
        label: "Homepage layout",
        description: "Add, remove, reorder sections & cards",
      },
    ],
  },
  {
    page: "Support",
    sections: [
      {
        id: "help",
        label: "Help & FAQ",
        description: "Marketplace help introduction and frequently asked questions",
      },
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
