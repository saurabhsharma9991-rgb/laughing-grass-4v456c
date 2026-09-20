import { randomBytes } from "crypto";
import { mkdir, writeFile, unlink, readFile } from "fs/promises";
import path from "path";

export const UPLOAD_ROOT = path.resolve(
  process.env.UPLOAD_ROOT ||
    path.join(/* turbopackIgnore: true */ process.cwd(), "uploads")
);

export const TRANSLATION_UPLOAD_DIR = "translation-orders";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const MIME_BY_EXT = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
};

function detectedSignatureMime(buffer) {
  if (!buffer?.length) return null;
  if (buffer.subarray(0, 5).toString() === "%PDF-") return "application/pdf";
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
  ) {
    return "application/msword";
  }
  return null;
}

export function assertAllowedUpload({ mimeType, sizeBytes, originalName, buffer }) {
  if (!originalName || typeof originalName !== "string") {
    throw Object.assign(new Error("Missing file name."), { status: 400, code: "INVALID_FILE" });
  }
  if (sizeBytes > MAX_BYTES) {
    throw Object.assign(new Error("File exceeds 15 MB limit."), {
      status: 400,
      code: "FILE_TOO_LARGE",
    });
  }
  const extension = path.extname(originalName).toLowerCase();
  const extensionMime = MIME_BY_EXT[extension];
  const normalizedMime = String(mimeType || extensionMime || "").toLowerCase();
  if (!extensionMime || !normalizedMime || !ALLOWED_MIME.has(normalizedMime)) {
    throw Object.assign(
      new Error("File type not allowed. Use PDF, Word, image, or plain text."),
      { status: 400, code: "INVALID_MIME" }
    );
  }
  if (normalizedMime !== extensionMime) {
    throw Object.assign(new Error("File extension does not match its content type."), {
      status: 400,
      code: "MIME_MISMATCH",
    });
  }
  if (extension !== ".txt") {
    const signatureMime = detectedSignatureMime(buffer);
    if (signatureMime !== extensionMime) {
      throw Object.assign(new Error("File contents do not match the selected file type."), {
        status: 400,
        code: "INVALID_FILE_SIGNATURE",
      });
    }
  }
  return normalizedMime;
}

function safeExt(originalName) {
  const ext = path.extname(originalName || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext.slice(0, 10) || ".bin";
}

/** Persist a buffer under uploads/translation-orders/{orderId}/ */
export async function saveTranslationOrderFile({ orderId, originalName, mimeType, buffer }) {
  const validatedMime = assertAllowedUpload({
    mimeType,
    sizeBytes: buffer.length,
    originalName,
    buffer,
  });

  const storedName = `${Date.now()}-${randomBytes(8).toString("hex")}${safeExt(originalName)}`;
  const relativePath = path.join(TRANSLATION_UPLOAD_DIR, String(orderId), storedName);
  const absolutePath = path.join(UPLOAD_ROOT, relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    storedName,
    relativePath: relativePath.replace(/\\/g, "/"),
    sizeBytes: buffer.length,
    mimeType: validatedMime,
    originalName: originalName.slice(0, 180),
  };
}

export async function readUploadedFile(relativePath) {
  const absolutePath = path.resolve(UPLOAD_ROOT, relativePath);
  if (!absolutePath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) {
    throw Object.assign(new Error("Invalid file path."), { status: 400, code: "INVALID_PATH" });
  }
  return readFile(absolutePath);
}

export async function deleteUploadedFile(relativePath) {
  try {
    const absolutePath = path.resolve(UPLOAD_ROOT, relativePath);
    if (!absolutePath.startsWith(`${UPLOAD_ROOT}${path.sep}`)) return;
    await unlink(absolutePath);
  } catch {
    // ignore missing files
  }
}
