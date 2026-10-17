import path from "path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiError, handleApiError } from "@/lib/api/response";
import { requireAdminPermission } from "@/lib/auth/guards";
import { readUploadedFile } from "@/lib/uploads/disk";
import { UPLOAD_PREFIX } from "@/lib/services/verification-documents";

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

export async function GET(req, { params }) {
  try {
    await requireAdminPermission(req, "providers", "view");
    const { id } = await params;
    const credential = await prisma.providerCredential.findUnique({
      where: { id: Number(id) },
      select: { documentUrl: true, label: true },
    });
    if (!credential?.documentUrl?.startsWith(UPLOAD_PREFIX)) {
      return apiError("No uploaded document for this credential.", 404, "NOT_FOUND");
    }
    const relativePath = credential.documentUrl.slice(UPLOAD_PREFIX.length);
    const buf = await readUploadedFile(relativePath);
    const ext = path.extname(relativePath).toLowerCase();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": MIME_BY_EXT[ext] || "application/octet-stream",
        "Content-Disposition": `inline; filename="verification${ext}"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to open document.");
  }
}
