const USER_KEY = "immflow_user";

function readUser(storage) {
  try {
    const raw = storage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** User profile cache — JWT lives in httpOnly cookie. localStorage survives new tabs. */
export function getStoredUser() {
  if (typeof window === "undefined") return null;
  return readUser(localStorage) || readUser(sessionStorage);
}

export function setStoredUser(user) {
  const raw = JSON.stringify(user);
  localStorage.setItem(USER_KEY, raw);
  sessionStorage.setItem(USER_KEY, raw);
}

/** @deprecated Use setStoredUser — kept for gradual migration */
export function setStoredSession(user) {
  setStoredUser(user);
}

export function clearStoredSession() {
  localStorage.removeItem(USER_KEY);
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
