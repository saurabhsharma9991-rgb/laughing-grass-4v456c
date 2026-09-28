import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import { parseJsonArray, stringifyJsonArray } from "@/lib/utils/json-fields";
import {
  VERIFICATION_STATUSES,
  CREDENTIAL_STATUSES,
  verificationBadgeLabel,
} from "@/lib/constants/marketplace";
import {
  normalizeProfileSchema,
  validateProfileData,
} from "@/lib/validators/category-profile-schema";
import { notifyAdminsPriceChange } from "@/lib/email/notify";

/** First listed dollar amount. Dual rates like "$150/hr · $200/hr" stay 150, not 150200. */
export function listedRateAmount(provider) {
  const profile =
    provider?.profileData && typeof provider.profileData === "object"
      ? provider.profileData
      : {};
  if (profile.basePriceCents != null && Number(profile.basePriceCents) > 0) {
    return Number(profile.basePriceCents) / 100;
  }
  const hourly = Number(profile.hourlyRateRemote ?? profile.hourlyRate);
  if (Number.isFinite(hourly) && hourly > 0) return hourly;
  const match = String(provider?.rate || "").match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) ? amount : null;
}

function initialsFromName(name) {
  return String(name || "P")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatProvider(p) {
  const category = p.category;
  const languages = [...new Set(parseJsonArray(p.languages))];
  const pairs = Array.isArray(p.languagePairs)
    ? p.languagePairs.map((lp) => ({
        id: lp.id,
        source: lp.sourceLanguage,
        target: lp.targetLanguage,
      }))
    : [];

  return {
    id: p.id,
    userId: p.userId,
    categoryId: p.categoryId,
    categorySlug: category?.slug || null,
    categoryName: category?.name || null,
    profileSchema: category?.profileSchema
      ? normalizeProfileSchema(category.profileSchema)
      : { version: 1, workflow: "contact", fields: [] },
    displayName: p.displayName,
    initials: p.initials || initialsFromName(p.displayName),
    photoUrl: p.photoUrl,
    bio: p.bio,
    location: p.location,
    experienceYears: p.experienceYears,
    rate: p.rate,
    pendingRate:
      p.profileData?.pendingRate && typeof p.profileData.pendingRate === "object"
        ? p.profileData.pendingRate
        : null,
    availability: p.availability,
    remoteAvailable: p.remoteAvailable,
    inPersonAvailable: p.inPersonAvailable,
    languages,
    languagePairs: pairs,
    verificationStatus: p.verificationStatus,
    rejectionReason: p.rejectionReason,
    badge: verificationBadgeLabel(category?.slug, p.verificationStatus),
    stars: Number(p.stars),
    reviewsCount: p.reviewsCount,
    availabilitySlots: p.availabilitySlots,
    profileData: p.profileData || {},
    isActive: p.isActive,
    credentials: Array.isArray(p.credentials)
      ? p.credentials.map((c) => ({
          id: c.id,
          label: c.label,
          organization: c.organization,
          credentialNumber: c.credentialNumber,
          issuedAt: c.issuedAt,
          expiresAt: c.expiresAt,
          status: c.status,
          notes: c.notes,
          expiringSoon:
            c.expiresAt &&
            c.expiresAt > new Date() &&
            c.expiresAt < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        }))
      : [],
    email: p.user?.email || null,
    preferredLocale: p.user?.preferredLocale || "en",
    userRole: p.user?.role || null,
    isPro: Boolean(p.user?.isPro),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

const providerInclude = {
  category: true,
  credentials: { orderBy: { createdAt: "desc" } },
  languagePairs: true,
  user: {
    select: {
      email: true,
      role: true,
      isPro: true,
      signupStatus: true,
      preferredLocale: true,
    },
  },
};

export async function listProviders({
  categorySlug,
  verificationStatus,
  verifiedOnly = false,
  q,
  language,
  location,
  remote,
  inPerson,
  minPrice,
  maxPrice,
  minRating,
  availability,
  certified,
  rush,
  documentType,
  turnaround,
  serviceType,
  professionalType,
  licenseState,
  sourceLanguage,
  targetLanguage,
  includeInactive = false,
} = {}) {
  const where = {};
  if (!includeInactive) where.isActive = true;
  if (verifiedOnly) where.verificationStatus = "verified";
  else if (verificationStatus && verificationStatus !== "all") {
    where.verificationStatus = verificationStatus;
  }
  if (categorySlug) {
    where.category = { slug: categorySlug };
  }
  if (location) {
    where.location = { contains: location };
  }
  if (remote === true) where.remoteAvailable = true;
  if (inPerson === true) where.inPersonAvailable = true;
  if (minRating != null && Number.isFinite(Number(minRating))) {
    where.stars = { gte: Number(minRating) };
  }

  let providers = await prisma.provider.findMany({
    where,
    include: providerInclude,
    orderBy: [{ verificationStatus: "asc" }, { displayName: "asc" }],
  });

  if (language) {
    const lang = language.toLowerCase();
    providers = providers.filter((p) => {
      const langs = parseJsonArray(p.languages).map((l) => String(l).toLowerCase());
      const pairs = (p.languagePairs || []).some(
        (lp) =>
          lp.sourceLanguage.toLowerCase().includes(lang) ||
          lp.targetLanguage.toLowerCase().includes(lang)
      );
      return langs.some((l) => l.includes(lang)) || pairs;
    });
  }

  if (sourceLanguage || targetLanguage) {
    providers = providers.filter((p) =>
      (p.languagePairs || []).some(
        (pair) =>
          (!sourceLanguage ||
            pair.sourceLanguage.toLowerCase() ===
              String(sourceLanguage).toLowerCase()) &&
          (!targetLanguage ||
            pair.targetLanguage.toLowerCase() === String(targetLanguage).toLowerCase())
      )
    );
  }

  if (minPrice != null || maxPrice != null) {
    providers = providers.filter((p) => {
      const price = listedRateAmount(p);
      if (!Number.isFinite(price)) return false;
      if (minPrice != null && price < Number(minPrice)) return false;
      if (maxPrice != null && price > Number(maxPrice)) return false;
      return true;
    });
  }

  if (availability) {
    const needle = String(availability).toLowerCase();
    providers = providers.filter(
      (p) =>
        String(p.availability || "").toLowerCase().includes(needle) ||
        (Array.isArray(p.availabilitySlots) &&
          p.availabilitySlots.some((slot) =>
            String(slot).toLowerCase().includes(needle) ||
            needle.includes(String(slot).toLowerCase())
          ))
    );
  }

  const profileFilters = {
    certified: certified === true ? ["offersCertified", true] : null,
    rush: rush === true ? ["rushAvailable", true] : null,
    documentType: documentType ? ["documentTypes", documentType] : null,
    turnaround: turnaround ? ["turnaround", turnaround] : null,
    serviceType: serviceType ? ["serviceTypes", serviceType] : null,
    professionalType: professionalType
      ? ["professionalType", professionalType]
      : null,
    licenseState: licenseState ? ["licenseState", licenseState] : null,
  };
  for (const filter of Object.values(profileFilters).filter(Boolean)) {
    const [key, expected] = filter;
    providers = providers.filter((p) => {
      const aliases = {
        turnaround: ["turnaround", "turnaroundDays"],
        serviceTypes: ["serviceTypes", "evaluationTypes", "services"],
        documentTypes: ["documentTypes", "specializations"],
      };
      const actual = (aliases[key] || [key])
        .map((candidate) => p.profileData?.[candidate])
        .find((value) => value !== undefined && value !== null);
      if (typeof expected === "boolean") return actual === expected;
      if (Array.isArray(actual)) {
        return actual.some((value) =>
          String(value).toLowerCase().includes(String(expected).toLowerCase())
        );
      }
      return String(actual || "")
        .toLowerCase()
        .includes(String(expected).toLowerCase());
    });
  }

  if (q) {
    const query = q.toLowerCase();
    providers = providers.filter((p) => {
      const hay = [
        p.displayName,
        p.bio,
        p.location,
        p.category?.name,
        ...parseJsonArray(p.languages),
        JSON.stringify(p.profileData || {}),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }

  return providers.map(formatProvider);
}

export async function getProviderById(id) {
  const p = await prisma.provider.findUnique({
    where: { id: Number(id) },
    include: providerInclude,
  });
  return p ? formatProvider(p) : null;
}

export async function createProvider({
  userId,
  categoryId,
  displayName,
  profile = {},
}) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: Number(categoryId) },
  });
  if (!category || !category.isActive) {
    throw new AuthError("Invalid or inactive service category.", 400, "INVALID_CATEGORY");
  }

  const name = displayName?.trim();
  if (!name) throw new AuthError("Display name is required.", 400, "VALIDATION_ERROR");

  const existing = await prisma.provider.findUnique({
    where: { userId_categoryId: { userId: Number(userId), categoryId: category.id } },
  });
  if (existing) {
    throw new AuthError("You already have a profile in this category.", 409, "PROVIDER_EXISTS");
  }

  const {
    languages = [],
    languagePairs = [],
    credentials = [],
    bio,
    location,
    experienceYears,
    rate,
    availability,
    remoteAvailable = true,
    inPersonAvailable = false,
    photoUrl,
    availabilitySlots,
    profileData = {},
  } = profile;

  const provider = await prisma.$transaction(async (tx) => {
    const created = await tx.provider.create({
      data: {
        userId: Number(userId),
        categoryId: category.id,
        displayName: name,
        initials: initialsFromName(name),
        bio: bio || null,
        location: location || null,
        experienceYears: experienceYears != null ? Number(experienceYears) : null,
        rate: rate || null,
        availability: availability || null,
        remoteAvailable: Boolean(remoteAvailable),
        inPersonAvailable: Boolean(inPersonAvailable),
        languages: stringifyJsonArray(languages),
        photoUrl: photoUrl || null,
        availabilitySlots: availabilitySlots || null,
        profileData,
        verificationStatus: "pending",
      },
    });

    if (Array.isArray(languagePairs) && languagePairs.length) {
      await tx.providerLanguagePair.createMany({
        data: languagePairs
          .filter((lp) => lp.source && lp.target)
          .map((lp) => ({
            providerId: created.id,
            sourceLanguage: String(lp.source).trim(),
            targetLanguage: String(lp.target).trim(),
          })),
      });
    }

    if (Array.isArray(credentials) && credentials.length) {
      for (const c of credentials) {
        if (!c.label?.trim()) continue;
        await tx.providerCredential.create({
          data: {
            providerId: created.id,
            label: c.label.trim(),
            organization: c.organization || null,
            credentialNumber: c.credentialNumber || null,
            expiresAt: c.expiresAt ? new Date(c.expiresAt) : null,
            status: "pending",
          },
        });
      }
    }

    return created;
  });

  return getProviderById(provider.id);
}

export async function updateProviderVerification(providerId, { status, rejectionReason }) {
  if (!VERIFICATION_STATUSES.includes(status)) {
    throw new AuthError("Invalid verification status.", 400, "VALIDATION_ERROR");
  }

  const provider = await prisma.provider.findUnique({
    where: { id: Number(providerId) },
    include: { category: true, user: true },
  });
  if (!provider) throw new AuthError("Provider not found.", 404, "NOT_FOUND");

  const updated = await prisma.provider.update({
    where: { id: provider.id },
    data: {
      verificationStatus: status,
      rejectionReason: status === "rejected" ? rejectionReason || null : null,
    },
    include: providerInclude,
  });

  // Provider verification controls login approval for every provider category.
  // Without this synchronization, non-attorney providers remain permanently
  // blocked by assertSignupApproved after an admin verifies them.
  const signupStatus =
    status === "verified"
      ? "approved"
      : status === "rejected" || status === "suspended"
        ? "rejected"
        : status === "expired"
          ? provider.user.signupStatus || "approved"
          : provider.user.signupStatus === "approved"
            ? "approved"
            : "pending";
  await prisma.user.update({
    where: { id: provider.userId },
    data: {
      signupStatus,
      rejectionReason:
        signupStatus === "rejected"
          ? rejectionReason ||
            (status === "suspended"
              ? "Your provider account has been suspended."
              : "Credentials could not be verified.")
          : null,
    },
  });

  // Keep legacy Attorney.isVerified in sync for attorney category.
  if (provider.category.slug === "attorney") {
    await prisma.attorney.updateMany({
      where: { userId: provider.userId },
      data: { isVerified: status === "verified" },
    });
  }

  return formatProvider(updated);
}

export async function updateProviderAsAdmin(providerId, input) {
  const provider = await prisma.provider.findUnique({ where: { id: Number(providerId) } });
  if (!provider) throw new AuthError("Provider not found.", 404, "NOT_FOUND");

  const data = {};
  if (input.displayName !== undefined) {
    data.displayName = input.displayName.trim();
    data.initials = initialsFromName(input.displayName);
  }
  if (input.bio !== undefined) data.bio = input.bio;
  if (input.location !== undefined) data.location = input.location;
  if (input.experienceYears !== undefined) data.experienceYears = Number(input.experienceYears) || null;
  if (input.rate !== undefined) data.rate = input.rate;
  if (input.availability !== undefined) data.availability = input.availability;
  if (input.remoteAvailable !== undefined) data.remoteAvailable = Boolean(input.remoteAvailable);
  if (input.inPersonAvailable !== undefined) data.inPersonAvailable = Boolean(input.inPersonAvailable);
  if (input.languages !== undefined) data.languages = stringifyJsonArray(input.languages);
  if (input.profileData !== undefined) data.profileData = input.profileData;
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
  if (input.photoUrl !== undefined) data.photoUrl = input.photoUrl;

  await prisma.provider.update({ where: { id: provider.id }, data });
  return getProviderById(provider.id);
}

export async function getProviderForUser(userId, categorySlug) {
  const include = providerInclude;
  const userFilter = { userId: Number(userId) };
  if (categorySlug) {
    const provider = await prisma.provider.findFirst({
      where: { ...userFilter, category: { slug: String(categorySlug) } },
      include,
    });
    return provider ? formatProvider(provider) : null;
  }

  const providers = await prisma.provider.findMany({
    where: userFilter,
    include,
    orderBy: { createdAt: "asc" },
  });
  const preferred = providers.find((row) => row.category?.slug !== "attorney") || providers[0];
  return preferred ? formatProvider(preferred) : null;
}

export async function updateProviderSelf(userId, input) {
  const categorySlug = input?.categorySlug || input?.category_slug;
  const userFilter = { userId: Number(userId) };
  let provider = await prisma.provider.findFirst({
    where: categorySlug
      ? { ...userFilter, category: { slug: String(categorySlug) } }
      : { ...userFilter, category: { slug: { not: "attorney" } } },
    include: {
      category: true,
      credentials: true,
      user: { select: { email: true } },
    },
  });
  if (!provider && !categorySlug) {
    provider = await prisma.provider.findFirst({
      where: userFilter,
      include: {
        category: true,
        credentials: true,
        user: { select: { email: true } },
      },
    });
  }
  if (!provider) throw new AuthError("Provider profile not found.", 404, "NOT_FOUND");

  const data = {};
  let pendingRateSubmitted = false;
  if (input.displayName !== undefined) {
    const displayName = String(input.displayName).trim().slice(0, 160);
    if (!displayName) {
      throw new AuthError("Display name is required.", 400, "VALIDATION_ERROR");
    }
    data.displayName = displayName;
    data.initials = initialsFromName(displayName);
  }
  if (input.bio !== undefined) data.bio = String(input.bio || "").slice(0, 10_000) || null;
  if (input.location !== undefined) {
    data.location = String(input.location || "").slice(0, 180) || null;
  }
  if (input.experienceYears !== undefined) {
    const years = Number(input.experienceYears);
    data.experienceYears = Number.isFinite(years)
      ? Math.max(0, Math.min(80, years))
      : null;
  }
  if (input.rate !== undefined) {
    const newRate = String(input.rate || "").slice(0, 100) || null;
    const liveNorm = String(provider.rate || "").trim();
    const newNorm = String(newRate || "").trim();
    if (newNorm !== liveNorm) {
      const baseProfile =
        data.profileData ||
        (provider.profileData && typeof provider.profileData === "object"
          ? { ...provider.profileData }
          : {});
      baseProfile.pendingRate = {
        rate: newRate,
        submittedAt: new Date().toISOString(),
        previousRate: provider.rate,
      };
      data.profileData = baseProfile;
      pendingRateSubmitted = true;
    } else {
      data.rate = newRate;
    }
  }
  if (input.availability !== undefined) {
    data.availability = String(input.availability || "").slice(0, 160) || null;
  }
  if (input.remoteAvailable !== undefined) data.remoteAvailable = Boolean(input.remoteAvailable);
  if (input.inPersonAvailable !== undefined) {
    data.inPersonAvailable = Boolean(input.inPersonAvailable);
  }
  if (input.languages !== undefined) {
    data.languages = stringifyJsonArray(
      Array.isArray(input.languages)
        ? input.languages.map((v) => String(v).slice(0, 80)).slice(0, 40)
        : []
    );
  }
  if (input.photoUrl !== undefined) {
    const photo = String(input.photoUrl || "");
    if (photo.length > 600_000) {
      throw new AuthError("Photo is too large.", 400, "PHOTO_TOO_LARGE");
    }
    data.photoUrl = photo || null;
  }
  if (input.availabilitySlots !== undefined) {
    data.availabilitySlots = Array.isArray(input.availabilitySlots)
      ? input.availabilitySlots
          .map((v) => String(v).slice(0, 80))
          .slice(0, 365)
      : [];
  }
  if (input.profileData !== undefined) {
    const schema = normalizeProfileSchema(
      provider.category.profileSchema || { fields: [] }
    );
    const validated = validateProfileData(schema, input.profileData, {
      partial: true,
    });
    const pendingRateKeep = data.profileData?.pendingRate;
    data.profileData = {
      ...(provider.profileData && typeof provider.profileData === "object"
        ? provider.profileData
        : {}),
      ...validated,
      ...(pendingRateKeep ? { pendingRate: pendingRateKeep } : {}),
    };
  }

  const pairs = Array.isArray(input.languagePairs)
    ? input.languagePairs
        .map((pair) => ({
          source: String(pair?.source || "").trim().slice(0, 80),
          target: String(pair?.target || "").trim().slice(0, 80),
        }))
        .filter(
          (pair) =>
            pair.source &&
            pair.target &&
            pair.source.toLowerCase() !== pair.target.toLowerCase()
        )
        .slice(0, 30)
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.provider.update({ where: { id: provider.id }, data });
    if (pairs) {
      await tx.providerLanguagePair.deleteMany({
        where: { providerId: provider.id },
      });
      for (const pair of pairs) {
        await tx.providerLanguagePair.create({
          data: {
            providerId: provider.id,
            sourceLanguage: pair.source,
            targetLanguage: pair.target,
          },
        });
      }
    }
    if (Array.isArray(input.credentials)) {
      for (const credential of input.credentials.slice(0, 10)) {
        if (!credential?.label) continue;
        if (credential.id) {
          const existing = await tx.providerCredential.findFirst({
            where: { id: Number(credential.id), providerId: provider.id },
          });
          if (!existing) continue;
          await tx.providerCredential.update({
            where: { id: existing.id },
            data: {
              label: String(credential.label).slice(0, 160),
              organization: String(credential.organization || "").slice(0, 160) || null,
              credentialNumber:
                String(credential.credentialNumber || "").slice(0, 160) || null,
              expiresAt: credential.expiresAt
                ? new Date(credential.expiresAt)
                : null,
              status: "pending",
            },
          });
        } else {
          await tx.providerCredential.create({
            data: {
              providerId: provider.id,
              label: String(credential.label).slice(0, 160),
              organization: String(credential.organization || "").slice(0, 160) || null,
              credentialNumber:
                String(credential.credentialNumber || "").slice(0, 160) || null,
              expiresAt: credential.expiresAt
                ? new Date(credential.expiresAt)
                : null,
              status: "pending",
            },
          });
        }
      }
      await tx.provider.update({
        where: { id: provider.id },
        data: { verificationStatus: "pending" },
      });
    }
  });

  if (pendingRateSubmitted) {
    const pending = data.profileData?.pendingRate;
    void notifyAdminsPriceChange({
      providerId: provider.id,
      displayName: data.displayName || provider.displayName,
      email: provider.user?.email,
      oldRate: provider.rate,
      newRate: pending?.rate,
    });
  }

  return getProviderForUser(userId);
}

export async function approveProviderRateChange(providerId) {
  const provider = await prisma.provider.findUnique({
    where: { id: Number(providerId) },
  });
  if (!provider) throw new AuthError("Provider not found.", 404, "NOT_FOUND");
  const pending = provider.profileData?.pendingRate;
  if (!pending?.rate) {
    throw new AuthError("No pending rate change for this provider.", 400, "NO_PENDING_RATE");
  }
  const profileData = { ...(provider.profileData || {}) };
  delete profileData.pendingRate;
  await prisma.provider.update({
    where: { id: provider.id },
    data: {
      rate: String(pending.rate).slice(0, 100),
      profileData,
    },
  });
  return getProviderById(provider.id);
}

export async function rejectProviderRateChange(providerId) {
  const provider = await prisma.provider.findUnique({
    where: { id: Number(providerId) },
  });
  if (!provider) throw new AuthError("Provider not found.", 404, "NOT_FOUND");
  const pending = provider.profileData?.pendingRate;
  if (!pending) {
    throw new AuthError("No pending rate change for this provider.", 400, "NO_PENDING_RATE");
  }
  const profileData = { ...(provider.profileData || {}) };
  delete profileData.pendingRate;
  await prisma.provider.update({
    where: { id: provider.id },
    data: { profileData },
  });
  return getProviderById(provider.id);
}

export async function deleteProvider(providerId) {
  const provider = await prisma.provider.findUnique({ where: { id: Number(providerId) } });
  if (!provider) throw new AuthError("Provider not found.", 404, "NOT_FOUND");
  await prisma.provider.delete({ where: { id: provider.id } });
  return { success: true };
}

export async function addProviderCredential(providerId, input) {
  const provider = await prisma.provider.findUnique({ where: { id: Number(providerId) } });
  if (!provider) throw new AuthError("Provider not found.", 404, "NOT_FOUND");
  if (!input.label?.trim()) throw new AuthError("Credential label is required.", 400, "VALIDATION_ERROR");

  await prisma.providerCredential.create({
    data: {
      providerId: provider.id,
      label: input.label.trim(),
      organization: input.organization || null,
      credentialNumber: input.credentialNumber || null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      status: input.status || "pending",
      notes: input.notes || null,
    },
  });
  return getProviderById(provider.id);
}

export async function updateCredentialStatus(credentialId, status) {
  if (!CREDENTIAL_STATUSES.includes(status)) {
    throw new AuthError("Invalid credential status.", 400, "VALIDATION_ERROR");
  }
  const cred = await prisma.providerCredential.findUnique({ where: { id: Number(credentialId) } });
  if (!cred) throw new AuthError("Credential not found.", 404, "NOT_FOUND");
  await prisma.providerCredential.update({
    where: { id: cred.id },
    data: { status },
  });
  return getProviderById(cred.providerId);
}

export async function requestUpdatedCredential(credentialId, note) {
  const cred = await prisma.providerCredential.findUnique({
    where: { id: Number(credentialId) },
  });
  if (!cred) throw new AuthError("Credential not found.", 404, "NOT_FOUND");
  await prisma.$transaction([
    prisma.providerCredential.update({
      where: { id: cred.id },
      data: {
        status: "pending",
        notes:
          String(note || "Please upload an updated credential.")
            .trim()
            .slice(0, 2000),
      },
    }),
    prisma.provider.update({
      where: { id: cred.providerId },
      data: { verificationStatus: "pending" },
    }),
  ]);
  return getProviderById(cred.providerId);
}

export async function countExpiringCredentials(withinDays = 60) {
  const until = new Date();
  until.setDate(until.getDate() + withinDays);
  return prisma.providerCredential.count({
    where: {
      expiresAt: { lte: until, gte: new Date() },
      status: { not: "expired" },
    },
  });
}
