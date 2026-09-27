import { rankAttorneysForMatch } from "@/lib/utils/matcher";
import { requestOpenAiJson } from "@/lib/ai/openai";

const MATCH_TTL_SECONDS = Number(process.env.OPENAI_MATCH_TTL_SECONDS) || 21_600;

function summarizeAttorney(a) {
  const tags = Array.isArray(a.tags) ? a.tags : [];
  return {
    userId: a.userId,
    name: a.name,
    location: a.location || "",
    rate: a.rate || "",
    availability: a.avail || a.availability || "",
    tags: tags.slice(0, 8),
    bio: (a.bio || "").slice(0, 200),
    experience: a.exp || "",
  };
}

function mergeAiRankings(attorneys, aiRows) {
  const byUserId = new Map(attorneys.map((a) => [a.userId, a]));
  const ruleFallback = rankAttorneysForMatch(attorneys, {});

  const merged = aiRows
    .map((row, index) => {
      const base = byUserId.get(row.userId);
      if (!base) return null;

      const ruleMatch = ruleFallback.find((m) => m.userId === row.userId);
      const score = Math.min(99, Math.max(70, Number(row.score) || ruleMatch?.score || 85));

      return {
        ...(ruleMatch || {}),
        userId: base.userId,
        initials: base.initials,
        bg: base.bg,
        fg: base.fg,
        name: base.name,
        meta: ruleMatch?.meta || `${base.location || "USA"} · ${base.exp || "—"}`,
        score,
        scoreColor: score >= 90 ? "var(--color-green)" : score >= 80 ? "var(--color-green)" : "var(--color-amber)",
        reason: row.reason || ruleMatch?.reason || "Strong match for your case needs.",
        tags: ruleMatch?.tags || (Array.isArray(base.tags) ? base.tags.slice(0, 4) : []),
        avail: base.avail || "Available",
        rate: base.rate || "DOE",
        reviews: base.reviews || `${base.stars} (0)`,
        best: index === 0,
      };
    })
    .filter(Boolean);

  if (merged.length >= 1) return merged.slice(0, 3);
  return ruleFallback;
}

async function rankWithOpenAi(attorneys, criteria) {
  const rules = rankAttorneysForMatch(attorneys, criteria);
  if (attorneys.length === 0) {
    return { matches: rules, source: "rules" };
  }

  const condensed = attorneys.slice(0, 40).map(summarizeAttorney);
  try {
    const parsed = await requestOpenAiJson({
      feature: "attorney_matcher",
      ttlSeconds: MATCH_TTL_SECONDS,
      cacheParts: condensed.map((row) => row.userId),
      maxCompletionTokens: 400,
      system:
        "You are an immigration attorney matching assistant for a marketplace. Return ONLY valid JSON: {\"matches\":[{\"userId\":number,\"score\":number,\"reason\":string}]} with up to 3 best attorneys. Scores 70-99. Reasons are one sentence. Never give legal advice or eligibility opinions.",
      user: JSON.stringify({ need: criteria, attorneys: condensed }),
    });

    const rows = Array.isArray(parsed?.matches) ? parsed.matches : [];
    if (!parsed || rows.length === 0) {
      return { matches: rules, source: "rules" };
    }

    return {
      matches: mergeAiRankings(attorneys, rows),
      source: "openai",
    };
  } catch {
    return { matches: rules, source: "rules" };
  }
}

export async function matchAttorneys(attorneys, criteria) {
  const { query = "", needType = "", caseType = "" } = criteria || {};
  return rankWithOpenAi(attorneys, { query, needType, caseType });
}
