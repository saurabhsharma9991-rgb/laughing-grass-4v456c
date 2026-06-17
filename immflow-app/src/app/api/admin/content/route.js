import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";

export async function GET(req) {
  try {
    requireAdmin(req);
    const items = await prisma.siteContent.findMany({
      where: { NOT: { key: { startsWith: "platform." } } },
      orderBy: [{ section: "asc" }, { label: "asc" }],
    });
    return apiSuccess(items);
  } catch (error) {
    return handleApiError(error, "Failed to fetch site content.");
  }
}

export async function PUT(req) {
  try {
    requireAdmin(req);
    const { updates } = await req.json();

    if (!updates || typeof updates !== "object") {
      return apiError("Updates map is required.", 400, "VALIDATION_ERROR");
    }

    const results = await prisma.$transaction(
      Object.entries(updates).map(([key, value]) =>
        prisma.siteContent.update({
          where: { key },
          data: { value: String(value) },
        })
      )
    );

    return apiSuccess({ success: true, count: results.length });
  } catch (error) {
    return handleApiError(error, "Failed to update site content.");
  }
}
