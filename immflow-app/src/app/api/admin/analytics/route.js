import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "analytics", "view");

    const [totalSignups, totalListings, openListings, filledListings, proSubscribers, pendingSignups] =
      await Promise.all([
        prisma.user.count({ where: { role: { not: "admin" } } }),
        prisma.listing.count(),
        prisma.listing.count({ where: { status: "open" } }),
        prisma.listing.count({ where: { status: "filled" } }),
        prisma.user.count({ where: { isPro: true, role: { not: "admin" } } }),
        prisma.user.count({ where: { signupStatus: "pending", role: { not: "admin" } } }),
      ]);

    return apiSuccess({
      totalSignups,
      totalListings,
      openListings,
      filledListings,
      proSubscribers,
      pendingSignups,
      estimatedRevenue: proSubscribers * 29,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch analytics.");
  }
}
