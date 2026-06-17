const USER_KEY = "immflow_user";

/** User profile cache only — JWT lives in httpOnly cookie. */
export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

/** @deprecated Use setStoredUser — kept for gradual migration */
export function setStoredSession(user) {
  setStoredUser(user);
}

export function clearStoredSession() {
  sessionStorage.removeItem(USER_KEY);
}

export async function logoutSession() {
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  } catch {
    // best-effort
  }
  clearStoredSession();
}

/** Authenticated fetch — relies on httpOnly session cookie. */
export async function authFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "same-origin",
    headers: {
      ...(options.headers || {}),
    },
  });
}

export function authHeaders(extra = {}) {
  return { ...extra };
}
