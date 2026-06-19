/** Client-safe feature access check (no Prisma). */
export function userCanAccess(features, featureKey, isPro) {
  const flag = features?.[featureKey];
  if (!flag) return false;
  return isPro ? Boolean(flag.pro) : Boolean(flag.free);
}
