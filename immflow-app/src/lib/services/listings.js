import { prisma } from "@/lib/db";
import { parseJsonArray, stringifyJsonArray } from "@/lib/utils/json-fields";
import { formatRelativeTime, getBadgeStyle } from "@/lib/utils/format";
import { AuthError } from "@/lib/auth/guards.js";
import { assertFeatureAccess, getPlatformSettings } from "@/lib/services/platform-settings.js";

export async function listListings({ status, q, location, language, type } = {}) {
  const where = {};
  if (status && status !== "all") {
    where.status = status;
  }
  if (type && type !== "all") {
    where.type = { contains: type };
  }
  if (location) {
    where.location = { contains: location };
  }

  let listings = await prisma.listing.findMany({
    where,
    orderBy: { postedAt: "desc" },
  });

  if (language) {
    const lang = language.toLowerCase();
    listings = listings.filter((l) => {
      const tags = parseJsonArray(l.tags);
      return tags.some((t) => t.toLowerCase().includes(lang)) ||
        l.description?.toLowerCase().includes(lang);
    });
  }

  if (q) {
    const query = q.toLowerCase();
    listings = listings.filter((l) => {
      const tags = parseJsonArray(l.tags).join(" ").toLowerCase();
      return (
        l.title.toLowerCase().includes(query) ||
        l.org?.toLowerCase().includes(query) ||
        l.location?.toLowerCase().includes(query) ||
        l.description?.toLowerCase().includes(query) ||
        l.type?.toLowerCase().includes(query) ||
        tags.includes(query)
      );
    });
  }

  return listings.map(formatListing);
}

export function formatListing(l) {
  const tags = parseJsonArray(l.tags);
  const badgeStyle = getBadgeStyle(l.badge);

  return {
    id: l.id,
    title: l.title,
    org: l.org || "Independent",
    location: l.location || "Remote",
    type: l.type || "Contract",
    badge: l.badge || "New",
    bb: badgeStyle.bg,
    bc: badgeStyle.fg,
    tags,
    pay: l.pay || "DOE",
    applicants: l.applicantsCount || 0,
    posted: formatRelativeTime(l.postedAt),
    postedAt: l.postedAt,
    postedById: l.postedById,
    status: l.status,
    description: l.description || "",
  };
}

export async function enrichListingsForUser(listings, userId) {
  if (!userId || !listings.length) return listings;
  const ids = listings.map((l) => l.id);
  const apps = await prisma.application.findMany({
    where: { applicantId: userId, listingId: { in: ids } },
    select: { id: true, listingId: true, status: true },
  });
  const appMap = Object.fromEntries(
    apps.map((a) => [a.listingId, { id: a.id, status: a.status }])
  );
  return listings.map((l) => ({
    ...l,
    isOwnListing: l.postedById === userId,
    myApplication: appMap[l.id] || null,
  }));
}

function buildListingTags(type, location) {
  const tags = [];
  if (type) tags.push(type);
  if (location?.toLowerCase().includes("remote")) {
    tags.push("Remote");
  } else if (location) {
    tags.push(location.split(",")[0].trim());
  }
  return tags;
}

export async function createListing(userId, input) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPro: true },
  });

  if (!user) {
    throw new AuthError("User not found.", 404, "NOT_FOUND");
  }

  const postAccess = await assertFeatureAccess(userId, "post_listings");
  if (!postAccess.allowed) {
    throw new AuthError(
      "Posting listings is not available on your plan.",
      403,
      "FEATURE_NOT_AVAILABLE"
    );
  }

  const unlimited = await assertFeatureAccess(userId, "unlimited_listings");
  if (!unlimited.allowed) {
    const settings = postAccess.settings || (await getPlatformSettings());
    const listingCount = await prisma.listing.count({
      where: { postedById: userId, status: "open" },
    });
    if (listingCount >= settings.freeListingLimit) {
      throw new AuthError(
        `You have reached the limit for the Free tier (${settings.freeListingLimit} active listing). Please upgrade to Pro for unlimited listings.`,
        403,
        "PRO_UPGRADE_REQUIRED"
      );
    }
  }

  const tags = input.tags?.length ? input.tags : buildListingTags(input.type, input.location);

  const listing = await prisma.listing.create({
    data: {
      title: input.title,
      org: input.org,
      location: input.location,
      description: input.description,
      pay: input.pay,
      type: input.type,
      badge: input.badge || "New",
      tags: stringifyJsonArray(tags),
      postedById: userId,
    },
  });

  return formatListing(listing);
}

export async function updateListing(listingId, input, { userId, isAdmin = false } = {}) {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) throw new AuthError("Listing not found.", 404, "NOT_FOUND");
  if (!isAdmin && listing.postedById !== userId) {
    throw new AuthError("You can only edit your own listings.", 403, "FORBIDDEN");
  }

  const data = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.org !== undefined) data.org = input.org;
  if (input.location !== undefined) data.location = input.location;
  if (input.description !== undefined) data.description = input.description;
  if (input.pay !== undefined) data.pay = input.pay;
  if (input.type !== undefined) data.type = input.type;
  if (input.badge !== undefined) data.badge = input.badge;
  if (input.status !== undefined) data.status = input.status;
  if (input.tags !== undefined) data.tags = stringifyJsonArray(input.tags);

  const updated = await prisma.listing.update({ where: { id: listingId }, data });
  return formatListing(updated);
}
