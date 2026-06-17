import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError } from "@/lib/api/response";

export async function GET() {
  try {
    const items = await prisma.siteContent.findMany();
    const config = Object.fromEntries(items.map((item) => [item.key, item.value]));
    return apiSuccess(config);
  } catch (error) {
    return handleApiError(error, "Failed to fetch content.");
  }
}
