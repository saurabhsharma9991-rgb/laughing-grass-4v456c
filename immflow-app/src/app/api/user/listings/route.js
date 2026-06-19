import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { prisma } from "@/lib/db";
import { formatListing } from "@/lib/services/listings";
import { formatRelativeTime } from "@/lib/utils/format";

export async function GET(req) {
  try {
    const session = requireAuth(req);
    const listings = await prisma.listing.findMany({
      where: { postedById: session.userId },
      include: {
        applications: {
          select: { id: true, status: true },
        },
      },
      orderBy: { postedAt: "desc" },
    });

    return apiSuccess(
      listings.map((l) => {
        const base = formatListing(l);
        const pending = l.applications.filter((a) => a.status === "applied").length;
        const accepted = l.applications.filter((a) => a.status === "accepted").length;
        return {
          ...base,
          applicationStats: {
            total: l.applications.length,
            pending,
            accepted,
          },
        };
      })
    );
  } catch (error) {
    return handleApiError(error, "Failed to fetch your listings.");
  }
}
