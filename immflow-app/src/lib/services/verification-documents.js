import { AuthError } from "@/lib/auth/guards.js";
import { assertAllowedUpload, saveVerificationFile } from "@/lib/uploads/disk";

export const UPLOAD_PREFIX = "upload:";

/** Attorneys and psychological providers must upload proof at signup; others may. */
export function requiresVerificationDocument(categorySlug) {
  return categorySlug === "attorney" || categorySlug === "psychological";
}

/**
 * Decode and validate `{ name, mime_type, data_base64 }` from a signup payload.
 * Returns null when nothing was attached.
 */
export function parseVerificationDocument(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = String(raw.name || "").trim();
  const base64 = String(raw.data_base64 || "").replace(/^data:[^;]+;base64,/, "");
  if (!name || !base64) return null;
  const buffer = Buffer.from(base64, "base64");
  try {
    const mimeType = assertAllowedUpload({
      mimeType: raw.mime_type,
      sizeBytes: buffer.length,
      originalName: name,
      buffer,
    });
    return { originalName: name, mimeType, buffer };
  } catch (error) {
    throw new AuthError(
      `Verification document: ${error.message}`,
      error.status || 400,
      error.code || "INVALID_FILE"
    );
  }
}

export function assertVerificationDocument(categorySlug, doc, label) {
  if (requiresVerificationDocument(categorySlug) && !doc) {
    throw new AuthError(
      `Upload a verification document for ${label} (license, bar card, or certificate).`,
      400,
      "VERIFICATION_DOCUMENT_REQUIRED"
    );
  }
}

/** Save the file and record it as a pending credential on the provider profile. */
export async function storeVerificationDocument(tx, { providerId, label, doc }) {
  if (!doc) return null;
  const saved = await saveVerificationFile({
    providerId,
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    buffer: doc.buffer,
  });
  return tx.providerCredential.create({
    data: {
      providerId,
      label,
      status: "pending",
      documentUrl: `${UPLOAD_PREFIX}${saved.relativePath}`,
      notes: `Uploaded at signup: ${saved.originalName} (${saved.mimeType})`,
    },
  });
}
