import React, { useState, useEffect } from "react";
import { authHeaders, setStoredSession } from "@/lib/client/auth-storage";
import ProfileEditor from "./ProfileEditor";
import { usePlatform } from "@/components/PlatformContext";
import { PROMO_CODE_TEST } from "@/lib/constants/platform-features";

export default function Dashboard({ user, setUser, onLogout, setPage }) {
  const { testMode, canAccess, freeListingLimit } = usePlatform();
  const hasMessaging = canAccess("direct_messaging", user?.isPro);
  const hasMatcher = canAccess("ai_matcher", user?.isPro);
  const hasUnlimitedListings = canAccess("unlimited_listings", user?.isPro);
  // Attorney tabs: overview, messages, billing
  const [userTab, setUserTab] = useState("overview");
  const [listingCount, setListingCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);

  // Subscription state
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [activatingSubscription, setActivatingSubscription] = useState(false);

  // Chat State
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/messages", {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.error) {
        setConversations(data);
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    }
  };

  const loadChatHistory = async (contactId) => {
    try {
      const res = await fetch(`/api/messages?userId=${contactId}`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.error) {
        setChatMessages(data);
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeConversation) return;

    setSendingMessage(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          receiverId: activeConversation.contact.id,
          content: chatInput
        })
      });
      const data = await res.json();
      
      if (data.error) {
        alert(data.error?.message || data.message || "Failed to send message.");
      } else {
        setChatInput("");
        setChatMessages([...chatMessages, data]);
        loadConversations();
      }
    } catch (e) {
      console.error(e);
      alert("Failed to send message. Connection error.");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        `Are you sure you want to cancel your ImmFlow Pro subscription? Your listings limit will return to ${freeListingLimit}, and premium features may be locked.`
      )
    ) {
      return;
    }
    setCancellingSubscription(true);
    try {
      const res = await fetch("/api/user/subscription", {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        const updatedUser = { ...user, isPro: false, subscriptionPlan: "Free" };
        setUser(updatedUser);
        setStoredSession(updatedUser);
        alert("Subscription cancelled successfully. You are now on the Free tier.");
      } else {
        alert("Cancellation failed: " + (data.error?.message || "Unknown error"));
      }
    } catch (e) {
      alert("Cancellation failed. Connection error.");
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleTestUpgrade = async (body) => {
    setActivatingSubscription(true);
    try {
      const res = await fetch("/api/user/subscription", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        setStoredSession(updatedUser);
        alert("Upgraded to Pro (test mode).");
      } else {
        alert(data.error?.message || "Upgrade failed.");
      }
    } catch {
      alert("Upgrade failed. Connection error.");
    } finally {
      setActivatingSubscription(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetch("/api/listings")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setListingCount(
              data.filter((l) => l.postedById === user.id).length
            );
          }
        })
        .catch(() => {});

      fetch("/api/applications", { headers: authHeaders() })
        .then((r) => r.json())
        .then((data) => {
          if (!data.error && typeof data.count === "number") {
            setApplicationCount(data.count);
          }
        })
        .catch(() => {});

      fetch("/api/user/subscription", { headers: authHeaders() })
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
            setStoredSession(updated);
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadConversations();
      
      // Check if we were redirected to message someone
      const pendingChat = localStorage.getItem("immflow_chat_partner");
      if (pendingChat) {
        try {
          const partner = JSON.parse(pendingChat);
          setUserTab("messages");
          
          // Set active conversation
          const conversationWrapper = {
            contact: {
              id: partner.id,
              name: partner.name,
              initials: partner.initials || "AT",
              email: partner.email || ""
            },
            lastMessage: "Conversation started",
            sentAt: new Date()
          };
          
          setActiveConversation(conversationWrapper);
          loadChatHistory(partner.id);
          
          // Clear trigger
          localStorage.removeItem("immflow_chat_partner");
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user, userTab]);

  useEffect(() => {
    if (activeConversation) {
      loadChatHistory(activeConversation.contact.id);
      
      const poll = setInterval(() => {
        loadChatHistory(activeConversation.contact.id);
      }, 5000);
      
      return () => clearInterval(poll);
    }
  }, [activeConversation]);

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
        {[
          ["overview", "🏠 Dashboard"],
          ["profile", "👤 My profile"],
          ["messages", "💬 Chat & Messages"],
          ["billing", "💳 Billing & Subscriptions"],
        ].map(([tabKey, label]) => {
          const isSel = userTab === tabKey;
          return (
            <button
              key={tabKey}
              onClick={() => setUserTab(tabKey)}
              className={`py-2.5 px-4 rounded-xl border text-[13px] font-semibold cursor-pointer shadow-sm transition-all duration-200 whitespace-nowrap ${
                isSel
                  ? "border-green bg-green text-white"
                  : "border-[rgba(0,0,0,0.09)] bg-white text-muted hover:text-text"
              }`}
            >
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
                  {user?.user_metadata?.full_name || "Attorney"}
                </div>
                <div className="text-[13px] text-muted">{user?.email}</div>
                <div className="text-xs text-green mt-0.5">
                  ✓ ImmFlow member · Bar: {user?.user_metadata?.bar_state || "—"}{" "}
                  {user?.user_metadata?.bar_number || ""}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                [String(listingCount), "Active listings"],
                [String(applicationCount), "Applications"],
                ["0", "Profile views"],
              ].map(([n, l]) => (
                <div key={l} className="bg-bg rounded-lg p-4 text-center">
                  <div className="font-syne text-2xl font-extrabold text-text">
                    {n}
                  </div>
                  <div className="text-xs text-muted mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-6">
            {[
              {
                icon: "📋",
                title: "Post a listing",
                desc: "Post a hearing, job, or outsource request",
                action: () => setPage("post"),
              },
              {
                icon: "🔍",
                title: "Find attorneys",
                desc: "Browse the attorney network",
                action: () => setPage("attorneys"),
              },
              {
                icon: "✦",
                title: "AI matcher",
                desc: "Find the perfect match with AI",
                action: () => setPage("matcher"),
              },
              {
                icon: "💼",
                title: "Job board",
                desc: "Browse all immigration listings",
                action: () => setPage("jobs"),
              },
            ].map((f) => (
              <div
                key={f.title}
                onClick={f.action}
                className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-5 cursor-pointer flex gap-3 items-center shadow-sm hover:border-green-medium hover:shadow-md transition-all duration-300"
              >
                <div className="text-2xl shrink-0">{f.icon}</div>
                <div>
                  <div className="text-[15px] font-medium text-text mb-0.5">
                    {f.title}
                  </div>
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

      {/* Tab: Profile editor */}
      {userTab === "profile" && (
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-6 md:p-8 shadow-md">
          <ProfileEditor user={user} setUser={setUser} />
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
                          <div className="text-xs font-semibold text-text truncate">{c.contact.name}</div>
                          <div className="text-[10px] text-muted truncate">{c.lastMessage}</div>
                        </div>
                      </div>
                    );
                  })}
                  {conversations.length === 0 && (
                    <div className="text-center py-12 text-muted text-xs">
                      No active conversations. Click "Contact" on attorney profiles to start chatting.
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
                        <div className="text-xs font-semibold text-text">{activeConversation.contact.name}</div>
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
                      {hasMessaging ? (
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
                        <div className="w-full bg-amber-light border border-amber/40 p-2.5 rounded-lg text-[11px] text-[#633806] text-center">
                          🔒 Direct Messaging is locked for Free users.{" "}
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
              Billing &amp; Subscriptions
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
                      <li>
                        Maximum of {freeListingLimit} active job board listing
                        {freeListingLimit !== 1 ? "s" : ""}
                        {!hasUnlimitedListings && " (unless unlimited listings is enabled for your plan)"}
                      </li>
                      {!hasMatcher && <li>No access to the AI Matcher</li>}
                      {!hasMessaging && <li>Direct messaging locked</li>}
                    </ul>
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
                      <p className="text-sm text-muted leading-relaxed">
                        ImmFlow Pro ($29/month) unlocks premium features. Online checkout is coming
                        soon — contact{" "}
                        <a
                          href="mailto:support@myimmflow.com"
                          className="text-green font-medium hover:underline"
                        >
                          support@myimmflow.com
                        </a>{" "}
                        to upgrade.
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <ul className="text-xs text-muted space-y-1 pl-4 list-disc">
                      {hasUnlimitedListings && <li>Unlimited listings</li>}
                      {hasMatcher && <li>AI matcher access</li>}
                      {hasMessaging && <li>Direct messaging</li>}
                    </ul>
                    {user.subscriptionExpires && (
                      <p className="text-[11px] text-green font-medium">
                        Access expires: {new Date(user.subscriptionExpires).toLocaleDateString()}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={handleCancelSubscription}
                      disabled={cancellingSubscription}
                      className="bg-transparent hover:bg-red-light text-red border border-red py-2 px-4 rounded-lg text-xs font-bold cursor-pointer transition-all w-fit"
                    >
                      {cancellingSubscription ? "Cancelling…" : "Downgrade to Free"}
                    </button>
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
