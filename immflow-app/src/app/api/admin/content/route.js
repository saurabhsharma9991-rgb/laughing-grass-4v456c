import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "cms", "view");
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
    await requireAdminPermission(req, "cms", "edit");
    const { updates } = await req.json();

    if (!updates || typeof updates !== "object") {
      return apiError("Updates map is required.", 400, "VALIDATION_ERROR");
    }

    const grouped = {};
    for (const [compoundKey, value] of Object.entries(updates)) {
      const [key, locale] = compoundKey.split("::");
      if (!grouped[key]) grouped[key] = { value: "", translations: {} };
      if (locale) grouped[key].translations[locale] = String(value);
      else grouped[key].value = String(value);
    }

    const results = await prisma.$transaction(
      Object.entries(grouped).map(([key, value]) =>
        prisma.siteContent.update({
          where: { key },
          data: {
            value: value.value,
            translations: value.translations,
          },
        })
      )
    );

    return apiSuccess({ success: true, count: results.length });
  } catch (error) {
    return handleApiError(error, "Failed to update site content.");
  }
}

export async function POST(req) {
  try {
    await requireAdminPermission(req, "cms", "create");
    const { key, value, type, section, label } = await req.json();
    if (!key?.trim() || !section?.trim() || !label?.trim()) {
      return apiError("key, section, and label are required.", 400, "VALIDATION_ERROR");
    }
    if (key.startsWith("platform.")) {
      return apiError("Cannot create platform settings keys via CMS.", 400, "VALIDATION_ERROR");
    }

    const item = await prisma.siteContent.create({
      data: {
        key: key.trim(),
        value: value != null ? String(value) : "",
        type: type || "text",
        section: section.trim(),
        label: label.trim(),
      },
    });
    return apiSuccess({ success: true, item }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create content field.");
  }
}

export async function DELETE(req) {
  try {
    await requireAdminPermission(req, "cms", "delete");
    const key = new URL(req.url).searchParams.get("key");
    if (!key) return apiError("Missing query parameter: key", 400, "VALIDATION_ERROR");
    if (key.startsWith("platform.")) {
      return apiError("Cannot delete platform settings keys via CMS.", 400, "VALIDATION_ERROR");
    }

    await prisma.siteContent.delete({ where: { key } });
    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete content field.");
  }
}
