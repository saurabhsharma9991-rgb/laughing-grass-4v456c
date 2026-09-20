import { NextResponse } from "next/server";
import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/guards";
import {
  attachOrderFile,
  getOrderFileForDownload,
  deleteOrderFile,
} from "@/lib/services/translation-orders";
import { readUploadedFile } from "@/lib/uploads/disk";

export async function POST(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id } = await params;
    const form = await req.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "source");

    if (!file || typeof file === "string") {
      return apiError("file is required", 400, "VALIDATION");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await attachOrderFile({
      orderId: id,
      session,
      kind,
      originalName: file.name || "document",
      mimeType: file.type || null,
      buffer,
    });
    return apiSuccess(saved, 201);
  } catch (error) {
    return handleApiError(error, "Failed to upload file.");
  }
}

export async function GET(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id } = await params;
    const fileId = new URL(req.url).searchParams.get("fileId");
    if (!fileId) {
      return apiError("fileId required", 400, "VALIDATION");
    }

    const row = await getOrderFileForDownload(id, fileId, session);
    const buf = await readUploadedFile(row.relativePath);

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": row.mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(row.originalName)}"`,
        "Content-Length": String(buf.length),
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to download file.");
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = requireAuth(req);
    const { id } = await params;
    const fileId = new URL(req.url).searchParams.get("fileId");
    if (!fileId) {
      return apiError("fileId required", 400, "VALIDATION");
    }
    await deleteOrderFile(id, fileId, session);
    return apiSuccess({ ok: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete file.");
  }
}
