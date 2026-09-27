/** Canonical listing types stored in MySQL (matches seed data). */
export const LISTING_TYPES = [
  { label: "Hearing coverage", value: "One-time", proOnly: true },
  { label: "Case outsourcing", value: "Project", proOnly: true },
  { label: "Full-time job", value: "Full-time", proOnly: false },
  { label: "Contract / temp", value: "Contract", proOnly: true },
  { label: "Of counsel", value: "Of counsel", proOnly: true },
];

/** JobsPage tab key → listing type values shown in that tab. */
export const JOBS_TAB_TYPES = {
  job: ["Full-time"],
  hearing: ["One-time"],
  outsource: ["Project"],
  contract: ["Contract", "Of counsel"],
};

/** Tabs / types that Free members cannot browse. */
export const PRO_ONLY_JOB_TABS = ["hearing", "outsource", "contract"];

export const PRO_ONLY_LISTING_TYPES = LISTING_TYPES.filter((t) => t.proOnly).map(
  (t) => t.value
);

export function isProOnlyListingType(listingType) {
  return PRO_ONLY_LISTING_TYPES.includes(listingType);
}

export function listingMatchesTab(listingType, tabKey) {
  if (tabKey === "all") return true;
  const allowed = JOBS_TAB_TYPES[tabKey];
  return allowed ? allowed.includes(listingType) : true;
}
