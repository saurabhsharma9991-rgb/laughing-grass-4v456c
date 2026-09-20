/**
 * Rule-based AI Service Finder (Phase B).
 * Maps natural language to a service category + filters.
 * Phase F can swap in LLM; this keeps discovery working without an API key.
 */

const CATEGORY_HINTS = [
  {
    slug: "translation",
    keywords: [
      "translat",
      "birth certificate",
      "certified translation",
      "document translation",
      "hindi to",
      "spanish to",
      "english to",
      "uscis translation",
    ],
  },
  {
    slug: "interpreter",
    keywords: [
      "interpret",
      "interpreter",
      "court interpret",
      "immigration interview",
      "phone interpret",
      "video interpret",
      "consecutive",
      "simultaneous",
    ],
  },
  {
    slug: "psychological",
    keywords: [
      "psycholog",
      "hardship evaluation",
      "asylum evaluation",
      "trauma evaluation",
      "mental health",
      "vawa",
      "u-visa",
      "u visa",
      "cancellation of removal",
      "clinical",
      "therapist",
      "counselor",
      "lcsw",
    ],
  },
  {
    slug: "attorney",
    keywords: [
      "attorney",
      "lawyer",
      "hearing coverage",
      "immigration lawyer",
      "co-counsel",
      "referral",
      "deportation",
      "removal defense",
      "h-1b",
      "green card",
      "asylum attorney",
    ],
  },
];

const LANGUAGE_HINTS = [
  "hindi",
  "spanish",
  "english",
  "russian",
  "chinese",
  "mandarin",
  "arabic",
  "portuguese",
  "french",
  "korean",
  "vietnamese",
  "urdu",
  "bengali",
  "nepali",
  "gujarati",
];

const DOC_HINTS = [
  "birth certificate",
  "marriage certificate",
  "diploma",
  "passport",
  "affidavit",
  "medical record",
  "court document",
];

function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * @returns {{ categorySlug: string, filters: object, confidence: number, summary: string }}
 */
export function parseServiceIntent(rawQuery) {
  const query = String(rawQuery || "").trim();
  const lower = query.toLowerCase();

  if (!lower) {
    return {
      categorySlug: null,
      filters: {},
      confidence: 0,
      summary: "Tell us what you need.",
    };
  }

  let best = { slug: "attorney", score: 0 };
  for (const cat of CATEGORY_HINTS) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (lower.includes(kw)) score += kw.length > 8 ? 3 : 2;
    }
    if (score > best.score) best = { slug: cat.slug, score };
  }

  const languages = LANGUAGE_HINTS.filter((l) => lower.includes(l)).map(titleCase);
  const documentType = DOC_HINTS.find((d) => lower.includes(d)) || null;

  let sourceLanguage = null;
  let targetLanguage = null;
  const langSet = new Set(LANGUAGE_HINTS);
  const pairRe = /\b([a-z]+)\s*(?:to|→|->|into)\s*([a-z]+)\b/g;
  let pairMatch;
  while ((pairMatch = pairRe.exec(lower)) !== null) {
    const a = pairMatch[1];
    const b = pairMatch[2];
    if (langSet.has(a) && langSet.has(b)) {
      sourceLanguage = titleCase(a === "mandarin" ? "chinese" : a);
      targetLanguage = titleCase(b === "mandarin" ? "chinese" : b);
      break;
    }
  }
  // Fallback: "from Hindi to English"
  if (!sourceLanguage) {
    const fromTo = lower.match(/\bfrom\s+([a-z]+)\s+to\s+([a-z]+)\b/);
    if (fromTo && langSet.has(fromTo[1]) && langSet.has(fromTo[2])) {
      sourceLanguage = titleCase(fromTo[1]);
      targetLanguage = titleCase(fromTo[2]);
    }
  }

  const certified = /certif/.test(lower);
  const rush = /\brush\b|\burgent\b|\bexpedit/.test(lower);
  const remote = /\bremote\b|\bvideo\b|\bphone\b|\btelehealth\b/.test(lower);
  const inPerson = /\bin[- ]?person\b|\bin court\b/.test(lower);

  const filters = {
    q: query,
    language: languages[0] || null,
    sourceLanguage,
    targetLanguage,
    documentType,
    certified: certified || null,
    rush: rush || null,
    remote: remote || null,
    inPerson: inPerson || null,
  };

  const confidence = Math.min(0.95, 0.35 + best.score * 0.12);
  const parts = [`Looking for ${best.slug.replace(/_/g, " ")}`];
  if (sourceLanguage && targetLanguage) {
    parts.push(`${sourceLanguage} → ${targetLanguage}`);
  } else if (languages.length) {
    parts.push(languages.join(", "));
  }
  if (documentType) parts.push(documentType);
  if (certified) parts.push("certified");

  return {
    categorySlug: best.slug,
    filters,
    confidence,
    summary: parts.join(" · "),
  };
}
