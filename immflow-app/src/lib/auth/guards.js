import { extractBearerToken, verifyToken } from "./jwt.js";

export class AuthError extends Error {
  constructor(message, status = 401, code = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

export function requireAuth(request) {
  const token = extractBearerToken(request);
  if (!token) {
    throw new AuthError("Missing authorization token.", 401, "MISSING_TOKEN");
  }

  try {
    const session = verifyToken(token);
    if (!session?.userId) {
      throw new AuthError("Invalid session token.", 401, "INVALID_TOKEN");
    }
    return session;
  } catch {
    throw new AuthError("Invalid or expired session token.", 401, "INVALID_TOKEN");
  }
}

export function requireAdmin(request) {
  const session = requireAuth(request);
  if (session.role !== "admin") {
    throw new AuthError("Admin privileges required.", 403, "FORBIDDEN");
  }
  return session;
}

export function requirePro(session) {
  if (!session.isPro) {
    throw new AuthError(
      "ImmFlow Pro subscription required.",
      403,
      "PRO_UPGRADE_REQUIRED"
    );
  }
  return session;
}
