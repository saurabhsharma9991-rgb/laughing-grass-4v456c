export const APPLICATION_STATUS = {
  applied: { label: "Applied", tone: "muted" },
  reviewed: { label: "Under review", tone: "blue" },
  accepted: { label: "Accepted", tone: "green" },
  rejected: { label: "Not selected", tone: "red" },
};

export const LISTING_STATUS = {
  open: { label: "Open", tone: "green" },
  filled: { label: "Filled", tone: "amber" },
  closed: { label: "Closed", tone: "muted" },
};

export function applicationStatusLabel(status) {
  return APPLICATION_STATUS[status]?.label || status;
}
