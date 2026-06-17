import { prisma } from "@/lib/db";
import { parseJsonArray, stringifyJsonArray } from "@/lib/utils/json-fields";
import { getAttorneyColorSet } from "@/lib/utils/format";
import { getAvailabilityDot } from "@/lib/utils/tags";
import { AuthError } from "@/lib/auth/guards.js";

export async function listAttorneys({ verifiedOnly = true } = {}) {
  const attorneys = await prisma.attorney.findMany({
    where: verifiedOnly ? { isVerified: true } : undefined,
    orderBy: { name: "asc" },
  });
  return attorneys.map(formatAttorney);
}

export async function getAttorneyByUserId(userId) {
  const attorney = await prisma.attorney.findUnique({
    where: { userId },
    include: { user: { select: { email: true, isPro: true } } },
  });
  return attorney ? formatAttorneyFull(attorney) : null;
}

export async function updateAttorneyProfile(attorneyId, input) {
  const existing = await prisma.attorney.findUnique({ where: { id: attorneyId } });
  if (!existing) throw new AuthError("Attorney not found.", 404, "NOT_FOUND");

  const data = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.initials !== undefined) data.initials = input.initials;
  if (input.location !== undefined) data.location = input.location;
  if (input.experienceYears !== undefined) data.experienceYears = input.experienceYears;
  if (input.rate !== undefined) data.rate = input.rate;
  if (input.availability !== undefined) data.availability = input.availability;
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.barNumber !== undefined) data.barNumber = input.barNumber;
  if (input.stateBar !== undefined) data.stateBar = input.stateBar;
  if (input.specialties !== undefined) data.specialties = stringifyJsonArray(input.specialties);
  if (input.languages !== undefined) data.languages = stringifyJsonArray(input.languages);
  if (input.stars !== undefined) data.stars = input.stars;
  if (input.reviewsCount !== undefined) data.reviewsCount = input.reviewsCount;
  if (input.isVerified !== undefined) data.isVerified = input.isVerified;

  const attorney = await prisma.attorney.update({
    where: { id: attorneyId },
    data,
    include: { user: { select: { email: true, isPro: true } } },
  });

  return formatAttorneyFull(attorney);
}

export function formatAttorney(a) {
  const specialties = parseJsonArray(a.specialties);
  const languages = parseJsonArray(a.languages);
  const colorSet = getAttorneyColorSet(a.id);
  const avail = a.availability || "Available now";

  return {
    id: a.id,
    userId: a.userId,
    initials: a.initials || "AT",
    bg: a.photoUrl ? null : colorSet.bg,
    fg: a.photoUrl ? null : colorSet.fg,
    name: a.name,
    location: a.location || "USA",
    exp: `${a.experienceYears || 0} yrs`,
    experienceYears: a.experienceYears,
    tags: [...specialties, ...languages],
    specialties,
    languages,
    rate: a.rate || "$150/hr",
    avail,
    availability: avail,
    dot: getAvailabilityDot(avail),
    stars: Number(a.stars || 5.0).toFixed(1),
    reviews: a.reviewsCount || 0,
    bio: a.bio,
    barNumber: a.barNumber,
    stateBar: a.stateBar,
    isVerified: a.isVerified,
  };
}

export function formatAttorneyFull(a) {
  const base = formatAttorney(a);
  return {
    ...base,
    email: a.user?.email,
    isPro: a.user?.isPro,
  };
}
