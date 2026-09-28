import { parseServiceIntent } from "@/lib/utils/service-finder";
import { listProviders, listedRateAmount } from "@/lib/services/providers";
import { listCategories } from "@/lib/services/categories";
import { normalizeAiText, requestOpenAiJson } from "@/lib/ai/openai";

const INTENT_TTL_SECONDS = Number(process.env.OPENAI_INTENT_TTL_SECONDS) || 86_400;
const MATCH_TTL_SECONDS = Number(process.env.OPENAI_MATCH_TTL_SECONDS) || 21_600;

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

function shouldSkipIntentLlm(rules) {
  const f = rules.filters || {};
  if ((rules.confidence || 0) < 0.8 || !rules.categorySlug) return false;
  if (rules.categorySlug === "translation") {
    return Boolean(f.sourceLanguage && f.targetLanguage);
  }
  if (rules.categorySlug === "interpreter") {
    return Boolean(f.language);
  }
  return rules.categorySlug === "psychological" || rules.categorySlug === "attorney";
}

async function parseIntentWithOpenAi(query, categories) {
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

  return requestOpenAiJson({
    feature: "service_intent",
    ttlSeconds: INTENT_TTL_SECONDS,
    cacheParts: categoryList.map((c) => c.slug),
    maxCompletionTokens: 350,
    system: systemPrompt,
    user: normalizeAiText(query),
  });
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

  if (shouldSkipIntentLlm(rules)) {
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
  const numericRate = listedRateAmount(provider);
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
    .slice(0, Math.max(limit, 8));

  const reranked = await rerankProvidersWithOpenAi(ranked, intent);
  return reranked.slice(0, limit);
}

async function rerankProvidersWithOpenAi(ranked, intent) {
  if (ranked.length < 2) return ranked;

  try {
    const candidates = ranked.slice(0, 8).map((p) => ({
      id: p.id,
      name: p.displayName,
      location: p.location,
      languages: p.languages,
      languagePairs: p.languagePairs,
      rate: p.rate,
      stars: p.stars,
      verificationStatus: p.verificationStatus,
      remoteAvailable: p.remoteAvailable,
      inPersonAvailable: p.inPersonAvailable,
      experienceYears: p.experienceYears,
    }));
    const parsed = await requestOpenAiJson({
      feature: "provider_rerank",
      ttlSeconds: MATCH_TTL_SECONDS,
      cacheParts: [
        intent.categorySlug,
        JSON.stringify(intent.filters || {}),
        candidates.map((c) => c.id).join(","),
      ],
      maxCompletionTokens: 400,
      system:
        "You rank verified immigration-service providers for a marketplace search. Return ONLY JSON {\"matches\":[{\"id\":number,\"score\":number,\"reason\":string}]}. Scores 70-99. Never give legal, clinical, or certification advice.",
      user: JSON.stringify({
        category: intent.categorySlug,
        summary: intent.summary,
        filters: intent.filters,
        providers: candidates,
      }),
    });
    const rows = Array.isArray(parsed?.matches) ? parsed.matches : [];
    if (!parsed || rows.length === 0) return ranked;

    const byId = new Map(ranked.map((p) => [p.id, p]));
    const reranked = rows
      .map((row) => {
        const base = byId.get(Number(row.id));
        if (!base) return null;
        return {
          ...base,
          matchScore: Math.min(99, Math.max(70, Number(row.score) || base.matchScore)),
          matchReason: row.reason || base.matchReason,
        };
      })
      .filter(Boolean);
    const seen = new Set(reranked.map((p) => p.id));
    return [...reranked, ...ranked.filter((p) => !seen.has(p.id))].slice(
      0,
      ranked.length
    );
  } catch {
    return ranked;
  }
}

export async function findServices(query) {
  const intent = await resolveServiceIntent(query);
  const matches = await matchProvidersForIntent(intent);
  return {
    ...intent,
    matches,
  };
}
