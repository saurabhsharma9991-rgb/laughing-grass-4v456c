import { parseTagsInput } from "@/lib/utils/tags.js";

export function validateAttorneyProfile(body) {
  const errors = {};
  if (!body?.name?.trim()) errors.name = "Name is required.";

  if (Object.keys(errors).length) {
    return { valid: false, errors };
  }

  const specialties = parseTagsInput(body.specialties);
  const languages = parseTagsInput(body.languages);
  const name = body.name.trim();

  return {
    valid: true,
    data: {
      name,
      initials: body.initials?.trim() || name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      location: body.location?.trim() || null,
      experienceYears: body.experienceYears ? parseInt(body.experienceYears, 10) : null,
      rate: body.rate?.trim() || null,
      availability: body.availability?.trim() || "Available now",
      bio: body.bio?.trim() || null,
      barNumber: body.barNumber?.trim() || null,
      stateBar: body.stateBar?.trim() || null,
      specialties,
      languages,
      stars: body.stars !== undefined ? Number(body.stars) : undefined,
      reviewsCount: body.reviewsCount !== undefined ? parseInt(body.reviewsCount, 10) : undefined,
      isVerified: body.isVerified !== undefined ? Boolean(body.isVerified) : undefined,
      photoUrl: body.photoUrl !== undefined ? body.photoUrl : undefined,
      availabilitySlots: body.availabilitySlots !== undefined ? body.availabilitySlots : undefined,
    },
  };
}
