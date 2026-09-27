import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";

function formatClient(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || user.email.split("@")[0],
    emailVerified: user.emailVerified,
    signupStatus: user.signupStatus,
    rejectionReason: user.rejectionReason,
    isPro: user.isPro,
    subscriptionPlan: user.subscriptionPlan,
    preferredLocale: user.preferredLocale,
    createdAt: user.createdAt,
    ordersCount: user._count?.translationOrdersAsClient || 0,
    bookingsCount: user._count?.serviceBookingsAsClient || 0,
    applicationsCount: user._count?.applications || 0,
  };
}

export async function GET(req) {
  try {
    await requireAdminPermission(req, "clients", "view");
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const status = searchParams.get("status") || "all";
    const plan = searchParams.get("plan") || "all";

    const where = { role: "public" };
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { displayName: { contains: q } },
      ];
    }
    if (status === "verified") where.emailVerified = true;
    if (status === "unverified") where.emailVerified = false;
    if (status === "pending") where.signupStatus = "pending";
    if (status === "rejected") where.signupStatus = "rejected";
    if (status === "approved") where.signupStatus = "approved";
    if (plan === "pro") where.isPro = true;
    if (plan === "free") where.isPro = false;

    const [clients, total, proCount, unverifiedCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 300,
        include: {
          _count: {
            select: {
              translationOrdersAsClient: true,
              serviceBookingsAsClient: true,
              applications: true,
            },
          },
        },
      }),
      prisma.user.count({ where: { role: "public" } }),
      prisma.user.count({ where: { role: "public", isPro: true } }),
      prisma.user.count({ where: { role: "public", emailVerified: false } }),
    ]);

    return apiSuccess({
      clients: clients.map(formatClient),
      total,
      proCount,
      unverifiedCount,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load clients.");
  }
}

export async function PATCH(req) {
  try {
    await requireAdminPermission(req, "clients", "edit");
    const body = await req.json();
    const id = Number(body.id);
    if (!id) return apiError("id is required.", 400, "VALIDATION_ERROR");

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true, displayName: true },
    });
    if (!existing || existing.role !== "public") {
      return apiError("Client not found.", 404, "NOT_FOUND");
    }

    const data = {};
    if (body.action === "grant_pro") {
      data.isPro = true;
      data.subscriptionPlan = "Pro (Admin)";
    } else if (body.action === "revoke_pro") {
      data.isPro = false;
      data.subscriptionPlan = "Free";
      data.promoUsed = null;
      data.subscriptionExpires = null;
    } else if (body.action === "approve") {
      data.signupStatus = "approved";
      data.rejectionReason = null;
    } else if (body.action === "reject") {
      data.signupStatus = "rejected";
      data.rejectionReason =
        body.reason?.trim() ||
        "Your client account was restricted by ImmFlow support.";
    } else if (body.action === "mark_verified") {
      data.emailVerified = true;
      data.verificationToken = null;
      if (!existing.signupStatus || existing.signupStatus === "pending") {
        data.signupStatus = "approved";
      }
    } else {
      return apiError("Unknown action.", 400, "VALIDATION_ERROR");
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            translationOrdersAsClient: true,
            serviceBookingsAsClient: true,
            applications: true,
          },
        },
      },
    });

    return apiSuccess({ success: true, client: formatClient(updated) });
  } catch (error) {
    return handleApiError(error, "Failed to update client.");
  }
}
