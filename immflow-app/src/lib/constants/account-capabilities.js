/** What one login can do, based on the profiles attached to the account. */
export function accountCapabilities(user) {
  const categories = Array.isArray(user?.providerCategories)
    ? user.providerCategories.filter((slug) => slug && slug !== "attorney")
    : user?.providerCategory && user.providerCategory !== "attorney"
      ? [user.providerCategory]
      : [];

  const isAttorney = Boolean(user?.isAttorney) || user?.role === "attorney";
  const isClient = user?.role === "public";
  const isAdmin = user?.role === "admin";
  const offersTranslation = categories.includes("translation");
  const offersBookings =
    categories.includes("interpreter") || categories.includes("psychological");
  const isServiceProvider = categories.length > 0;

  return {
    categories,
    isAttorney,
    isClient,
    isAdmin,
    offersTranslation,
    offersBookings,
    isServiceProvider,
  };
}

export function capabilityLabel(user) {
  const caps = accountCapabilities(user);
  const parts = [];
  if (caps.isAttorney) parts.push("Attorney");
  if (caps.categories.includes("translation")) parts.push("Translator");
  if (caps.categories.includes("interpreter")) parts.push("Interpreter");
  if (caps.categories.includes("psychological")) parts.push("Psychological evaluator");
  if (caps.isClient) parts.push("Client");
  if (caps.isAdmin) parts.push("Admin");
  if (!parts.length) parts.push("ImmFlow member");
  const plan = user?.isPro ? "Pro" : "Free";
  if (caps.isClient || caps.isAttorney || caps.isServiceProvider) {
    return `${parts.join(" · ")} · ${plan} plan`;
  }
  return parts.join(" · ");
}
