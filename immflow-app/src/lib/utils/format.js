export function formatRelativeTime(date) {
  const timeDiff = Date.now() - new Date(date).getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  if (hoursDiff >= 24) {
    const days = Math.floor(hoursDiff / 24);
    return days === 1 ? "1 day ago" : `${days} days ago`;
  }
  if (hoursDiff >= 1) {
    const hours = Math.floor(hoursDiff);
    return hours === 1 ? "1 hr ago" : `${hours} hrs ago`;
  }
  const mins = Math.floor(timeDiff / (1000 * 60));
  return mins <= 5 ? "Just now" : `${mins} mins ago`;
}

const BADGE_COLORS = {
  Urgent:   { bg: "#FCEBEB", fg: "#A32D2D" },
  Open:     { bg: "#E6F1FB", fg: "#185FA5" },
  Featured: { bg: "#FAEEDA", fg: "#BA7517" },
  New:      { bg: "#E4ECF4", fg: "#141E30" },
};

export function getBadgeStyle(badge) {
  return BADGE_COLORS[badge] || BADGE_COLORS.New;
}

/** Navy Mirage palette — 4 distinct tints for attorney avatars. */
const ATTORNEY_COLORS = [
  { bg: "#E4ECF4", fg: "#141E30", dot: "#35577D" }, // mirage
  { bg: "#DDE8F2", fg: "#141E30", dot: "#4A6A8C" }, // steel
  { bg: "#E8EFF6", fg: "#1A2A42", dot: "#35577D" }, // navy mist
  { bg: "#D4E0EC", fg: "#141E30", dot: "#6B8BAE" }, // horizon
];

export function getAttorneyColorSet(id) {
  return ATTORNEY_COLORS[id % ATTORNEY_COLORS.length];
}
