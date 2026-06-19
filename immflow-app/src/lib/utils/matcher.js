import { getAttorneyColorSet } from "@/lib/utils/format";

/**
 * Client-side ranking over real attorney records (Phase 1 — no external AI API).
 */
export function rankAttorneysForMatch(attorneys, { query = "", needType = "", caseType = "" }) {
  const terms = `${query} ${needType} ${caseType}`
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2);

  return [...attorneys]
    .map((a) => {
      const tags = Array.isArray(a.tags) ? a.tags : [];
      const haystack = [a.name, a.location, a.bio, ...tags].filter(Boolean).join(" ").toLowerCase();

      let score = 68 + Math.min(Number(a.stars || 5) * 3, 15);

      if (caseType && haystack.includes(caseType.toLowerCase())) score += 10;
      if (needType) {
        const needWord = needType.split(" ")[0].toLowerCase();
        if (haystack.includes(needWord)) score += 6;
      }
      for (const term of terms) {
        if (haystack.includes(term)) score += 4;
      }

      score = Math.min(99, Math.round(score));
      const colorSet = a.bg && a.fg ? { bg: a.bg, fg: a.fg } : getAttorneyColorSet(a.id);

      const specialtyTag = tags.find((t) =>
        ["Removal defense", "Asylum", "H-1B", "Family petition", "DACA", "Naturalization"].includes(t)
      );
      const languageTag = tags.find((t) =>
        ["Spanish", "Mandarin", "Hindi", "French", "Portuguese"].some((l) => t.includes(l))
      );

      const reasonParts = [];
      if (languageTag) reasonParts.push(`${languageTag} speaker`);
      if (specialtyTag) reasonParts.push(`strong ${specialtyTag.toLowerCase()} experience`);
      if (a.location) reasonParts.push(`based in ${a.location.split(",")[0]}`);
      const reason =
        reasonParts.length > 0
          ? `${reasonParts.join(", ")}. ${a.avail || "Available"}.`
          : `Experienced immigration attorney in ${a.location || "the US"}. ${a.avail || "Available"}.`;

      return {
        userId: a.userId,
        initials: a.initials,
        bg: colorSet.bg,
        fg: colorSet.fg,
        name: a.name,
        meta: `${a.location || "USA"} · ${a.exp || "—"} · ${tags.slice(0, 2).join(" · ") || "Immigration"}`,
        score,
        scoreColor: score >= 90 ? "var(--color-green)" : score >= 80 ? "var(--color-green)" : "var(--color-amber)",
        reason,
        tags: tags.slice(0, 4),
        avail: a.avail || "Available",
        rate: a.rate || "DOE",
        reviews: `${a.stars} (${a.reviews || 0})`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((m, i) => ({ ...m, best: i === 0 }));
}
