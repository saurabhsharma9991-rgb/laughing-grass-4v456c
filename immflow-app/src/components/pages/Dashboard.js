import React, { useState, useEffect, useCallback, useRef } from "react";
import { authFetch, setStoredUser } from "@/lib/client/auth-storage";
import { confirmDialog, toastError, toastSuccess } from "@/lib/client/alerts";
import { PENDING_CHAT_KEY } from "@/lib/client/start-chat";
import { pathForPage } from "@/lib/constants/routes";
import ProfileEditor from "./ProfileEditor";
import ProviderProfileEditor from "./ProviderProfileEditor";
import ListingManager from "./ListingManager";
import MyApplications from "./MyApplications";
import TranslationOrdersPanel from "./TranslationOrdersPanel";
import TranslationOrderForm from "@/components/TranslationOrderForm";
import BookingsPanel from "./BookingsPanel";
import BookingRequestForm from "@/components/BookingRequestForm";
import AddServicePanel from "./AddServicePanel";
import { accountCapabilities, capabilityLabel } from "@/lib/constants/account-capabilities";
import { Icon } from "@/components/icons/Icon";
import { usePlatform } from "@/components/PlatformContext";
import { PROMO_CODE_TEST } from "@/lib/constants/platform-features";
import { useI18n } from "@/components/I18nProvider";

export default function Dashboard({ user, setUser, onLogout, setPage }) {
  const { t } = useI18n();
  const {
    testMode,
    canAccess,
    freeListingLimit,
    subscriptionPriceLabel,
    subscriptionPriceCadence,
    commissionPercentFree,
    commissionPercentPro,
  } = usePlatform();
  const hasMessaging = canAccess("direct_messaging", user?.isPro);
  const hasMatcher = canAccess("ai_matcher", user?.isPro);
  const hasUnlimitedListings = canAccess("unlimited_listings", user?.isPro);
  const hasPriorityContact = canAccess("priority_contact", user?.isPro);
  const isClient = user?.role === "public";
  const caps = accountCapabilities(user);
  const [userTab, setUserTab] = useState("overview");
  const [bookingsRefresh, setBookingsRefresh] = useState(0);
  const [listingCount, setListingCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [myApplications, setMyApplications] = useState([]);

  // Subscription state
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [activatingSubscription, setActivatingSubscription] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Chat State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatBootstrapped = useRef(false);

  // Client↔professional intake works on Free; peer professional chat needs Pro
  const canComposeMessage =
    hasMessaging ||
    isClient ||
    activeConversation?.contact?.role === "public";


  const loadConversations = useCallback(async () => {
    try {
      const res = await authFetch("/api/messages");
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    }
  }, []);

  const loadChatHistory = useCallback(async (contactId) => {
    try {
      const res = await authFetch(`/api/messages?userId=${contactId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setChatMessages(data);
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConversation) return;

    setSendingMessage(true);
    try {
      const res = await authFetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: activeConversation.contact.id,
          content: chatInput,
        }),
      });
      const data = await res.json();
      
      if (data.error) {
        toastError(data.error?.message || data.message || "Failed to send message.");
      } else if (data.id) {
        setChatInput("");
        setChatMessages((prev) => [...prev, data]);
        loadConversations();
      } else {
        toastError("Failed to send message.");
      }
    } catch (e) {
      console.error(e);
      toastError("Failed to send message. Connection error.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = await confirmDialog({
      title: "Cancel subscription",
      message: `Are you sure you want to cancel your ImmFlow Pro subscription? Your listings limit will return to ${freeListingLimit}, and premium features may be locked.`,
      confirmLabel: "Yes, cancel",
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    setCancellingSubscription(true);
    try {
      const res = await authFetch("/api/user/subscription", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, isPro: false, subscriptionPlan: "Free" };
        setUser(updatedUser);
        setStoredUser(updatedUser);
        toastSuccess("Subscription cancelled successfully. You are now on the Free tier.");
      } else {
        toastError("Cancellation failed: " + (data.error?.message || "Unknown error"));
      }
    } catch (e) {
      toastError("Cancellation failed. Connection error.");
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleTestUpgrade = async (body) => {
    setActivatingSubscription(true);
    try {
      const res = await authFetch("/api/user/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        setStoredUser(updatedUser);
        toastSuccess(testMode ? "Upgraded to Pro (test mode)." : "Promo applied — welcome to ImmFlow Pro!");
      } else {
        toastError(data.error?.message || "Upgrade failed.");
      }
    } catch {
      toastError("Upgrade failed. Connection error.");
    } finally {
      setActivatingSubscription(false);
    }
  };

  const handleStripeCheckout = async () => {
    setStartingCheckout(true);
    try {
      const res = await authFetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toastError(data.error?.message || "Unable to start checkout. Contact support@myimmflow.com.");
    } catch {
      toastError("Unable to start checkout. Connection error.");
    } finally {
      setStartingCheckout(false);
    }
  };

  const handleBillingPortal = async () => {
    setOpeningPortal(true);
    try {
      const res = await authFetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      toastError(data.error?.message || "Unable to open billing portal.");
    } catch {
      toastError("Unable to open billing portal.");
    } finally {
      setOpeningPortal(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("billing") === "success") {
      const sessionId = params.get("session_id");
      setUserTab("billing");
      window.history.replaceState({}, "", `${pathForPage("dashboard")}?tab=billing`);

      if (sessionId) {
        authFetch("/api/billing/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success && data.user) {
              setUser(data.user);
              setStoredUser(data.user);
              toastSuccess("ImmFlow Pro activated!");
            } else {
              toastError(
                data.error?.message ||
                  "Payment received — refresh if Pro is not active yet."
              );
            }
          })
          .catch(() => {
            toastError("Payment received — refresh if Pro is not active yet.");
          });
      } else {
        toastSuccess("Payment received! Pro may take a moment to activate.");
      }
    }
  }, [user?.id, setUser]);

  useEffect(() => {
    if (!user?.id || chatBootstrapped.current) return;

    const params = new URLSearchParams(window.location.search);
    const chatId = params.get("chat");
    const tab = params.get("tab");

    if (tab && params.get("billing") !== "success") setUserTab(tab);

    const openPartner = (partner) => {
      if (Number.isNaN(Number(partner.id))) return;
      chatBootstrapped.current = true;
      setUserTab("messages");
      setActiveConversation({
        contact: {
          id: partner.id,
          name: partner.name,
          initials: partner.initials || "AT",
          email: partner.email || "",
          role: partner.role || undefined,
        },
        lastMessage: "Conversation started",
        sentAt: new Date(),
      });
      loadChatHistory(partner.id);
    };

    if (chatId) {
      openPartner({
        id: parseInt(chatId, 10),
        name: params.get("chatName") || "Attorney",
        initials: params.get("chatInitials") || "AT",
        email: params.get("chatEmail") || "",
      });
      window.history.replaceState({}, "", pathForPage("dashboard"));
      return;
    }

    const raw = sessionStorage.getItem(PENDING_CHAT_KEY);
    if (raw) {
      try {
        openPartner(JSON.parse(raw));
      } catch (e) {
        console.error(e);
        sessionStorage.removeItem(PENDING_CHAT_KEY);
      }
      return;
    }

    const pendingTab = sessionStorage.getItem("immflow_dashboard_tab");
    if (pendingTab) {
      setUserTab(pendingTab);
      sessionStorage.removeItem("immflow_dashboard_tab");
    }
  }, [user?.id, loadChatHistory]);

  useEffect(() => {
    if (!activeConversation?.contact?.id) return;
    const raw = sessionStorage.getItem(PENDING_CHAT_KEY);
    if (!raw) return;
    try {
      const partner = JSON.parse(raw);
      if (Number(partner.id) === Number(activeConversation.contact.id)) {
        sessionStorage.removeItem(PENDING_CHAT_KEY);
      }
    } catch {
      sessionStorage.removeItem(PENDING_CHAT_KEY);
    }
  }, [activeConversation]);

  useEffect(() => {
    if (user?.id && userTab === "messages") {
      loadConversations();
      authFetch("/api/auth/me")
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            setStoredUser(data.user);
          }
        })
        .catch(() => {});
    }
  }, [user?.id, userTab, loadConversations, setUser]);

  useEffect(() => {
    if (user?.id) {
      authFetch("/api/user/listings")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setListingCount(data.length);
          }
        })
        .catch(() => {});

      authFetch("/api/applications")
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) {
            const apps = data.applications || [];
            setMyApplications(apps);
            setApplicationCount(apps.length);
          }
        })
        .catch(() => {});

      authFetch("/api/user/subscription")
        .then((r) => r.json())
        .then((data) => {
          if (!data.error && data.isPro !== user.isPro) {
            const updated = {
              ...user,
              isPro: data.isPro,
              subscriptionPlan: data.subscriptionPlan,
              subscriptionExpires: data.subscriptionExpires,
            };
            setUser(updated);
            setStoredUser(updated);
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    if (!activeConversation?.contact?.id) return;

    loadChatHistory(activeConversation.contact.id);

    const poll = setInterval(() => {
      loadChatHistory(activeConversation.contact.id);
    }, 5000);

    return () => clearInterval(poll);
  }, [activeConversation?.contact?.id, loadChatHistory]);

  const getInitials = (u) => {
    const name = u?.user_metadata?.full_name || u?.email || "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(user);

  return (
    <div className="max-w-[900px] mx-auto my-8 px-6 font-dm-sans">
      {/* Navigation tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {(isClient
          ? [
              ["overview", t("dashboard.overview", "Dashboard"), "home"],
              ["orders", t("dashboard.translations", "Translations"), "document"],
              ["bookings", t("dashboard.bookings", "Bookings"), "calendar"],
              ["applications", t("dashboard.applications", "My applications"), "inbox"],
              ["messages", t("dashboard.messages", "Messages"), "chat"],
              ["profile", t("dashboard.profile", "My profile"), "user"],
              ["billing", t("dashboard.billing", "Billing"), "card"],
            ]
          : [
              ["overview", t("dashboard.overview", "Dashboard"), "home"],
              ...(caps.isAttorney
                ? [
                    ["listings", t("dashboard.listings", "My listings"), "clipboard"],
                    ["applications", t("dashboard.applications", "Applications"), "inbox"],
                  ]
                : []),
              ...(caps.offersTranslation || (user?.role === "provider" && caps.categories.length === 0)
                ? [["orders", t("dashboard.translations", "Translations"), "document"]]
                : []),
              ...(caps.offersBookings || (user?.role === "provider" && caps.categories.length === 0)
                ? [["bookings", t("dashboard.bookings", "Bookings"), "calendar"]]
                : []),
              ["messages", t("dashboard.messages", "Messages"), "chat"],
              ["profile", t("dashboard.profile", "My profile"), "user"],
              ["billing", t("dashboard.billing", "Billing"), "card"],
            ]
        ).map(([tabKey, label, icon]) => {
          const isSel = userTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setUserTab(tabKey)}
              className={`inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border text-[13px] font-semibold cursor-pointer shadow-sm transition-all duration-200 whitespace-nowrap ${
                isSel
                  ? "border-green bg-green text-white"
                  : "border-[rgba(0,0,0,0.09)] bg-white text-muted hover:text-text"
              }`}
            >
              <Icon name={icon} className="w-4 h-4" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Overview — matches original basic project layout */}
      {userTab === "overview" && (
        <>
          <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-14 h-14 rounded-full bg-green-light text-green-dark flex items-center justify-center text-lg font-bold shrink-0">
                {initials}
              </div>
              <div>
                <div className="text-lg font-medium text-text">
                  {user?.user_metadata?.full_name || user?.email || "Your account"}
                </div>
                <div className="text-[13px] text-muted">{user?.email}</div>
                <div className="text-xs text-green mt-0.5">
                  {capabilityLabel(user)}
                  {caps.isAttorney && user?.user_metadata?.bar_state
                    ? ` · Bar: ${user.user_metadata.bar_state} ${user.user_metadata.bar_number || ""}`
                    : ""}
                </div>
              </div>
            </div>
            {caps.isAttorney && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  [String(listingCount), "My listings"],
                  [String(applicationCount), "Applications sent"],
                  [String(myApplications.filter((a) => a.status === "accepted").length), "Accepted"],
                ].map(([n, l]) => (
                  <div key={l} className="bg-bg rounded-lg p-4 text-center">
                    <div className="font-syne text-2xl font-extrabold text-text">{n}</div>
                    <div className="text-xs text-muted mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            {(isClient
              ? [
                  { icon: "document", title: "Translations", desc: "Request a translation or track an order", action: () => setUserTab("orders") },
                  { icon: "calendar", title: "Bookings", desc: "Interpreter and evaluation requests", action: () => setUserTab("bookings") },
                  { icon: "inbox", title: "My applications", desc: "Jobs you applied to", action: () => setUserTab("applications") },
                  { icon: "search", title: "Find services", desc: "Translators, interpreters, and evaluators", action: () => setPage("services") },
                  { icon: "scale", title: "Find attorneys", desc: "Browse verified attorneys", action: () => setPage("attorneys") },
                  { icon: "chat", title: "Messages", desc: "Conversations with professionals", action: () => setUserTab("messages") },
                ]
              : [
                  ...(caps.isAttorney
                    ? [
                        { icon: "clipboard", title: "My listings", desc: "Manage postings and review people who applied", action: () => setUserTab("listings") },
                        { icon: "inbox", title: "Applications I sent", desc: "Jobs you applied to on the board", action: () => setUserTab("applications") },
                        { icon: "briefcase", title: "Job board", desc: "Browse immigration listings", action: () => setPage("jobs") },
                        { icon: "users", title: "Network", desc: "Connect with other attorneys", action: () => setPage("network") },
                      ]
                    : []),
                  ...(caps.offersTranslation
                    ? [{ icon: "document", title: "Translation jobs", desc: "Orders assigned to you", action: () => setUserTab("orders") }]
                    : []),
                  ...(caps.offersBookings
                    ? [{ icon: "calendar", title: "Bookings", desc: "Incoming appointment requests", action: () => setUserTab("bookings") }]
                    : []),
                  { icon: "user", title: "My profile", desc: "Rates, languages, credentials, and extra services", action: () => setUserTab("profile") },
                  { icon: "chat", title: "Messages", desc: "Client conversations after payment", action: () => setUserTab("messages") },
                  { icon: "card", title: "Plan & commission", desc: user?.isPro ? `Pro · ${commissionPercentPro}% commission` : `Free · ${commissionPercentFree}% commission`, action: () => setUserTab("billing") },
                ]
            ).map((f) => (
              <div
                key={f.title}
                onClick={f.action}
                className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-5 cursor-pointer flex gap-3 items-center shadow-sm hover:border-green-medium hover:shadow-md transition-all duration-300"
              >
                <Icon name={f.icon} className="w-6 h-6 text-green shrink-0" />
                <div>
                  <div className="text-[15px] font-medium text-text mb-0.5">{f.title}</div>
                  <div className="text-xs text-muted">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={onLogout}
            className="bg-transparent text-red py-2.5 px-[22px] rounded-lg border border-red cursor-pointer text-[13px] font-medium transition-all duration-200 hover:bg-red-light"
          >
            Log out
          </button>
        </>
      )}

      {/* Tab: My listings */}
      {userTab === "listings" && (
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 shadow-md">
          <h2 className="font-syne text-lg font-bold text-text border-b border-[rgba(0,0,0,0.09)] pb-2.5 mb-6">
            My listings
          </h2>
          <p className="text-xs text-muted mb-4">
            Post jobs, review applicants, and update listing status — open, filled, or closed.
          </p>
          <ListingManager user={user} setPage={setPage} />
        </div>
      )}

      {userTab === "orders" && (
        <div className="space-y-6">
          {!caps.offersTranslation && user?.role !== "provider" && (
            <TranslationOrderForm
              user={user}
              onCreated={() => {
                /* panel below refreshes on next focus; force remount via key */
              }}
            />
          )}
          <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 shadow-md">
            <h2 className="font-syne text-lg font-bold text-text border-b border-[rgba(0,0,0,0.09)] pb-2.5 mb-6">
              {caps.offersTranslation ? "Translation jobs" : "My translation orders"}
            </h2>
            <TranslationOrdersPanel
              key={`orders-${user?.id}`}
              user={user}
              mode={caps.offersTranslation || user?.role === "provider" ? "provider" : "client"}
            />
          </div>
        </div>
      )}

      {userTab === "bookings" && (
        <div className="space-y-6">
          {!caps.offersBookings && user?.role !== "provider" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BookingRequestForm
                user={user}
                bookingType="interpreter"
                onCreated={() => setBookingsRefresh((n) => n + 1)}
              />
              <BookingRequestForm
                user={user}
                bookingType="psychological"
                onCreated={() => setBookingsRefresh((n) => n + 1)}
              />
            </div>
          )}
          <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 shadow-md">
            <h2 className="font-syne text-lg font-bold text-text border-b border-[rgba(0,0,0,0.09)] pb-2.5 mb-6">
              {caps.offersBookings ? "Incoming bookings" : "My bookings"}
            </h2>
            <BookingsPanel
              user={user}
              refreshKey={bookingsRefresh}
              mode={caps.offersBookings || user?.role === "provider" ? "provider" : "client"}
            />
          </div>
        </div>
      )}

      {userTab === "applications" && (
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 shadow-md">
          <h2 className="font-syne text-lg font-bold text-text border-b border-[rgba(0,0,0,0.09)] pb-2.5 mb-6">
            My applications
          </h2>
          <MyApplications setPage={setPage} />
        </div>
      )}

      {/* Tab: Profile editor */}
      {userTab === "profile" && (
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 shadow-md">
          {caps.categories.map((slug) => (
            <div key={slug} className="mb-8">
              <h2 className="font-syne text-lg font-bold text-text mb-4 capitalize">
                {slug === "psychological" ? "Psychological evaluation" : slug} profile
              </h2>
              <ProviderProfileEditor categorySlug={slug} />
            </div>
          ))}
          {caps.isAttorney && <ProfileEditor user={user} setUser={setUser} />}
          {!caps.isAttorney && caps.categories.length === 0 && (
            <div>
              <h2 className="font-syne text-lg font-bold">Account profile</h2>
              <p className="text-sm text-muted mt-2">
                Your service preferences and bookings are available in this dashboard.
              </p>
            </div>
          )}
          <AddServicePanel user={user} setUser={setUser} />
        </div>
      )}

      {/* Tab panel for messages & billing */}
      {(userTab === "messages" || userTab === "billing") && (
      <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 shadow-md min-h-[400px]">
        <div className="flex justify-end mb-4">
          <button
            onClick={onLogout}
            className="bg-transparent text-red py-1.5 px-3 rounded-lg border border-red cursor-pointer text-xs font-medium hover:bg-red-light transition-all"
          >
            Log out
          </button>
        </div>

        {userTab === "messages" && (
          <div>
            <h2 className="font-syne text-lg font-bold text-text border-b border-[rgba(0,0,0,0.09)] pb-2.5 mb-6">
              Secure In-Platform Messenger
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Active Conversations Sidebar */}
              <div className="border border-[rgba(0,0,0,0.09)] rounded-xl p-4 flex flex-col gap-2 min-h-[300px]">
                <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                  Active Chats
                </h3>
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[400px]">
                  {conversations.map((c) => {
                    const isSel = activeConversation?.contact?.id === c.contact.id;
                    return (
                      <div
                        key={c.contact.id}
                        onClick={() => {
                          setActiveConversation(c);
                          loadChatHistory(c.contact.id);
                        }}
                        className={`p-3 rounded-lg flex items-center gap-2.5 cursor-pointer transition-all ${
                          isSel ? "bg-green-light border border-green-medium" : "bg-bg hover:bg-bg/85 border border-transparent"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-green-medium text-green-dark flex items-center justify-center text-xs font-bold shrink-0">
                          {c.contact.initials || "??"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-text truncate flex items-center gap-1.5">
                            <span className="truncate">{c.contact.name}</span>
                            {c.contact.priorityClient && (
                              <span className="shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-light text-green-dark">
                                Pro
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted truncate">{c.lastMessage}</div>
                        </div>
                      </div>
                    );
                  })}
                  {conversations.length === 0 && (
                    <div className="text-center py-12 text-muted text-xs">
                      No active conversations. Click &quot;Contact&quot; on
                      provider profiles to start chatting.
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Feed Window */}
              <div className="md:col-span-2 border border-[rgba(0,0,0,0.09)] rounded-xl p-4 flex flex-col min-h-[350px]">
                {activeConversation ? (
                  <div className="flex flex-col flex-1">
                    {/* Header */}
                    <div className="border-b border-[rgba(0,0,0,0.09)] pb-2.5 mb-3 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-green text-white flex items-center justify-center text-xs font-bold">
                        {activeConversation.contact.initials || "??"}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-text flex items-center gap-1.5">
                          {activeConversation.contact.name}
                          {activeConversation.contact.priorityClient && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-light text-green-dark">
                              Priority Pro client
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted">{activeConversation.contact.email}</div>
                      </div>
                    </div>

                    {/* Messages Body */}
                    <div className="flex-1 overflow-y-auto max-h-[260px] p-2 flex flex-col gap-2.5 mb-3">
                      {chatMessages.map((msg) => {
                        const isOutgoing = msg.senderId === user.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[75%] p-3 rounded-xl text-xs ${
                              isOutgoing
                                ? "bg-green text-white self-end rounded-tr-none"
                                : "bg-bg text-text self-start rounded-tl-none"
                            }`}
                          >
                            <div>{msg.content}</div>
                            <div className={`text-[8px] mt-1 text-right ${isOutgoing ? "text-white/80" : "text-muted"}`}>
                              {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                      {chatMessages.length === 0 && (
                        <div className="text-center py-12 text-muted-high">
                          Type a message below to start the conversation.
                        </div>
                      )}
                    </div>

                    {/* Input Field */}
                    <form onSubmit={handleSendMessage} className="flex gap-2 mt-auto">
                      {canComposeMessage ? (
                        <>
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Type a secure message..."
                            className="flex-1 py-2 px-3 text-xs border border-[rgba(0,0,0,0.15)] rounded-lg bg-transparent text-text focus:outline-none focus:border-green"
                          />
                          <button
                            type="submit"
                            disabled={sendingMessage || !chatInput.trim()}
                            className="bg-green hover:bg-green-dark text-white font-semibold text-xs py-2 px-4 rounded-lg border-none cursor-pointer disabled:opacity-50"
                          >
                            Send
                          </button>
                        </>
                      ) : (
                        <div className="w-full bg-amber-light border border-amber/40 p-2.5 rounded-lg text-[11px] text-[#633806] text-center inline-flex items-center justify-center gap-1.5 flex-wrap">
                          <Icon name="lock" className="w-3.5 h-3.5" /> Professional peer messaging is Pro-only. Client contact still works on Free.{" "}
                          <button
                            type="button"
                            onClick={() => setUserTab("billing")}
                            className="bg-transparent border-none text-green hover:underline cursor-pointer font-bold ml-1"
                          >
                            Upgrade to Pro
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-muted text-xs">
                    Select a contact on the left sidebar to load chat history.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {userTab === "billing" && (
          <div>
            <h2 className="font-syne text-lg font-bold text-text border-b border-[rgba(0,0,0,0.09)] pb-2.5 mb-6">
              {t("dashboard.billing", "Billing & Subscriptions")}
            </h2>

            <div className="border border-[rgba(0,0,0,0.09)] rounded-xl p-6 max-w-xl">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Current Plan
              </h3>
              <div className="flex flex-col gap-4">
                <div>
                  <span className="text-xl font-bold text-text font-syne flex items-center gap-2">
                    {user?.isPro ? "ImmFlow Pro" : "Free Plan"}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${user?.isPro ? "bg-green-light text-green-dark" : "bg-bg text-muted"}`}>
                      {user?.isPro ? "Active" : "Standard"}
                    </span>
                  </span>
                  {user?.isPro && user.subscriptionPlan && (
                    <p className="text-xs text-muted mt-2">{user.subscriptionPlan}</p>
                  )}
                </div>

                {!user?.isPro ? (
                  <>
                    <ul className="text-xs text-muted space-y-1 pl-4 list-disc">
                      {isClient ? (
                        <>
                          <li>Browse attorneys and providers on Free</li>
                          <li>Request translations and bookings on Free</li>
                          {!hasMatcher && <li>AI attorney matcher locked</li>}
                          {!hasPriorityContact && (
                            <li>Priority contact with professionals locked</li>
                          )}
                        </>
                      ) : caps.isServiceProvider ? (
                        <>
                          {caps.isAttorney && (
                            <li>
                              Maximum of {freeListingLimit} active job board listing
                              {freeListingLimit !== 1 ? "s" : ""}
                            </li>
                          )}
                          <li>You can still accept paid orders on Free</li>
                          <li>ImmFlow keeps {commissionPercentFree}% of each paid order</li>
                          {!hasMessaging && <li>Peer messaging stays locked until Pro</li>}
                        </>
                      ) : (
                        <>
                          <li>You can still accept paid orders on Free</li>
                          <li>ImmFlow keeps {commissionPercentFree}% of each paid order</li>
                          {!hasMessaging && <li>Peer messaging stays locked until Pro</li>}
                        </>
                      )}
                    </ul>

                    {!isClient && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="border border-[rgba(0,0,0,0.1)] rounded-xl p-3 bg-bg">
                          <div className="text-[11px] font-semibold uppercase text-muted">Stay on Free</div>
                          <div className="font-syne text-lg font-bold text-text mt-1">
                            {commissionPercentFree}% commission
                          </div>
                          <p className="text-[11px] text-muted mt-1 leading-relaxed">
                            No subscription. You can still take paid orders. ImmFlow keeps{" "}
                            {commissionPercentFree}% of each paid marketplace order.
                          </p>
                        </div>
                        <div className="border border-green/40 rounded-xl p-3 bg-green-light/30">
                          <div className="text-[11px] font-semibold uppercase text-green-dark">
                            Pro + commission
                          </div>
                          <div className="font-syne text-lg font-bold text-text mt-1">
                            {commissionPercentPro}% commission
                          </div>
                          <p className="text-[11px] text-muted mt-1 leading-relaxed">
                            Pay ImmFlow Pro
                            {subscriptionPriceLabel
                              ? ` (${subscriptionPriceLabel}${subscriptionPriceCadence})`
                              : ""}{" "}
                            and ImmFlow keeps only {commissionPercentPro}% of each paid order, plus
                            Pro features.
                          </p>
                        </div>
                      </div>
                    )}
                    {testMode ? (
                      <div className="border border-amber/40 bg-amber-light rounded-lg p-4 space-y-3">
                        <p className="text-xs text-[#633806] font-semibold">
                          Test mode is on — use staging tools below to simulate Pro.
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder={`Promo code (e.g. ${PROMO_CODE_TEST})`}
                            className="flex-1 py-2 px-3 text-xs border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-text focus:outline-none focus:border-green"
                          />
                          <button
                            type="button"
                            disabled={activatingSubscription || !promoCode.trim()}
                            onClick={() => handleTestUpgrade({ promoCode: promoCode.trim() })}
                            className="bg-green hover:bg-green-dark text-white font-semibold text-xs py-2 px-4 rounded-lg border-none cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            Apply promo
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={activatingSubscription}
                          onClick={() => handleTestUpgrade({ activateStripe: true })}
                          className="bg-transparent hover:bg-bg text-text border border-[rgba(0,0,0,0.15)] text-xs py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          Simulate Stripe checkout
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted leading-relaxed">
                          ImmFlow Pro
                          {subscriptionPriceLabel
                            ? ` (${subscriptionPriceLabel}${subscriptionPriceCadence})`
                            : ""}{" "}
                          {isClient
                            ? "gives clients the AI attorney matcher and priority contact when reaching professionals."
                            : "unlocks premium features for attorneys and providers."}{" "}
                          Upgrade securely with Stripe, or contact{" "}
                          <a
                            href="mailto:support@myimmflow.com"
                            className="text-green font-medium hover:underline"
                          >
                            support@myimmflow.com
                          </a>
                          .
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            placeholder={`Promo code (e.g. ${PROMO_CODE_TEST})`}
                            className="flex-1 py-2 px-3 text-xs border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-text focus:outline-none focus:border-green"
                          />
                          <button
                            type="button"
                            disabled={activatingSubscription || !promoCode.trim()}
                            onClick={() => handleTestUpgrade({ promoCode: promoCode.trim() })}
                            className="bg-transparent hover:bg-bg text-text border border-[rgba(0,0,0,0.15)] text-xs py-2 px-4 rounded-lg cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            Apply promo
                          </button>
                        </div>
                        <button
                          type="button"
                          disabled={startingCheckout}
                          onClick={handleStripeCheckout}
                          className="bg-green hover:bg-green-dark text-white font-semibold text-sm py-2.5 px-5 rounded-lg border-none cursor-pointer disabled:opacity-50"
                        >
                          {startingCheckout
                            ? "Redirecting…"
                            : `Upgrade with Stripe${
                                subscriptionPriceLabel
                                  ? ` — ${subscriptionPriceLabel}${subscriptionPriceCadence}`
                                  : ""
                              }`}
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <ul className="text-xs text-muted space-y-1 pl-4 list-disc">
                      {isClient ? (
                        <>
                          {hasMatcher && <li>AI attorney matcher</li>}
                          {hasPriorityContact && (
                            <li>Priority contact with attorneys and providers</li>
                          )}
                          <li>All Free marketplace tools included</li>
                        </>
                      ) : (
                        <>
                          {hasUnlimitedListings && <li>Unlimited listings</li>}
                          {hasMatcher && <li>AI matcher access</li>}
                          {hasMessaging && <li>Direct messaging</li>}
                        </>
                      )}
                    </ul>
                    {!isClient && (
                      <div className="text-xs text-muted leading-relaxed bg-green-light/40 border border-green/20 rounded-lg px-3 py-2.5">
                        You are on Pro. Marketplace commission is {commissionPercentPro}% of each
                        paid service order (Free plan is {commissionPercentFree}%). Set rates under{" "}
                        <button
                          type="button"
                          onClick={() => setUserTab("profile")}
                          className="text-green font-semibold bg-transparent border-none cursor-pointer underline p-0"
                        >
                          My profile
                        </button>
                        .
                      </div>
                    )}
                    {user.subscriptionExpires && (
                      <p className="text-[11px] text-green font-medium">
                        Access expires: {new Date(user.subscriptionExpires).toLocaleDateString()}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {!testMode && (
                        <button
                          type="button"
                          onClick={handleBillingPortal}
                          disabled={openingPortal}
                          className="bg-green hover:bg-green-dark text-white border-none py-2 px-4 rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                        >
                          {openingPortal ? "Opening…" : "Manage subscription (Stripe)"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCancelSubscription}
                        disabled={cancellingSubscription}
                        className="bg-transparent hover:bg-red-light text-red border border-red py-2 px-4 rounded-lg text-xs font-bold cursor-pointer transition-all disabled:opacity-50"
                      >
                        {cancellingSubscription ? "Cancelling…" : "Downgrade to Free"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
