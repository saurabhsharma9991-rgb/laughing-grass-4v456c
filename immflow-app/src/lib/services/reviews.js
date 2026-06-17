import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import { parseJsonArray } from "@/lib/utils/json-fields";
import { formatAttorney } from "@/lib/services/attorneys";

export async function createReview(reviewerId, attorneyId, { rating, comment }) {
  const attorney = await prisma.attorney.findUnique({ where: { id: attorneyId } });
  if (!attorney) throw new AuthError("Attorney not found.", 404, "NOT_FOUND");
  if (attorney.userId === reviewerId) {
    throw new AuthError("You cannot review your own profile.", 400, "SELF_REVIEW");
  }

  const r = Math.min(5, Math.max(1, parseInt(rating, 10)));
  if (Number.isNaN(r)) throw new AuthError("Rating must be 1–5.", 400, "VALIDATION_ERROR");

  await prisma.review.upsert({
    where: {
      attorneyId_reviewerId: { attorneyId, reviewerId },
    },
    create: {
      attorneyId,
      reviewerId,
      rating: r,
      comment: comment?.trim() || null,
    },
    update: {
      rating: r,
      comment: comment?.trim() || null,
    },
  });

  await recalculateAttorneyRating(attorneyId);
  return listReviewsForAttorney(attorneyId);
}

async function recalculateAttorneyRating(attorneyId) {
  const agg = await prisma.review.aggregate({
    where: { attorneyId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.attorney.update({
    where: { id: attorneyId },
    data: {
      stars: agg._avg.rating ?? 5,
      reviewsCount: agg._count.rating,
    },
  });
}

export async function listReviewsForAttorney(attorneyId) {
  const reviews = await prisma.review.findMany({
    where: { attorneyId },
    include: {
      reviewer: {
        include: {
          attorney: { select: { name: true, initials: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    reviewerName: r.reviewer.attorney?.name || r.reviewer.displayName || "Attorney",
    reviewerInitials: r.reviewer.attorney?.initials || "AT",
  }));
}

export async function getAttorneyPublicProfile(attorneyId) {
  const attorney = await prisma.attorney.findUnique({
    where: { id: attorneyId, isVerified: true },
    include: { user: { select: { id: true } } },
  });
  if (!attorney) return null;

  const base = formatAttorney(attorney);
  const slots = parseJsonArray(attorney.availabilitySlots);
  const reviews = await listReviewsForAttorney(attorneyId);

  return {
    ...base,
    photoUrl: attorney.photoUrl,
    availabilitySlots: Array.isArray(slots) ? slots : [],
    reviewsList: reviews,
    userId: attorney.userId,
  };
}
