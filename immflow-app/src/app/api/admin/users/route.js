import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validatePassword } from "@/lib/validators/auth";
import { formatAdminUserResponse } from "@/lib/services/admin-rbac";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "users", "view");
    const users = await prisma.user.findMany({
      where: { role: "admin" },
      include: { adminRole: true },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(users.map(formatAdminUserResponse));
  } catch (error) {
    return handleApiError(error, "Failed to fetch admin users.");
  }
}

export async function POST(req) {
  try {
    const { session } = await requireAdminPermission(req, "users", "create");
    const body = await req.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const displayName = body.displayName?.trim() || null;
    const adminRoleId = body.adminRoleId ? parseInt(body.adminRoleId, 10) : null;

    if (!email) return apiError("Email is required.", 400, "VALIDATION_ERROR");
    const passErr = validatePassword(password);
    if (passErr) return apiError(passErr, 400, "VALIDATION_ERROR");
    if (!adminRoleId || Number.isNaN(adminRoleId)) {
      return apiError("An admin role must be assigned.", 400, "VALIDATION_ERROR");
    }

    const role = await prisma.adminRole.findUnique({ where: { id: adminRoleId } });
    if (!role) return apiError("Selected role not found.", 400, "VALIDATION_ERROR");

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiError("A user with this email already exists.", 409, "EMAIL_EXISTS");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "admin",
        displayName,
        adminRoleId,
        emailVerified: true,
      },
      include: { adminRole: true },
    });

    return apiSuccess({ success: true, user: formatAdminUserResponse(user) }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create admin user.");
  }
}
