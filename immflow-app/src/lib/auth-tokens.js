import crypto from "crypto";

export function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
