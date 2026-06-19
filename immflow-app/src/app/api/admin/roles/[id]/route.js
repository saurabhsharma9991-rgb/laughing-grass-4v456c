import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  formatRoleResponse,
  slugifyRoleName,
  validatePermissionsPayload,
} from "@/lib/services/admin-rbac";
import { SUPER_ADMIN_SLUG } from "@/lib/constants/admin-permissions";

export async function PATCH(req, { params }) {
  try {
    await requireAdminPermission(req, "roles", "edit");
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return apiError("Invalid role id.", 400, "VALIDATION_ERROR");

    const existing = await prisma.adminRole.findUnique({ where: { id } });
    if (!existing) return apiError("Role not found.", 404, "NOT_FOUND");

    const body = await req.json();
    const data = {};

    if (body.name !== undefined) data.name = body.name.trim() || existing.name;
    if (body.description !== undefined) data.description = body.description?.trim() || null;

    if (body.slug !== undefined && !existing.isSystem) {
      const slug = body.slug.trim();
      if (slug === SUPER_ADMIN_SLUG) {
        return apiError("This role slug is reserved.", 400, "VALIDATION_ERROR");
      }
      data.slug = slug;
    } else if (body.name !== undefined && !existing.isSystem && !body.slug) {
      data.slug = slugifyRoleName(data.name);
    }

    if (body.permissions !== undefined) {
      if (existing.isSystem) {
        return apiError("System roles cannot have permissions changed.", 403, "FORBIDDEN");
      }
      data.permissions = JSON.stringify(validatePermissionsPayload(body.permissions));
    }

    const role = await prisma.adminRole.update({
      where: { id },
      data,
      include: { _count: { select: { users: true } } },
    });

    return apiSuccess({ success: true, role: formatRoleResponse(role) });
  } catch (error) {
    return handleApiError(error, "Failed to update role.");
  }
}

export async function DELETE(req, { params }) {
  try {
    await requireAdminPermission(req, "roles", "delete");
    const { id: idParam } = await params;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) return apiError("Invalid role id.", 400, "VALIDATION_ERROR");

    const existing = await prisma.adminRole.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) return apiError("Role not found.", 404, "NOT_FOUND");
    if (existing.isSystem) {
      return apiError("System roles cannot be deleted.", 403, "FORBIDDEN");
    }
    if (existing._count.users > 0) {
      return apiError("Remove all users from this role before deleting it.", 400, "ROLE_IN_USE");
    }

    await prisma.adminRole.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error, "Failed to delete role.");
  }
}
