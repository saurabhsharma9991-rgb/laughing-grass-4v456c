import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import { getProviderById } from "@/lib/services/providers";

export async function createProviderReview(reviewerId, providerId, { rating, comment }) {
  const provider = await prisma.provider.findUnique({
    where: { id: Number(providerId) },
    include: { category: true },
  });
  if (!provider) throw new AuthError("Provider not found.", 404, "NOT_FOUND");
  if (!provider.isActive || provider.verificationStatus !== "verified") {
    throw new AuthError("Provider not found.", 404, "NOT_FOUND");
  }
  if (provider.userId === reviewerId) {
    throw new AuthError("You cannot review your own profile.", 400, "SELF_REVIEW");
  }
  if (provider.category?.slug === "attorney") {
    const reviewer = await prisma.user.findUnique({
      where: { id: Number(reviewerId) },
      include: { attorney: true },
    });
    if (reviewer?.role !== "attorney" || !reviewer.attorney?.isVerified) {
      throw new AuthError(
        "Only verified attorneys can leave attorney peer reviews.",
        403,
        "ATTORNEY_REQUIRED"
      );
    }
  } else {
    const [completedOrder, completedBooking] = await Promise.all([
      prisma.translationOrder.findFirst({
        where: {
          clientId: Number(reviewerId),
          providerId: provider.id,
          status: { in: ["completed", "delivered"] },
        },
        select: { id: true },
      }),
      prisma.serviceBooking.findFirst({
        where: {
          clientId: Number(reviewerId),
          providerId: provider.id,
          status: "completed",
        },
        select: { id: true },
      }),
    ]);
    if (!completedOrder && !completedBooking) {
      throw new AuthError(
        "You can review this provider after a completed service.",
        403,
        "COMPLETED_SERVICE_REQUIRED"
      );
    }
  }

  const r = Math.min(5, Math.max(1, parseInt(rating, 10)));
  if (Number.isNaN(r)) throw new AuthError("Rating must be 1–5.", 400, "VALIDATION_ERROR");

  await prisma.providerReview.upsert({
    where: {
      providerId_reviewerId: {
        providerId: provider.id,
        reviewerId,
      },
    },
    create: {
      providerId: provider.id,
      reviewerId,
      rating: r,
      comment: comment?.trim() || null,
    },
    update: {
      rating: r,
      comment: comment?.trim() || null,
    },
  });

  await recalculateProviderRating(provider.id);
  return listReviewsForProvider(provider.id);
}

async function recalculateProviderRating(providerId) {
  const agg = await prisma.providerReview.aggregate({
    where: { providerId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.provider.update({
    where: { id: providerId },
    data: {
      stars: agg._avg.rating ?? 5,
      reviewsCount: agg._count.rating,
    },
  });

  // Keep legacy attorney stars in sync when this is an attorney provider
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: { category: true },
  });
  if (provider?.category?.slug === "attorney") {
    await prisma.attorney.updateMany({
      where: { userId: provider.userId },
      data: {
        stars: agg._avg.rating ?? 5,
        reviewsCount: agg._count.rating,
      },
    });
  }
}

export async function listReviewsForProvider(providerId) {
  const reviews = await prisma.providerReview.findMany({
    where: { providerId: Number(providerId) },
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
    reviewerName: r.reviewer.attorney?.name || r.reviewer.displayName || "User",
    reviewerInitials: r.reviewer.attorney?.initials || "U",
  }));
}

export async function getProviderPublicProfile(providerId) {
  const provider = await getProviderById(providerId);
  if (!provider || !provider.isActive) return null;
  if (provider.verificationStatus !== "verified") {
    // Allow viewing own unverified later; public only verified
    return null;
  }
  const reviews = await listReviewsForProvider(providerId);
  const { email, ...publicProvider } = provider;
  return {
    ...publicProvider,
    credentials: (publicProvider.credentials || []).filter(
      (credential) => credential.status === "verified"
    ),
    reviewsList: reviews,
  };
}

export async function deleteProviderReview(reviewId) {
  const review = await prisma.providerReview.findUnique({ where: { id: Number(reviewId) } });
  if (!review) throw new AuthError("Review not found.", 404, "NOT_FOUND");
  const providerId = review.providerId;
  await prisma.providerReview.delete({ where: { id: review.id } });
  await recalculateProviderRating(providerId);
  return { success: true };
}

export async function listAllProviderReviewsForAdmin() {
  const reviews = await prisma.providerReview.findMany({
    include: {
      provider: { select: { id: true, displayName: true } },
      reviewer: {
        include: { attorney: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return reviews.map((r) => ({
    id: r.id,
    reviewType: "provider",
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    providerId: r.providerId,
    attorneyName: r.provider.displayName,
    reviewerId: r.reviewerId,
    reviewerName:
      r.reviewer.attorney?.name || r.reviewer.displayName || "User",
  }));
}
