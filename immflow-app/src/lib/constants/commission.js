/**
 * Marketplace commission helpers.
 * Client pays listed priceCents; ImmFlow takes commissionPercent; provider gets the rest.
 */

export const DEFAULT_COMMISSION_PERCENT = 25;
export const DEFAULT_COMMISSION_PERCENT_FREE = 25;
export const DEFAULT_COMMISSION_PERCENT_PRO = 15;

export const COMMISSIONABLE_ROLES = {
  provider: true,
  attorney: false,
};

export const COMMISSIONABLE_ORDER_TYPES = {
  translation_order: true,
  service_booking: true,
  /** Reserved for future admin toggles */
  attorney_consultation: false,
  listing_fee: false,
};

export function normalizeCommissionPercent(value, fallback = DEFAULT_COMMISSION_PERCENT) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Split a client-paid amount into platform fee + provider share.
 * @returns {{ priceCents: number, platformFeeCents: number, providerShareCents: number, commissionPercent: number }}
 */
export function splitCommission(priceCents, commissionPercent = DEFAULT_COMMISSION_PERCENT) {
  const price = Math.max(0, Math.round(Number(priceCents) || 0));
  const pct = normalizeCommissionPercent(commissionPercent);
  const platformFeeCents = Math.round((price * pct) / 100);
  const providerShareCents = Math.max(0, price - platformFeeCents);
  return {
    priceCents: price,
    platformFeeCents,
    providerShareCents,
    commissionPercent: pct,
  };
}

export function formatCommissionSplitLabel(split, currency = "usd") {
  const fmt = (cents) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "usd").toUpperCase(),
    }).format((cents || 0) / 100);

  return `Client pays ${fmt(split.priceCents)} → ImmFlow ${fmt(split.platformFeeCents)} (${split.commissionPercent}%) → You receive ${fmt(split.providerShareCents)}`;
}

export function isRoleCommissionable(settings, role) {
  const roles = settings?.commissionableRoles || COMMISSIONABLE_ROLES;
  return Boolean(roles?.[role]);
}

export function isOrderTypeCommissionable(settings, orderType) {
  const types = settings?.commissionableOrderTypes || COMMISSIONABLE_ORDER_TYPES;
  return Boolean(types?.[orderType]);
}

/**
 * Resolve fee fields for a marketplace charge.
 * If not commissionable, platform fee is 0 and provider gets full amount.
 */
export function commissionPercentForPlan(settings, isPro) {
  if (isPro) {
    return normalizeCommissionPercent(
      settings?.commissionPercentPro,
      DEFAULT_COMMISSION_PERCENT_PRO
    );
  }
  return normalizeCommissionPercent(
    settings?.commissionPercentFree ?? settings?.commissionPercent,
    DEFAULT_COMMISSION_PERCENT_FREE
  );
}

export function resolveMarketplaceFees({
  priceCents,
  settings,
  role = "provider",
  orderType = "translation_order",
  isPro = false,
}) {
  const price = Math.max(0, Math.round(Number(priceCents) || 0));
  const apply =
    isRoleCommissionable(settings, role) &&
    isOrderTypeCommissionable(settings, orderType);
  const pct = commissionPercentForPlan(settings, isPro);

  if (!apply || !price) {
    return {
      priceCents: price || null,
      platformFeeCents: price ? 0 : null,
      providerShareCents: price || null,
      commissionPercent: apply ? pct : 0,
      commissionApplied: false,
    };
  }

  const split = splitCommission(price, pct);
  return { ...split, commissionApplied: true };
}
