import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { formatListing } from "@/lib/services/listings";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const listings = await prisma.listing.findMany({
      where: { postedById: session.userId },
      orderBy: { postedAt: "desc" },
    });
    return apiSuccess(listings.map(formatListing));
  } catch (error) {
    return handleApiError(error, "Failed to fetch your listings.");
  }
}
