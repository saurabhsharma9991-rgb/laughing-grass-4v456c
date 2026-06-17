"use client";

import React, { useState, useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";

// Import pages
import HomePage from "@/components/pages/HomePage";
import AttorneysPage from "@/components/pages/AttorneysPage";
import JobsPage from "@/components/pages/JobsPage";
import NetworkPage from "@/components/pages/NetworkPage";
import MatcherPage from "@/components/pages/MatcherPage";
import PostPage from "@/components/pages/PostPage";
import Dashboard from "@/components/pages/Dashboard";
import {
  getStoredUser,
  getStoredToken,
  setStoredSession,
  clearStoredSession,
} from "@/lib/client/auth-storage";

export default function App() {
  const [page, setPage] = useState("home");
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signup");
  const [authResetToken, setAuthResetToken] = useState("");
  const [user, setUser] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    const savedUser = getStoredUser();
    const savedToken = getStoredToken();
    if (savedUser && savedToken) {
      setUser(savedUser);
    }

    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verify");
    const resetToken = params.get("reset");

    if (verifyToken) {
      fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verifyToken }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            alert(data.message);
            setAuthMode("login");
            setShowAuth(true);
          } else {
            alert(data.error?.message || "Email verification failed.");
          }
        })
        .catch(() => alert("Email verification failed. Please try again."));
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (resetToken) {
      setAuthResetToken(resetToken);
      setAuthMode("reset");
      setShowAuth(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Smooth scroll to top when changing pages
  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [page]);

  const handleAuth = (u, token) => {
    setStoredSession(u, token);
    setUser(u);
    if (u.role === "admin") {
      window.location.href = "/admin";
      return;
    }
    setPage("dashboard");
  };

  const handleLogout = () => {
    clearStoredSession();
    setUser(null);
    setPage("home");
  };

  const pages = {
    home: HomePage,
    attorneys: AttorneysPage,
    jobs: JobsPage,
    network: NetworkPage,
    matcher: MatcherPage,
    post: PostPage,
    dashboard: Dashboard,
  };

  const PageComponent = pages[page] || HomePage;

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text">
      <div ref={topRef} />
      
      <Nav
        page={page}
        setPage={setPage}
        user={user}
        setShowAuth={setShowAuth}
      />
      
      {showAuth && (
        <AuthModal
          onClose={() => {
            setShowAuth(false);
            setAuthResetToken("");
          }}
          onAuth={handleAuth}
          initialMode={authMode}
          resetToken={authResetToken}
        />
      )}
      
      <main className="flex-auto">
        <PageComponent
          setPage={setPage}
          user={user}
          setUser={setUser}
          setShowAuth={setShowAuth}
          onLogout={handleLogout}
        />
      </main>
      
      <Footer setPage={setPage} />
    </div>
  );
}
