import { toastError } from "@/lib/client/alerts";
import { pathForPage } from "@/lib/constants/routes";
import { savePendingAction } from "@/lib/client/pending-action";

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
  if (!attorney?.userId) {
    toastError("Unable to start chat — attorney profile is missing a user ID.");
    return;
  }

  const partner = {
    id: attorney.userId,
    name: attorney.name,
    initials: attorney.initials || "AT",
    email: attorney.email || attorney.contactEmail || "",
  };

  if (!user) {
    savePendingAction("start_chat", { partner });
    setShowAuth({
      show: true,
      accountType: "seeker",
      intentLabel: `Enter your details to contact ${partner.name}.`,
    });
    return;
  }

  if (Number(attorney.userId) === Number(user.id)) {
    toastError("You cannot message your own profile.");
    goToDashboardChat("tab=profile");
    return;
  }

  if (user.role !== "public" && !canAccessMessaging) {
    toastError(
      "Direct messaging requires ImmFlow Pro. Upgrade under Billing & Subscriptions."
    );
    goToDashboardChat("tab=billing");
    return;
  }

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
