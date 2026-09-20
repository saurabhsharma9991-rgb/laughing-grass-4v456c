import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { fetchStripeBillingSummary } from "@/lib/services/billing";
import { prisma } from "@/lib/db";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "analytics", "view");

    const [proSubscribers, promoSubscribers, stripe] = await Promise.all([
      prisma.user.count({ where: { isPro: true, role: { not: "admin" } } }),
      prisma.user.count({ where: { promoUsed: { not: null } } }),
      fetchStripeBillingSummary(),
    ]);

    return apiSuccess({
      proSubscribers,
      promoSubscribers,
      estimatedRevenue: proSubscribers * 29,
      stripe,
    });
  } catch (error) {
    return handleApiError(error, "Failed to fetch billing data.");
  }
}
