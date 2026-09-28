"use client";

import { useEffect, useState } from "react";
import {
  authFetch,
  clearStoredSession,
  getStoredUser,
  logoutSession,
  setStoredUser,
} from "@/lib/client/auth-storage";

/** Restore the logged-in user from the session cookie on pages outside AppShell. */
export function useRestoredSession() {
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = getStoredUser();
    if (cached) setUser(cached);

    (async () => {
      try {
        const res = await authFetch("/api/auth/me");
        const data = await res.json();
        if (cancelled) return;
        if (data.user) {
          setUser(data.user);
          setStoredUser(data.user);
        } else if (!res.ok) {
          clearStoredSession();
          setUser(null);
        }
      } catch {
        // Keep the cached user when the network request fails.
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await logoutSession();
    setUser(null);
  };

  return { user, sessionReady, logout };
}
