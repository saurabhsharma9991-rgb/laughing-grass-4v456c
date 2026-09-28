import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { translateDeep } from "@/lib/services/auto-translate";

const PLATFORM_PREFIX = "platform.";

export async function GET(req) {
  try {
    const locale = new URL(req.url).searchParams.get("locale") || "en";
    const items = await prisma.siteContent.findMany({
      where: { NOT: { key: { startsWith: PLATFORM_PREFIX } } },
    });
    const config = {};
    for (const item of items) {
      config[item.key] =
        locale === "en" ? item.value : await translateDeep(item.value, locale);
    }
    return apiSuccess(config);
  } catch (error) {
    return handleApiError(error, "Failed to fetch content.");
  }
}
