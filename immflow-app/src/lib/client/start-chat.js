import { toastError } from "@/lib/client/alerts";
import { pathForPage } from "@/lib/constants/routes";

const PENDING_CHAT_KEY = "immflow_pending_chat";

/** Navigate to dashboard chat — full page load avoids profile-route stuck state. */
function goToDashboardChat(query = "") {
  const base = pathForPage("dashboard");
  window.location.assign(query ? `${base}?${query}` : base);
}

/** Start an in-platform chat from any attorney card or matcher result. */
export function startChatWithAttorney(
  attorney,
  { user, setShowAuth, setPage, canAccessMessaging = false }
) {
  if (!user) {
    setShowAuth(true);
    return;
  }

  if (!attorney?.userId) {
    toastError("Unable to start chat — attorney profile is missing a user ID.");
    return;
  }

  if (Number(attorney.userId) === Number(user.id)) {
    toastError("You cannot message your own profile.");
    goToDashboardChat("tab=profile");
    return;
  }

  if (!canAccessMessaging) {
    toastError(
      "Direct messaging requires ImmFlow Pro. Upgrade under Billing & Subscriptions."
    );
    goToDashboardChat("tab=billing");
    return;
  }

  const partner = {
    id: attorney.userId,
    name: attorney.name,
    initials: attorney.initials || "AT",
    email: attorney.email || attorney.contactEmail || "",
  };

  sessionStorage.setItem(PENDING_CHAT_KEY, JSON.stringify(partner));

  const params = new URLSearchParams({
    tab: "messages",
    chat: String(partner.id),
    chatName: partner.name,
    chatInitials: partner.initials,
  });
  if (partner.email) params.set("chatEmail", partner.email);

  // Full navigation so /attorneys/[id] profile route cannot block the dashboard
  goToDashboardChat(params.toString());

  // Fallback when assign is blocked (e.g. tests)
  if (typeof setPage === "function") {
    setPage("dashboard");
  }
}

export { PENDING_CHAT_KEY };
