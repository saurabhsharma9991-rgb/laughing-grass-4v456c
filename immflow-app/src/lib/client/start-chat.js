/** Start an in-platform chat from any attorney card or matcher result. */
export function startChatWithAttorney(
  attorney,
  { user, setShowAuth, setPage, canAccessMessaging = false }
) {
  if (!user) {
    setShowAuth(true);
    return;
  }
  if (!canAccessMessaging) {
    alert(
      "Direct messaging is not available on your plan. Open Dashboard → Billing & Subscriptions to upgrade."
    );
    setPage("dashboard");
    return;
  }
  if (!attorney?.userId) {
    alert("Unable to start chat — attorney profile is missing a user ID.");
    return;
  }
  localStorage.setItem(
    "immflow_chat_partner",
    JSON.stringify({
      id: attorney.userId,
      name: attorney.name,
      initials: attorney.initials || "AT",
      email: attorney.contactEmail || "",
    })
  );
  setPage("dashboard");
}
