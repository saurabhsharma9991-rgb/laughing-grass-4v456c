const USER_KEY = "immflow_user";
const TOKEN_KEY = "immflow_token";

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(user, token = null) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function authHeaders(extra = {}) {
  const token = getStoredToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
