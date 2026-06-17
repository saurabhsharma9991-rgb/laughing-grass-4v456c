import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";

export async function applyToListing(userId, listingId) {
  const applicantId = Number(userId);
  const listing = await prisma.listing.findUnique({
    where: { id: Number(listingId) },
    select: { id: true, status: true, postedById: true },
  });

  if (!listing) {
    throw new AuthError("Listing not found.", 404, "NOT_FOUND");
  }
  if (listing.status !== "open") {
    throw new AuthError("This listing is no longer accepting applications.", 400, "LISTING_CLOSED");
  }
  if (listing.postedById === applicantId) {
    throw new AuthError("You cannot apply to your own listing.", 400, "SELF_APPLY");
  }

  const existing = await prisma.application.findFirst({
    where: {
      listingId: listing.id,
      applicantId,
    },
  });
  if (existing) {
    throw new AuthError("You have already applied to this listing.", 409, "ALREADY_APPLIED");
  }

  await prisma.$transaction([
    prisma.application.create({
      data: { listingId: listing.id, applicantId },
    }),
    prisma.listing.update({
      where: { id: listing.id },
      data: { applicantsCount: { increment: 1 } },
    }),
  ]);

  return { success: true };
}

export async function countApplicationsForUser(userId) {
  return prisma.application.count({ where: { applicantId: userId } });
}

export async function getPlatformStats() {
  const [attorneyCount, listingCount, attorneys] = await Promise.all([
    prisma.attorney.count({ where: { isVerified: true } }),
    prisma.listing.count({ where: { status: "open" } }),
    prisma.attorney.findMany({
      where: { isVerified: true },
      select: { languages: true },
    }),
  ]);

  const languageSet = new Set();
  for (const a of attorneys) {
    if (!a.languages) continue;
    try {
      const langs = JSON.parse(a.languages);
      if (Array.isArray(langs)) langs.forEach((l) => languageSet.add(l));
    } catch {
      /* ignore malformed JSON */
    }
  }

  return {
    attorneys: attorneyCount,
    listings: listingCount,
    languages: languageSet.size,
  };
}
