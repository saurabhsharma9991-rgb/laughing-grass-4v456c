import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import { parseJsonArray } from "@/lib/utils/json-fields";
import { formatAttorney } from "@/lib/services/attorneys";

export async function createReview(reviewerId, attorneyId, { rating, comment }) {
  const [attorney, reviewer] = await Promise.all([
    prisma.attorney.findUnique({ where: { id: attorneyId } }),
    prisma.user.findUnique({
      where: { id: reviewerId },
      include: { attorney: true },
    }),
  ]);
  if (!attorney) throw new AuthError("Attorney not found.", 404, "NOT_FOUND");
  if (reviewer?.role !== "attorney" || !reviewer.attorney?.isVerified) {
    throw new AuthError(
      "Only verified attorneys can leave attorney peer reviews.",
      403,
      "ATTORNEY_REQUIRED"
    );
  }
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

  const attorney = await prisma.attorney.update({
    where: { id: attorneyId },
    data: {
      stars: agg._avg.rating ?? 5,
      reviewsCount: agg._count.rating,
    },
  });
  await prisma.provider.updateMany({
    where: { userId: attorney.userId, category: { slug: "attorney" } },
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
    reviewType: "attorney",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    reviewerName: r.reviewer.attorney?.name || r.reviewer.displayName || "Attorney",
    reviewerInitials: r.reviewer.attorney?.initials || "AT",
  }));
}

export async function listAllReviewsForAdmin() {
  const reviews = await prisma.review.findMany({
    include: {
      attorney: { select: { id: true, name: true } },
      reviewer: {
        include: {
          attorney: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    attorneyId: r.attorneyId,
    attorneyName: r.attorney.name,
    reviewerId: r.reviewerId,
    reviewerName: r.reviewer.attorney?.name || r.reviewer.displayName || "Attorney",
  }));
}

export async function deleteReview(reviewId) {
  const review = await prisma.review.findUnique({ where: { id: Number(reviewId) } });
  if (!review) throw new AuthError("Review not found.", 404, "NOT_FOUND");

  const attorneyId = review.attorneyId;
  await prisma.review.delete({ where: { id: review.id } });
  await recalculateAttorneyRating(attorneyId);
  return { success: true };
}

export async function getAttorneyPublicProfile(attorneyId) {
  const attorney = await prisma.attorney.findUnique({
    where: { id: attorneyId, isVerified: true },
    include: { user: { select: { id: true, email: true } } },
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
    email: attorney.user?.email || null,
  };
}
