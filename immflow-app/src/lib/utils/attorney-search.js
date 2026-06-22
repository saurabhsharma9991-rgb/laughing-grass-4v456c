/** Parse natural-language attorney search into structured filters. */
const LANGUAGE_KEYWORDS = [
  "spanish",
  "mandarin",
  "chinese",
  "korean",
  "hindi",
  "gujarati",
  "portuguese",
  "french",
  "arabic",
  "vietnamese",
  "tagalog",
  "russian",
];

const SPECIALTY_KEYWORDS = [
  "removal defense",
  "asylum",
  "family petition",
  "h-1b",
  "h1b",
  "daca",
  "naturalization",
  "eb-1",
  "eb-2",
  "l-1",
  "tps",
  "eoir",
  "hearing coverage",
  "co-counsel",
  "employment visas",
];

const AVAILABILITY_KEYWORDS = {
  now: "Available now",
  immediate: "Available now",
  "3 days": "Avail. in 3 days",
  "5 days": "Avail. in 5 days",
  "2 week": "2 wk wait",
  "two week": "2 wk wait",
};

export function parseNaturalLanguageQuery(raw = "") {
  let q = raw.trim().toLowerCase();
  const filters = {
    location: null,
    language: null,
    specialty: null,
    availability: null,
    rateHint: null,
    text: [],
  };

  const inMatch = q.match(/\b(?:in|near|around)\s+([a-z][a-z\s,]+?)(?:\s+(?:who|with|speaking|for)\b|$)/i);
  if (inMatch) {
    filters.location = inMatch[1].trim().replace(/,$/, "");
    q = q.replace(inMatch[0], " ").trim();
  }

  for (const lang of LANGUAGE_KEYWORDS) {
    if (q.includes(lang) || q.includes(`${lang} speaking`)) {
      filters.language = lang.charAt(0).toUpperCase() + lang.slice(1);
      q = q.replace(new RegExp(`\\b${lang}\\b`, "gi"), " ").replace(/speaking/gi, " ").trim();
      break;
    }
  }

  for (const spec of SPECIALTY_KEYWORDS) {
    if (q.includes(spec)) {
      filters.specialty = spec
        .split(" ")
        .map((w) => (w === "h1b" ? "H-1B" : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(" ")
        .replace("H-1b", "H-1B")
        .replace("Eb-1", "EB-1")
        .replace("Eb-2", "EB-2")
        .replace("L-1", "L-1");
      q = q.replace(spec, " ").trim();
      break;
    }
  }

  for (const [key, avail] of Object.entries(AVAILABILITY_KEYWORDS)) {
    if (q.includes(key) || q.includes("available")) {
      if (q.includes("available")) filters.availability = avail;
      q = q.replace(new RegExp(key, "gi"), " ").replace(/available/gi, " ").trim();
      break;
    }
  }

  const rateMatch = q.match(/(?:under|below|less than)\s*\$?(\d+)/);
  if (rateMatch) {
    filters.rateHint = parseInt(rateMatch[1], 10);
    q = q.replace(rateMatch[0], " ").trim();
  }

  filters.text = q.split(/\s+/).filter(Boolean);
  return filters;
}

const AVAILABILITY_ORDER = {
  "Available now": 0,
  "Avail. in 3 days": 1,
  "Avail. in 5 days": 2,
  "2 wk wait": 3,
};

export function parseRateNumber(rateStr) {
  if (!rateStr) return null;
  const m = String(rateStr).match(/\$?(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

/** Filter attorneys by parsed hourly/flat rate (unparseable rates pass when only max is set). */
export function filterAttorneysByRate(attorneys, { minRate, maxRate } = {}) {
  const min =
    minRate != null && String(minRate).trim() !== "" ? parseInt(minRate, 10) : null;
  const max =
    maxRate != null && String(maxRate).trim() !== "" ? parseInt(maxRate, 10) : null;
  if ((min == null || Number.isNaN(min)) && (max == null || Number.isNaN(max))) {
    return attorneys;
  }

  return attorneys.filter((a) => {
    const n = parseRateNumber(a.rate);
    if (n == null) return max != null && !Number.isNaN(max);
    if (min != null && !Number.isNaN(min) && n < min) return false;
    if (max != null && !Number.isNaN(max) && n > max) return false;
    return true;
  });
}

export function scoreAttorneyRelevance(attorney, { text = [], specialty, language, location } = {}) {
  let score = 0;
  const haystack = [
    attorney.name,
    attorney.bio,
    attorney.location,
    ...(attorney.specialties || []),
    ...(attorney.languages || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const word of text) {
    if (word.length < 2) continue;
    if (haystack.includes(word)) score += 3;
  }
  if (specialty && haystack.includes(specialty.toLowerCase())) score += 5;
  if (language && haystack.includes(language.toLowerCase())) score += 4;
  if (location && attorney.location?.toLowerCase().includes(location.toLowerCase())) score += 4;

  return score;
}

export function sortAttorneys(attorneys, sort = "relevance", relevanceScores = null) {
  const list = [...attorneys];
  if (sort === "rating") {
    return list.sort((a, b) => Number(b.stars) - Number(a.stars) || b.reviews - a.reviews);
  }
  if (sort === "availability") {
    return list.sort(
      (a, b) =>
        (AVAILABILITY_ORDER[a.availability] ?? 9) - (AVAILABILITY_ORDER[b.availability] ?? 9)
    );
  }
  if (sort === "relevance" && relevanceScores) {
    return list.sort((a, b) => (relevanceScores[b.id] ?? 0) - (relevanceScores[a.id] ?? 0));
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export { AVAILABILITY_ORDER };
