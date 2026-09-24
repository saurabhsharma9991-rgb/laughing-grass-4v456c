"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import TestModeBanner from "@/components/TestModeBanner";
import HomePage from "@/components/pages/HomePage";
import AttorneysPage from "@/components/pages/AttorneysPage";
import JobsPage from "@/components/pages/JobsPage";
import NetworkPage from "@/components/pages/NetworkPage";
import MatcherPage from "@/components/pages/MatcherPage";
import PostPage from "@/components/pages/PostPage";
import Dashboard from "@/components/pages/Dashboard";
import AttorneyProfilePage from "@/components/pages/AttorneyProfilePage";
import ServicesPage from "@/components/pages/ServicesPage";
import ServiceCategoryPage from "@/components/pages/ServiceCategoryPage";
import ProviderProfilePage from "@/components/pages/ProviderProfilePage";
import {
  pageForPath,
  pathForPage,
  serviceSlugFromPath,
  providerIdFromPath,
} from "@/lib/constants/routes";
import {
  getStoredUser,
  setStoredUser,
  clearStoredSession,
  logoutSession,
  authFetch,
} from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { clearPendingAction, getPendingAction } from "@/lib/client/pending-action";
import { PENDING_CHAT_KEY } from "@/lib/client/start-chat";

const PAGES = {
  home: HomePage,
  services: ServicesPage,
  attorneys: AttorneysPage,
  jobs: JobsPage,
  network: NetworkPage,
  matcher: MatcherPage,
  post: PostPage,
  dashboard: Dashboard,
};

export default function AppShell({
  initialPage,
  attorneyProfileId,
  serviceCategorySlug,
  providerProfileId,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(initialPage || pageForPath(pathname));
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [authResetToken, setAuthResetToken] = useState("");
  const [authInitialError, setAuthInitialError] = useState("");
  const [authAccountType, setAuthAccountType] = useState("seeker");
  const [authIntentLabel, setAuthIntentLabel] = useState("");
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const topRef = useRef(null);

  const categorySlug = serviceCategorySlug || serviceSlugFromPath(pathname);
  const providerId = providerProfileId || providerIdFromPath(pathname);

  const navigate = useCallback(
    (nextPage) => {
      const path = pathForPage(nextPage);
      setPage(nextPage);
      if (pathname !== path) {
        router.push(path);
      }
    },
    [router, pathname]
  );

  const openAuth = useCallback((value = true) => {
    if (value && typeof value === "object") {
      setAuthAccountType(value.accountType || "seeker");
      setAuthIntentLabel(value.intentLabel || "");
      setAuthMode(value.mode || "signup");
      setShowAuth(value.show !== false);
      return;
    }
    setAuthIntentLabel("");
    setShowAuth(Boolean(value));
  }, []);

  const finishAuthentication = useCallback(
    async (authenticatedUser) => {
      setStoredUser(authenticatedUser);
      setUser(authenticatedUser);
      if (authenticatedUser.role === "admin") {
        window.location.href = "/admin";
        return;
      }

      const pending = getPendingAction();
      if (pending?.type === "apply_listing") {
        const res = await authFetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listingId: pending.payload.listingId,
            message: pending.payload.message || "",
          }),
        });
        const data = await res.json();
        if (res.ok && !data.error) {
          clearPendingAction();
          sessionStorage.setItem("immflow_dashboard_tab", "applications");
          toastSuccess("Your application was submitted.");
          navigate("dashboard");
          return;
        }
        if (res.status === 409) clearPendingAction();
        toastError(data.error?.message || "Your account is ready, but the application could not be submitted.");
        navigate("jobs");
        return;
      }

      if (pending?.type === "start_chat" && pending.payload?.partner?.id) {
        const partner = pending.payload.partner;
        sessionStorage.setItem(PENDING_CHAT_KEY, JSON.stringify(partner));
        clearPendingAction();
        const params = new URLSearchParams({
          tab: "messages",
          chat: String(partner.id),
          chatName: partner.name || "Professional",
          chatInitials: partner.initials || "PR",
        });
        if (partner.email) params.set("chatEmail", partner.email);
        window.location.assign(`${pathForPage("dashboard")}?${params}`);
        return;
      }

      navigate("dashboard");
    },
    [navigate]
  );

  useEffect(() => {
    const fromPath = pageForPath(pathname);
    if (fromPath !== page) {
      setPage(fromPath);
    }
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const cached = getStoredUser();
      if (cached) setUser(cached);

      try {
        const res = await authFetch("/api/auth/me");
        const data = await res.json();
        if (!cancelled) {
          if (data.user) {
            setUser(data.user);
            setStoredUser(data.user);
          } else if (!res.ok) {
            clearStoredSession();
            setUser(null);
          }
        }
      } catch {
        // Offline — keep cached user if any
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("reset");
    const verifyToken = params.get("verify");
    const billing = params.get("billing");

    if (resetToken) {
      setAuthResetToken(resetToken);
      setAuthMode("reset");
      setShowAuth(true);
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (verifyToken) {
      window.history.replaceState({}, "", window.location.pathname);
      (async () => {
        try {
          const res = await fetch("/api/auth/verify-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ token: verifyToken }),
          });
          const data = await res.json();
          if (data.pendingApproval) {
            toastSuccess(
              data.message ||
                "Email verified. Your account is pending admin approval — we'll notify you when you can log in."
            );
            setAuthMode("login");
            setShowAuth(true);
            return;
          }
          if (data.user) {
            await finishAuthentication(data.user);
          } else {
            setAuthInitialError(data.error?.message || "Invalid or expired verification link.");
            setAuthMode("verify");
            setShowAuth(true);
          }
        } catch {
          setAuthInitialError("Could not verify your email. Please try again or resend the link.");
          setAuthMode("verify");
          setShowAuth(true);
        }
      })();
    }

    if (billing === "success") {
      navigate("dashboard");
      window.history.replaceState({}, "", pathForPage("dashboard"));
      setTimeout(() => toastSuccess("Payment successful — welcome to ImmFlow Pro!"), 300);
    } else if (billing === "cancelled") {
      navigate("dashboard");
      window.history.replaceState({}, "", pathForPage("dashboard"));
    }
  }, [finishAuthentication, navigate]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page, categorySlug, providerId, attorneyProfileId]);

  const handleAuth = (u) => finishAuthentication(u);

  const handleLogout = async () => {
    await logoutSession();
    setUser(null);
    navigate("home");
  };

  const PageComponent = PAGES[page] || HomePage;
  const initialQ =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("q") || ""
      : "";

  let mainContent = null;
  if (!sessionReady) {
    mainContent = <div className="text-center py-24 text-muted text-sm">Loading…</div>;
  } else if (attorneyProfileId) {
    mainContent = (
      <AttorneyProfilePage
        attorneyId={attorneyProfileId}
        user={user}
        setShowAuth={openAuth}
        setPage={navigate}
      />
    );
  } else if (providerId) {
    mainContent = (
      <ProviderProfilePage
        providerId={providerId}
        user={user}
        setShowAuth={openAuth}
        setPage={navigate}
      />
    );
  } else if (page === "serviceCategory" && categorySlug) {
    mainContent = (
      <ServiceCategoryPage
        categorySlug={categorySlug}
        initialQuery={initialQ}
        setPage={navigate}
        user={user}
        setShowAuth={openAuth}
      />
    );
  } else {
    mainContent = (
      <PageComponent
        navigate={navigate}
        setPage={navigate}
        user={user}
        setUser={setUser}
        setShowAuth={openAuth}
        onLogout={handleLogout}
        initialQuery={initialQ}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text">
      <div ref={topRef} />
      <TestModeBanner />

      <Nav page={page} navigate={navigate} user={user} setShowAuth={openAuth} />

      {showAuth && (
        <AuthModal
          onClose={() => {
            setShowAuth(false);
            setAuthResetToken("");
            setAuthInitialError("");
          }}
          onAuth={handleAuth}
          initialMode={authMode}
          resetToken={authResetToken}
          initialError={authInitialError}
          initialAccountType={authAccountType}
          intentLabel={authIntentLabel}
        />
      )}

      <main className="flex-auto">{mainContent}</main>

      <Footer navigate={navigate} setPage={navigate} />
    </div>
  );
}
