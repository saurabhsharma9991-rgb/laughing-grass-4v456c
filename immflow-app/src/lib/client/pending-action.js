const PENDING_ACTION_KEY = "immflow_pending_action";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function savePendingAction(type, payload = {}) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    PENDING_ACTION_KEY,
    JSON.stringify({ version: 1, type, payload, createdAt: Date.now() })
  );
}

export function getPendingAction() {
  if (typeof window === "undefined") return null;
  try {
    const action = JSON.parse(localStorage.getItem(PENDING_ACTION_KEY) || "null");
    if (
      !action?.type ||
      !action.createdAt ||
      Date.now() - Number(action.createdAt) > MAX_AGE_MS
    ) {
      clearPendingAction();
      return null;
    }
    return action;
  } catch {
    clearPendingAction();
    return null;
  }
}

export function clearPendingAction() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(PENDING_ACTION_KEY);
  }
}

export { PENDING_ACTION_KEY };
