import { prisma } from "@/lib/db";
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_FREE_LISTING_LIMIT,
} from "@/lib/constants/platform-features.js";
import {
  DEFAULT_COMMISSION_PERCENT_FREE,
  DEFAULT_COMMISSION_PERCENT_PRO,
  COMMISSIONABLE_ROLES,
  COMMISSIONABLE_ORDER_TYPES,
  normalizeCommissionPercent,
} from "@/lib/constants/commission.js";
import { PLATFORM_LOCALES } from "@/lib/constants/marketplace.js";

const KEYS = {
  testMode: "platform.test_mode",
  features: "platform.features",
  freeListingLimit: "platform.free_listing_limit",
  commissionPercent: "platform.commission_percent",
  commissionPercentFree: "platform.commission_percent_free",
  commissionPercentPro: "platform.commission_percent_pro",
  commissionableRoles: "platform.commissionable_roles",
  commissionableOrderTypes: "platform.commissionable_order_types",
  enabledLocales: "platform.enabled_locales",
};

const DEFAULT_ENABLED_LOCALES = PLATFORM_LOCALES.map((locale) => locale.code);

function parseEnabledLocales(raw) {
  const allowed = new Set(DEFAULT_ENABLED_LOCALES);
  if (!raw) return DEFAULT_ENABLED_LOCALES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ENABLED_LOCALES;
    const selected = parsed.filter((code) => allowed.has(code) && code !== "en");
    return ["en", ...selected];
  } catch {
    return DEFAULT_ENABLED_LOCALES;
  }
}

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

function parseJsonObject(raw, fallback) {
  if (!raw) return { ...fallback };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { ...fallback };
    return { ...fallback, ...parsed };
  } catch {
    return { ...fallback };
  }
}

export async function getPlatformSettings() {
  await ensurePlatformDefaults();

  const rows = await prisma.siteContent.findMany({
    where: {
      key: {
        in: [
          KEYS.testMode,
          KEYS.features,
          KEYS.freeListingLimit,
          KEYS.commissionPercent,
          KEYS.commissionPercentFree,
          KEYS.commissionPercentPro,
          KEYS.commissionableRoles,
          KEYS.commissionableOrderTypes,
          KEYS.enabledLocales,
        ],
      },
    },
  });
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));

  return {
    testMode: map[KEYS.testMode] === "true",
    features: parseFeatures(map[KEYS.features]),
    freeListingLimit: Number(map[KEYS.freeListingLimit]) || DEFAULT_FREE_LISTING_LIMIT,
    commissionPercentFree: normalizeCommissionPercent(
      map[KEYS.commissionPercentFree] ?? map[KEYS.commissionPercent],
      DEFAULT_COMMISSION_PERCENT_FREE
    ),
    commissionPercentPro: normalizeCommissionPercent(
      map[KEYS.commissionPercentPro],
      DEFAULT_COMMISSION_PERCENT_PRO
    ),
    commissionPercent: normalizeCommissionPercent(
      map[KEYS.commissionPercentFree] ?? map[KEYS.commissionPercent],
      DEFAULT_COMMISSION_PERCENT_FREE
    ),
    commissionableRoles: parseJsonObject(
      map[KEYS.commissionableRoles],
      COMMISSIONABLE_ROLES
    ),
    commissionableOrderTypes: parseJsonObject(
      map[KEYS.commissionableOrderTypes],
      COMMISSIONABLE_ORDER_TYPES
    ),
    enabledLocales: parseEnabledLocales(map[KEYS.enabledLocales]),
  };
}

export async function updatePlatformSettings({
  testMode,
  features,
  freeListingLimit,
  commissionPercent,
  commissionPercentFree,
  commissionPercentPro,
  commissionableRoles,
  commissionableOrderTypes,
  enabledLocales,
}) {
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

  const freePct =
    commissionPercentFree !== undefined
      ? normalizeCommissionPercent(commissionPercentFree, DEFAULT_COMMISSION_PERCENT_FREE)
      : commissionPercent !== undefined
        ? normalizeCommissionPercent(commissionPercent, DEFAULT_COMMISSION_PERCENT_FREE)
        : undefined;
  if (freePct !== undefined) {
    updates.push(
      prisma.siteContent.upsert({
        where: { key: KEYS.commissionPercentFree },
        create: {
          key: KEYS.commissionPercentFree,
          value: String(freePct),
          type: "number",
          section: "platform",
          label: "Free plan commission %",
        },
        update: { value: String(freePct) },
      }),
      prisma.siteContent.upsert({
        where: { key: KEYS.commissionPercent },
        create: {
          key: KEYS.commissionPercent,
          value: String(freePct),
          type: "number",
          section: "platform",
          label: "Marketplace commission %",
        },
        update: { value: String(freePct) },
      })
    );
  }

  if (commissionPercentPro !== undefined) {
    const proPct = normalizeCommissionPercent(
      commissionPercentPro,
      DEFAULT_COMMISSION_PERCENT_PRO
    );
    updates.push(
      prisma.siteContent.upsert({
        where: { key: KEYS.commissionPercentPro },
        create: {
          key: KEYS.commissionPercentPro,
          value: String(proPct),
          type: "number",
          section: "platform",
          label: "Pro plan commission %",
        },
        update: { value: String(proPct) },
      })
    );
  }

  if (commissionableRoles !== undefined) {
    updates.push(
      prisma.siteContent.upsert({
        where: { key: KEYS.commissionableRoles },
        create: {
          key: KEYS.commissionableRoles,
          value: JSON.stringify(commissionableRoles),
          type: "json",
          section: "platform",
          label: "Commissionable roles",
        },
        update: { value: JSON.stringify(commissionableRoles) },
      })
    );
  }

  if (commissionableOrderTypes !== undefined) {
    updates.push(
      prisma.siteContent.upsert({
        where: { key: KEYS.commissionableOrderTypes },
        create: {
          key: KEYS.commissionableOrderTypes,
          value: JSON.stringify(commissionableOrderTypes),
          type: "json",
          section: "platform",
          label: "Commissionable order types",
        },
        update: { value: JSON.stringify(commissionableOrderTypes) },
      })
    );
  }

  if (enabledLocales !== undefined) {
    const normalized = parseEnabledLocales(JSON.stringify(enabledLocales));
    updates.push(
      prisma.siteContent.upsert({
        where: { key: KEYS.enabledLocales },
        create: {
          key: KEYS.enabledLocales,
          value: JSON.stringify(normalized),
          type: "json",
          section: "platform",
          label: "Enabled languages",
        },
        update: { value: JSON.stringify(normalized) },
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
    {
      key: KEYS.commissionPercent,
      value: String(DEFAULT_COMMISSION_PERCENT_FREE),
      type: "number",
      section: "platform",
      label: "Marketplace commission %",
    },
    {
      key: KEYS.commissionPercentFree,
      value: String(DEFAULT_COMMISSION_PERCENT_FREE),
      type: "number",
      section: "platform",
      label: "Free plan commission %",
    },
    {
      key: KEYS.commissionPercentPro,
      value: String(DEFAULT_COMMISSION_PERCENT_PRO),
      type: "number",
      section: "platform",
      label: "Pro plan commission %",
    },
    {
      key: KEYS.commissionableRoles,
      value: JSON.stringify(COMMISSIONABLE_ROLES),
      type: "json",
      section: "platform",
      label: "Commissionable roles",
    },
    {
      key: KEYS.commissionableOrderTypes,
      value: JSON.stringify(COMMISSIONABLE_ORDER_TYPES),
      type: "json",
      section: "platform",
      label: "Commissionable order types",
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
