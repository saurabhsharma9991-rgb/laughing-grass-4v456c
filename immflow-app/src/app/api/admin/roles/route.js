import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  formatRoleResponse,
  slugifyRoleName,
  validatePermissionsPayload,
} from "@/lib/services/admin-rbac";
import { SUPER_ADMIN_SLUG } from "@/lib/constants/admin-permissions";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "roles", "view");
    const roles = await prisma.adminRole.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
    return apiSuccess(roles.map(formatRoleResponse));
  } catch (error) {
    return handleApiError(error, "Failed to fetch roles.");
  }
}

export async function POST(req) {
  try {
    await requireAdminPermission(req, "roles", "create");
    const body = await req.json();
    const name = body.name?.trim();
    if (!name) return apiError("Role name is required.", 400, "VALIDATION_ERROR");

    const slug = body.slug?.trim() || slugifyRoleName(name);
    if (slug === SUPER_ADMIN_SLUG) {
      return apiError("This role slug is reserved.", 400, "VALIDATION_ERROR");
    }

    const permissions = validatePermissionsPayload(body.permissions);

    const role = await prisma.adminRole.create({
      data: {
        name,
        slug,
        description: body.description?.trim() || null,
        permissions: JSON.stringify(permissions),
        isSystem: false,
      },
      include: { _count: { select: { users: true } } },
    });

    return apiSuccess({ success: true, role: formatRoleResponse(role) }, 201);
  } catch (error) {
    return handleApiError(error, "Failed to create role.");
  }
}
