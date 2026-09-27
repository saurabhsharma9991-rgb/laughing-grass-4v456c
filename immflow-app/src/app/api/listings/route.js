import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateCreateListing } from "@/lib/validators/listings";
import { listListings, createListing, enrichListingsForUser } from "@/lib/services/listings";
import { extractAuthToken, verifyToken } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";
import { isProOnlyListingType } from "@/lib/constants/listing-types";

function getOptionalUserId(req) {
  try {
    const token = extractAuthToken(req);
    if (!token) return null;
    const session = verifyToken(token);
    return session?.userId ?? null;
  } catch {
    return null;
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    let listings = await listListings({
      status: searchParams.get("status") || "open",
      q: searchParams.get("q") || "",
      location: searchParams.get("location") || "",
      language: searchParams.get("language") || "",
      type: searchParams.get("type") || "",
    });

    const userId = getOptionalUserId(req);
    let isPro = false;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isPro: true },
      });
      isPro = Boolean(user?.isPro);
      listings = await enrichListingsForUser(listings, userId);
    }

    // Hearing / Outsource / Contract listings are Pro-only for browsing
    if (!isPro) {
      listings = listings.filter(
        (l) =>
          !isProOnlyListingType(l.type) ||
          (userId && Number(l.postedById) === Number(userId))
      );
    }

    return apiSuccess(listings);
  } catch (error) {
    return handleApiError(error, "Failed to fetch listings.");
  }
}

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const body = await req.json();
    const validation = validateCreateListing(body);

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
    }

    const listing = await createListing(session.userId, validation.data);
    return apiSuccess(listing, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create listing.");
  }
}
