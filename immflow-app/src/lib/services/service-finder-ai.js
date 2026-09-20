import { parseServiceIntent } from "@/lib/utils/service-finder";
import { listProviders } from "@/lib/services/providers";
import { listCategories } from "@/lib/services/categories";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const DEFAULT_CATEGORIES = [
  { slug: "attorney", name: "Immigration Attorneys", description: "" },
  { slug: "translation", name: "Certified Translation", description: "" },
  { slug: "interpreter", name: "Interpreters", description: "" },
  { slug: "psychological", name: "Psychological Services", description: "" },
];

function ruleIntentForCategories(query, categories) {
  const fallback = parseServiceIntent(query);
  const lower = query.toLowerCase();
  const dynamic = categories
    .map((category) => {
      const words = `${category.name} ${category.slug} ${category.description || ""}`
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 4);
      return {
        slug: category.slug,
        score: words.reduce(
          (total, word) => total + (lower.includes(word) ? 1 : 0),
          0
        ),
      };
    })
    .sort((a, b) => b.score - a.score)[0];
  if (
    dynamic?.score > 0 &&
    (fallback.confidence <= 0.35 ||
      !categories.some((category) => category.slug === fallback.categorySlug))
  ) {
    return {
      ...fallback,
      categorySlug: dynamic.slug,
      summary: `Looking for ${dynamic.slug.replace(/_/g, " ")}`,
    };
  }
  return fallback;
}

function normalizeIntent(raw, query, categories) {
  const fallback = ruleIntentForCategories(query, categories);
  if (!raw || typeof raw !== "object") return fallback;

  const validSlugs = new Set(categories.map((category) => category.slug));
  const categorySlug = validSlugs.has(raw.categorySlug)
    ? raw.categorySlug
    : fallback.categorySlug;

  const filters = {
    ...fallback.filters,
    ...(raw.filters && typeof raw.filters === "object" ? raw.filters : {}),
    q: query,
  };

  // Clean nullish
  for (const [k, v] of Object.entries(filters)) {
    if (v === "" || v === undefined) filters[k] = null;
  }

  return {
    categorySlug,
    filters,
    confidence: Math.min(
      0.99,
      Math.max(Number(raw.confidence) || fallback.confidence, fallback.confidence)
    ),
    summary:
      typeof raw.summary === "string" && raw.summary.trim()
        ? raw.summary.trim()
        : fallback.summary,
  };
}

async function parseIntentWithOpenAi(query, categories) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  if (!apiKey) return null;

  const categoryList = categories.map(({ slug, name, description }) => ({
    slug,
    name,
    description,
  }));
  const systemPrompt = `You are ImmFlow's marketplace service finder — NOT a lawyer, translator, clinician, or advisor.
Your ONLY job: map a user's natural-language need to a service category and search filters so they can FIND verified providers.
Never give legal advice, eligibility opinions, clinical assessments, or translation certification claims.
Active service categories: ${JSON.stringify(categoryList)}

Return ONLY valid JSON:
{
  "categorySlug": one active category slug,
  "filters": {
    "language": string|null,
    "sourceLanguage": string|null,
    "targetLanguage": string|null,
    "documentType": string|null,
    "certified": boolean|null,
    "rush": boolean|null,
    "remote": boolean|null,
    "inPerson": boolean|null,
    "location": string|null,
    "purpose": string|null,
    "availability": string|null,
    "maxPrice": number|null,
    "minRating": number|null,
    "turnaround": string|null,
    "professionalType": string|null,
    "licenseState": string|null,
    "serviceType": string|null
  },
  "confidence": number,
  "summary": string
}

Rules:
- "I need to translate my birth certificate from Hindi to English" → translation, source Hindi, target English, document birth certificate, certified true if "certified" mentioned.
- "Spanish interpreter for immigration interview" → interpreter, language Spanish, purpose immigration interview.
- "immigration psychological evaluation" → psychological.
- Prefer translation over interpreter when the user says translate/document; prefer interpreter for live/oral/interview/court interpreting.
- summary: one short non-advice sentence describing the marketplace search.`;

  const response = await fetch(OPENAI_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error ${response.status}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  return JSON.parse(content || "{}");
}

/** Parse NL query → category + filters (OpenAI when configured, else rules). */
export async function resolveServiceIntent(query) {
  const trimmed = String(query || "").trim();
  let categories = DEFAULT_CATEGORIES;
  try {
    const active = await listCategories({ activeOnly: true });
    if (active.length) categories = active;
  } catch {
    // Rule fallback remains available if the database is temporarily unavailable.
  }
  const rules = ruleIntentForCategories(trimmed, categories);

  if (!trimmed) {
    return { ...rules, source: "rules" };
  }

  try {
    const ai = await parseIntentWithOpenAi(trimmed, categories);
    if (!ai) return { ...rules, source: "rules" };
    return { ...normalizeIntent(ai, trimmed, categories), source: "openai" };
  } catch {
    return { ...rules, source: "rules" };
  }
}

function scoreProvider(provider, intent) {
  let score = 70;
  const f = intent.filters || {};
  const pd = provider.profileData || {};
  const langs = (provider.languages || []).map((l) => String(l).toLowerCase());
  const pairs = provider.languagePairs || [];

  if (provider.verificationStatus === "verified") score += 8;
  if (provider.stars >= 4.5) score += 4;

  if (f.sourceLanguage && f.targetLanguage) {
    const src = f.sourceLanguage.toLowerCase();
    const tgt = f.targetLanguage.toLowerCase();
    const pairHit = pairs.some(
      (lp) =>
        lp.source.toLowerCase() === src && lp.target.toLowerCase() === tgt
    );
    if (pairHit) score += 12;
    else if (
      pairs.some(
        (lp) =>
          lp.source.toLowerCase().includes(src) ||
          lp.target.toLowerCase().includes(tgt)
      )
    ) {
      score += 5;
    }
  } else if (f.language) {
    const lang = f.language.toLowerCase();
    if (
      langs.some((l) => l.includes(lang)) ||
      pairs.some(
        (lp) =>
          lp.source.toLowerCase().includes(lang) ||
          lp.target.toLowerCase().includes(lang)
      )
    ) {
      score += 8;
    }
  }

  if (f.certified && (pd.offersCertified === true || pd.translatorType?.includes("Certified"))) {
    score += 6;
  }
  if (f.remote && provider.remoteAvailable) score += 3;
  if (f.inPerson && provider.inPersonAvailable) score += 3;
  if (f.location && provider.location) {
    if (provider.location.toLowerCase().includes(String(f.location).toLowerCase())) {
      score += 5;
    }
  }
  if (f.availability && provider.availability) {
    if (
      provider.availability
        .toLowerCase()
        .includes(String(f.availability).toLowerCase())
    ) {
      score += 4;
    }
  }
  if (provider.experienceYears) score += Math.min(5, provider.experienceYears / 5);
  if (
    provider.credentials?.some((credential) => credential.status === "verified")
  ) {
    score += 5;
  }
  const numericRate = Number(String(provider.rate || "").replace(/[^0-9.]/g, ""));
  if (f.maxPrice && numericRate && numericRate <= Number(f.maxPrice)) score += 5;
  if (f.minRating && provider.stars >= Number(f.minRating)) score += 4;
  if (f.turnaround) {
    const turnaround = String(
      pd.turnaround || pd.turnaroundDays || ""
    ).toLowerCase();
    if (turnaround.includes(String(f.turnaround).toLowerCase())) score += 5;
  }

  return Math.min(99, score);
}

/** Rank verified providers for an intent across the detected category. */
export async function matchProvidersForIntent(intent, { limit = 6 } = {}) {
  if (!intent?.categorySlug) {
    return [];
  }

  // For attorneys we still use Provider records in the attorney category
  let providers = await listProviders({
    categorySlug: intent.categorySlug,
    verifiedOnly: true,
  });

  const f = intent.filters || {};

  // A requested exact pair is a hard requirement; do not show unrelated providers.
  if (f.sourceLanguage || f.targetLanguage || f.language) {
    const filtered = providers.filter((p) => {
      const pairs = p.languagePairs || [];
      const langs = (p.languages || []).map((l) => String(l).toLowerCase());
      if (f.sourceLanguage && f.targetLanguage) {
        const src = f.sourceLanguage.toLowerCase();
        const tgt = f.targetLanguage.toLowerCase();
        return pairs.some(
          (lp) =>
            lp.source.toLowerCase() === src && lp.target.toLowerCase() === tgt
        );
      }
      const lang = (f.language || f.sourceLanguage || f.targetLanguage || "").toLowerCase();
      return (
        langs.some((l) => l.includes(lang)) ||
        pairs.some(
          (lp) =>
            lp.source.toLowerCase().includes(lang) ||
            lp.target.toLowerCase().includes(lang)
        )
      );
    });
    if (f.sourceLanguage && f.targetLanguage) providers = filtered;
    else if (filtered.length > 0) providers = filtered;
  }

  if (f.certified) {
    const certified = providers.filter(
      (p) =>
        p.profileData?.offersCertified === true ||
        String(p.profileData?.translatorType || "").includes("Certified")
    );
    providers = certified;
  }

  const ranked = providers
    .map((p) => {
      const score = scoreProvider(p, intent);
      return {
        ...p,
        email: undefined,
        matchScore: score,
        matchReason:
          intent.summary ||
          `Matches your ${intent.categorySlug.replace(/_/g, " ")} search.`,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || b.stars - a.stars)
    .slice(0, limit);

  return ranked;
}

export async function findServices(query) {
  const intent = await resolveServiceIntent(query);
  const matches = await matchProvidersForIntent(intent);
  return {
    ...intent,
    matches,
  };
}
