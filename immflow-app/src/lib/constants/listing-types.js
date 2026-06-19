/** Canonical listing types stored in MySQL (matches seed data). */
export const LISTING_TYPES = [
  { label: "Hearing coverage", value: "One-time" },
  { label: "Case outsourcing", value: "Project" },
  { label: "Full-time job", value: "Full-time" },
  { label: "Contract / temp", value: "Contract" },
  { label: "Of counsel", value: "Of counsel" },
];

/** JobsPage tab key → listing type values shown in that tab. */
export const JOBS_TAB_TYPES = {
  job: ["Full-time"],
  hearing: ["One-time"],
  outsource: ["Project"],
  contract: ["Contract", "Of counsel"],
};

export function listingMatchesTab(listingType, tabKey) {
  if (tabKey === "all") return true;
  const allowed = JOBS_TAB_TYPES[tabKey];
  return allowed ? allowed.includes(listingType) : true;
}
