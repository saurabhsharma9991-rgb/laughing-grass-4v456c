import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validatePassword } from "@/lib/validators/auth";
import {
  formatAdminUserResponse,
  isSuperAdminUser,
} from "@/lib/services/admin-rbac";

export async function PATCH(req, { params }) {
  try {
    const { session } = await requireAdminPermission(req, "users", "edit");
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return apiError("Invalid user id.", 400, "VALIDATION_ERROR");

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { adminRole: true },
    });
    if (!existing || existing.role !== "admin") {
      return apiError("Admin user not found.", 404, "NOT_FOUND");
    }

    if (isSuperAdminUser(existing) && session.userId !== existing.id) {
      const actor = await prisma.user.findUnique({
        where: { id: session.userId },
        include: { adminRole: true },
      });
      if (!isSuperAdminUser(actor)) {
        return apiError("Only super admins can edit other super admins.", 403, "FORBIDDEN");
      }
    }

    const body = await req.json();
    const data = {};

    if (body.displayName !== undefined) data.displayName = body.displayName?.trim() || null;
    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      if (!email) return apiError("Email cannot be empty.", 400, "VALIDATION_ERROR");
      const dup = await prisma.user.findFirst({ where: { email, NOT: { id } } });
      if (dup) return apiError("Email already in use.", 409, "EMAIL_EXISTS");
      data.email = email;
    }
    if (body.password) {
      const passErr = validatePassword(body.password);
      if (passErr) return apiError(passErr, 400, "VALIDATION_ERROR");
      data.passwordHash = await bcrypt.hash(body.password, 10);
    }
    if (body.adminRoleId !== undefined) {
      if (isSuperAdminUser(existing) && !body.adminRoleId) {
        return apiError("Super admin must keep a role assigned.", 400, "VALIDATION_ERROR");
      }
      const roleId = parseInt(body.adminRoleId, 10);
      const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
      if (!role) return apiError("Role not found.", 400, "VALIDATION_ERROR");
      data.adminRoleId = roleId;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      include: { adminRole: true },
    });

    return apiSuccess({ success: true, user: formatAdminUserResponse(user) });
  } catch (error) {
    return handleApiError(error, "Failed to update admin user.");
  }
}

export async function DELETE(req, { params }) {
  try {
    const { session } = await requireAdminPermission(req, "users", "delete");
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return apiError("Invalid user id.", 400, "VALIDATION_ERROR");

    if (id === session.userId) {
      return apiError("You cannot delete your own account.", 400, "CANNOT_DELETE_SELF");
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { adminRole: true },
    });
    if (!existing || existing.role !== "admin") {
      return apiError("Admin user not found.", 404, "NOT_FOUND");
    }

    const superAdminCount = await prisma.user.count({
      where: {
        role: "admin",
        OR: [{ adminRoleId: null }, { adminRole: { slug: "super_admin" } }],
      },
    });
    if (isSuperAdminUser(existing) && superAdminCount <= 1) {
      return apiError("Cannot delete the last super admin.", 400, "LAST_SUPER_ADMIN");
    }

    await prisma.user.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete admin user.");
  }
}
