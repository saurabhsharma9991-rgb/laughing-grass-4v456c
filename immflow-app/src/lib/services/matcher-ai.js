import { rankAttorneysForMatch } from "@/lib/utils/matcher";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

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
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  if (!apiKey || attorneys.length === 0) {
    return {
      matches: rankAttorneysForMatch(attorneys, criteria),
      source: "rules",
    };
  }

  const condensed = attorneys.slice(0, 40).map(summarizeAttorney);
  const systemPrompt =
    "You are an immigration attorney matching assistant. Return ONLY valid JSON: {\"matches\":[{\"userId\":number,\"score\":number,\"reason\":string}]} with up to 3 best attorneys. Scores 70-99. Reasons are one sentence, professional.";

  const userPrompt = JSON.stringify({
    need: criteria,
    attorneys: condensed,
  });

  try {
    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error ${response.status}`);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content || "{}");
    const rows = Array.isArray(parsed.matches) ? parsed.matches : [];

    if (rows.length === 0) {
      return {
        matches: rankAttorneysForMatch(attorneys, criteria),
        source: "rules",
      };
    }

    return {
      matches: mergeAiRankings(attorneys, rows),
      source: "openai",
    };
  } catch {
    return {
      matches: rankAttorneysForMatch(attorneys, criteria),
      source: "rules",
    };
  }
}

export async function matchAttorneys(attorneys, criteria) {
  const { query = "", needType = "", caseType = "" } = criteria || {};
  const result = await rankWithOpenAi(attorneys, { query, needType, caseType });

  if (result.source === "rules") {
    return {
      matches: rankAttorneysForMatch(attorneys, { query, needType, caseType }),
      source: "rules",
    };
  }

  return result;
}
