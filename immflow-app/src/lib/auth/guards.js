import { extractAuthToken, verifyToken } from "./jwt.js";
import {
  getAdminAccessForUserId,
  assertAdminPermission,
} from "@/lib/services/admin-rbac.js";

export class AuthError extends Error {
  constructor(message, status = 401, code = "UNAUTHORIZED") {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

export function requireAuth(request) {
  const token = extractAuthToken(request);
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

/** Any admin panel user (legacy super admin or role-assigned staff). */
export async function requireAdmin(request) {
  const session = requireAuth(request);
  const access = await getAdminAccessForUserId(session.userId);
  return { session, access };
}

/** Admin with a specific resource permission. */
export async function requireAdminPermission(request, resource, action) {
  const { session, access } = await requireAdmin(request);
  assertAdminPermission(access, resource, action);
  return { session, access };
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
