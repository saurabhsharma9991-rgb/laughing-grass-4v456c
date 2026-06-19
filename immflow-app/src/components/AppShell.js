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
import { pageForPath, pathForPage } from "@/lib/constants/routes";
import {
  getStoredUser,
  setStoredUser,
  clearStoredSession,
  logoutSession,
  authFetch,
} from "@/lib/client/auth-storage";

const PAGES = {
  home: HomePage,
  attorneys: AttorneysPage,
  jobs: JobsPage,
  network: NetworkPage,
  matcher: MatcherPage,
  post: PostPage,
  dashboard: Dashboard,
};

export default function AppShell({ initialPage, attorneyProfileId }) {
  const router = useRouter();
  const pathname = usePathname();
  const [page, setPage] = useState(initialPage || pageForPath(pathname));
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [authResetToken, setAuthResetToken] = useState("");
  const [authInitialError, setAuthInitialError] = useState("");
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const topRef = useRef(null);

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
          if (data.user) {
            setStoredUser(data.user);
            setUser(data.user);
            if (data.user.role === "admin") {
              window.location.href = "/admin";
              return;
            }
            navigate("dashboard");
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
      setTimeout(() => alert("Payment successful — welcome to ImmFlow Pro!"), 300);
    } else if (billing === "cancelled") {
      navigate("dashboard");
      window.history.replaceState({}, "", pathForPage("dashboard"));
    }
  }, [navigate]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const handleAuth = (u) => {
    setStoredUser(u);
    setUser(u);
    if (u.role === "admin") {
      window.location.href = "/admin";
      return;
    }
    navigate("dashboard");
  };

  const handleLogout = async () => {
    await logoutSession();
    setUser(null);
    navigate("home");
  };

  const PageComponent = PAGES[page] || HomePage;

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text">
      <div ref={topRef} />
      <TestModeBanner />

      <Nav page={page} navigate={navigate} user={user} setShowAuth={setShowAuth} />

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
        />
      )}

      <main className="flex-auto">
        {sessionReady ? (
          attorneyProfileId ? (
            <AttorneyProfilePage
              attorneyId={attorneyProfileId}
              user={user}
              setShowAuth={setShowAuth}
              setPage={navigate}
            />
          ) : (
            <PageComponent
              navigate={navigate}
              setPage={navigate}
              user={user}
              setUser={setUser}
              setShowAuth={setShowAuth}
              onLogout={handleLogout}
            />
          )
        ) : (
          <div className="text-center py-24 text-muted text-sm">Loading…</div>
        )}
      </main>

      <Footer navigate={navigate} setPage={navigate} />
    </div>
  );
}
