import jwt from "jsonwebtoken";

const DEV_FALLBACK = "immflow-local-development-secret-key-123456";

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production.");
  }
  return DEV_FALLBACK;
}

export function signToken(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d", ...options });
}

export function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

export function extractBearerToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7).trim();
}

/** Bearer header takes precedence; falls back to httpOnly session cookie. */
export function extractAuthToken(request) {
  const bearer = extractBearerToken(request);
  if (bearer) return bearer;

  const cookie = request.cookies?.get?.("immflow_session")?.value;
  return cookie?.trim() || null;
}
