import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import {
  parseNaturalLanguageQuery,
  filterAttorneysByRate,
  scoreAttorneyRelevance,
  sortAttorneys,
} from "@/lib/utils/attorney-search";
import { formatAttorney } from "@/lib/services/attorneys";
import { parseJsonArray } from "@/lib/utils/json-fields";

export async function searchAttorneys(params = {}) {
  const {
    q = "",
    location = "",
    specialty = "",
    language = "",
    availability = "",
    minRate = "",
    maxRate = "",
    sort = "relevance",
    verifiedOnly = true,
  } = params;

  const nl = q ? parseNaturalLanguageQuery(q) : { text: [], location: null, specialty: null, language: null, availability: null, rateHint: null };

  const locFilter = location || nl.location || "";
  const specFilter = specialty || nl.specialty || "";
  const langFilter = language || nl.language || "";
  const availFilter = availability || nl.availability || "";

  const rows = await prisma.attorney.findMany({
    where: verifiedOnly ? { isVerified: true } : undefined,
    orderBy: { name: "asc" },
  });

  let attorneys = rows.map((a) => {
    const formatted = formatAttorney(a);
    return {
      ...formatted,
      photoUrl: a.photoUrl,
      availabilitySlots: parseJsonArray(a.availabilitySlots),
    };
  });

  if (locFilter) {
    const loc = locFilter.toLowerCase();
    attorneys = attorneys.filter((a) => a.location?.toLowerCase().includes(loc));
  }

  if (specFilter) {
    const s = specFilter.toLowerCase();
    attorneys = attorneys.filter((a) =>
      a.specialties?.some((t) => t.toLowerCase().includes(s)) ||
      a.tags?.some((t) => t.toLowerCase().includes(s))
    );
  }

  if (langFilter) {
    const l = langFilter.toLowerCase();
    attorneys = attorneys.filter((a) =>
      a.languages?.some((t) => t.toLowerCase().includes(l))
    );
  }

  if (availFilter) {
    attorneys = attorneys.filter((a) =>
      a.availability?.toLowerCase().includes(availFilter.toLowerCase())
    );
  }

  const effectiveMaxRate = maxRate || (nl.rateHint != null ? String(nl.rateHint) : "");
  attorneys = filterAttorneysByRate(attorneys, { minRate, maxRate: effectiveMaxRate });

  const relevanceScores = {};
  if (q || specFilter || langFilter || locFilter) {
    for (const a of attorneys) {
      relevanceScores[a.id] = scoreAttorneyRelevance(a, {
        text: nl.text.length ? nl.text : q.toLowerCase().split(/\s+/).filter(Boolean),
        specialty: specFilter,
        language: langFilter,
        location: locFilter,
      });
    }
    if (sort === "relevance") {
      attorneys = attorneys.filter((a) => relevanceScores[a.id] > 0 || !q);
    }
  }

  attorneys = sortAttorneys(attorneys, sort, relevanceScores);
  return attorneys;
}
