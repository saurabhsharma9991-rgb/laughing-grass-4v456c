import { prisma } from "@/lib/db";
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_FREE_LISTING_LIMIT,
} from "@/lib/constants/platform-features.js";
import { userCanAccess } from "@/lib/utils/feature-access.js";

const KEYS = {
  testMode: "platform.test_mode",
  features: "platform.features",
  freeListingLimit: "platform.free_listing_limit",
};

function parseFeatures(raw) {
  if (!raw) return { ...DEFAULT_FEATURE_FLAGS };
  try {
    const parsed = JSON.parse(raw);
    const merged = {};
    for (const [key, def] of Object.entries(DEFAULT_FEATURE_FLAGS)) {
      merged[key] = {
        ...def,
        ...(parsed[key] || {}),
      };
    }
    return merged;
  } catch {
    return { ...DEFAULT_FEATURE_FLAGS };
  }
}

export async function getPlatformSettings() {
  await ensurePlatformDefaults();

  const rows = await prisma.siteContent.findMany({
    where: {
      key: { in: [KEYS.testMode, KEYS.features, KEYS.freeListingLimit] },
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    testMode: map[KEYS.testMode] === "true",
    features: parseFeatures(map[KEYS.features]),
    freeListingLimit: Number(map[KEYS.freeListingLimit]) || DEFAULT_FREE_LISTING_LIMIT,
  };
}

export async function updatePlatformSettings({ testMode, features, freeListingLimit }) {
  const updates = [];

  if (testMode !== undefined) {
    updates.push(
      prisma.siteContent.upsert({
        where: { key: KEYS.testMode },
        create: {
          key: KEYS.testMode,
          value: testMode ? "true" : "false",
          type: "boolean",
          section: "platform",
          label: "Test mode",
        },
        update: { value: testMode ? "true" : "false" },
      })
    );
  }

  if (features !== undefined) {
    updates.push(
      prisma.siteContent.upsert({
        where: { key: KEYS.features },
        create: {
          key: KEYS.features,
          value: JSON.stringify(features),
          type: "json",
          section: "platform",
          label: "Feature flags",
        },
        update: { value: JSON.stringify(features) },
      })
    );
  }

  if (freeListingLimit !== undefined) {
    updates.push(
      prisma.siteContent.upsert({
        where: { key: KEYS.freeListingLimit },
        create: {
          key: KEYS.freeListingLimit,
          value: String(freeListingLimit),
          type: "number",
          section: "platform",
          label: "Free tier listing limit",
        },
        update: { value: String(freeListingLimit) },
      })
    );
  }

  if (updates.length) await prisma.$transaction(updates);
  return getPlatformSettings();
}

export async function assertFeatureAccess(userId, featureKey) {
  const [settings, user] = await Promise.all([
    getPlatformSettings(),
    prisma.user.findUnique({
      where: { id: userId },
      select: { isPro: true, role: true },
    }),
  ]);

  if (!user) return { allowed: false, settings };

  if (settings.testMode && user.role === "admin") {
    return { allowed: true, settings, testModeBypass: true };
  }

  const allowed = userCanAccess(settings.features, featureKey, user.isPro);
  return { allowed, settings };
}

async function ensurePlatformDefaults() {
  const defaults = [
    {
      key: KEYS.testMode,
      value: "false",
      type: "boolean",
      section: "platform",
      label: "Test mode",
    },
    {
      key: KEYS.features,
      value: JSON.stringify(DEFAULT_FEATURE_FLAGS),
      type: "json",
      section: "platform",
      label: "Feature flags",
    },
    {
      key: KEYS.freeListingLimit,
      value: String(DEFAULT_FREE_LISTING_LIMIT),
      type: "number",
      section: "platform",
      label: "Free tier listing limit",
    },
  ];

  for (const row of defaults) {
    await prisma.siteContent.upsert({
      where: { key: row.key },
      create: row,
      update: {},
    });
  }
}
