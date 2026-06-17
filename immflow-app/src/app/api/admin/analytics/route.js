import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET(req) {
  try {
    requireAdmin(req);

    const [totalSignups, totalListings, openListings, filledListings, proSubscribers] =
      await Promise.all([
        prisma.user.count({ where: { role: { not: "admin" } } }),
        prisma.listing.count(),
        prisma.listing.count({ where: { status: "open" } }),
        prisma.listing.count({ where: { status: "filled" } }),
        prisma.user.count({ where: { isPro: true, role: { not: "admin" } } }),
      ]);

    return apiSuccess({
      totalSignups,
      totalListings,
      openListings,
      filledListings,
      proSubscribers,
      estimatedRevenue: proSubscribers * 29,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch analytics.");
  }
}
