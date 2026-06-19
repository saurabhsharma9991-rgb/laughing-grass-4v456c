import { prisma } from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return apiSuccess({
      status: "ok",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return apiError("Database connection failed.", 503, "SERVICE_UNAVAILABLE");
  }
}
