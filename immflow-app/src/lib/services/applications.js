import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import { formatListing } from "@/lib/services/listings";
import { formatRelativeTime } from "@/lib/utils/format";
import { notifyListingOwnerOfApplication, notifyApplicantOfStatus } from "@/lib/email/notify";

export async function applyToListing(userId, listingId, message = null) {
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
    where: { listingId: listing.id, applicantId },
  });
  if (existing) {
    throw new AuthError("You have already applied to this listing.", 409, "ALREADY_APPLIED");
  }

  await prisma.$transaction([
    prisma.application.create({
      data: {
        listingId: listing.id,
        applicantId,
        message: message?.trim() || null,
      },
    }),
    prisma.listing.update({
      where: { id: listing.id },
      data: { applicantsCount: { increment: 1 } },
    }),
  ]);

  void notifyListingOwnerOfApplication(listing.id, applicantId, message);

  return { success: true };
}

export async function listApplicationsForUser(userId) {
  const apps = await prisma.application.findMany({
    where: { applicantId: userId },
    include: { listing: true },
    orderBy: { appliedAt: "desc" },
  });

  return apps.map((app) => ({
    id: app.id,
    status: app.status,
    message: app.message,
    appliedAt: app.appliedAt,
    appliedLabel: formatRelativeTime(app.appliedAt),
    listing: formatListing(app.listing),
  }));
}

export async function countApplicationsForUser(userId) {
  return prisma.application.count({ where: { applicantId: userId } });
}

export async function getApplicationStatusMapForUser(userId, listingIds = []) {
  if (!userId || !listingIds.length) return {};
  const apps = await prisma.application.findMany({
    where: { applicantId: userId, listingId: { in: listingIds } },
    select: { id: true, listingId: true, status: true },
  });
  return Object.fromEntries(
    apps.map((a) => [a.listingId, { id: a.id, status: a.status }])
  );
}

export async function listApplicationsForListing(listingId, ownerUserId) {
  const listing = await prisma.listing.findUnique({
    where: { id: Number(listingId) },
    select: { postedById: true, title: true },
  });
  if (!listing) throw new AuthError("Listing not found.", 404, "NOT_FOUND");
  if (listing.postedById !== ownerUserId) {
    throw new AuthError("You can only view applications for your own listings.", 403, "FORBIDDEN");
  }

  const applications = await prisma.application.findMany({
    where: { listingId: Number(listingId) },
    include: {
      applicant: {
        include: {
          attorney: true,
        },
      },
    },
    orderBy: { appliedAt: "desc" },
  });

  return applications.map((app) => ({
    id: app.id,
    status: app.status,
    message: app.message,
    appliedAt: app.appliedAt,
    appliedLabel: formatRelativeTime(app.appliedAt),
    applicant: app.applicant.attorney
      ? {
          userId: app.applicantId,
          name: app.applicant.attorney.name,
          location: app.applicant.attorney.location,
          rate: app.applicant.attorney.rate,
          specialties: app.applicant.attorney.specialties,
          stars: Number(app.applicant.attorney.stars).toFixed(1),
          isVerified: app.applicant.attorney.isVerified,
          attorneyId: app.applicant.attorney.id,
        }
      : { userId: app.applicantId, name: "Attorney", attorneyId: null },
  }));
}

export async function updateApplicationStatus(applicationId, ownerUserId, status) {
  const allowed = ["reviewed", "accepted", "rejected"];
  if (!allowed.includes(status)) {
    throw new AuthError("Invalid status.", 400, "VALIDATION_ERROR");
  }

  const app = await prisma.application.findUnique({
    where: { id: Number(applicationId) },
    include: { listing: { select: { postedById: true, id: true } } },
  });
  if (!app) throw new AuthError("Application not found.", 404, "NOT_FOUND");
  if (app.listing.postedById !== ownerUserId) {
    throw new AuthError("You can only manage applications for your own listings.", 403, "FORBIDDEN");
  }

  await prisma.application.update({
    where: { id: app.id },
    data: { status },
  });

  if (status === "accepted") {
    await prisma.listing.update({
      where: { id: app.listing.id },
      data: { status: "filled" },
    });
  }

  void notifyApplicantOfStatus(app.id, status);

  return { success: true, status };
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