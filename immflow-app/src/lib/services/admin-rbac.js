import { prisma } from "@/lib/db";
import {
  ADMIN_RESOURCES,
  SUPER_ADMIN_SLUG,
  buildFullPermissions,
  normalizePermissions,
  canPerform,
} from "@/lib/constants/admin-permissions";
import { AuthError } from "@/lib/auth/guards.js";

function parseRolePermissions(role) {
  if (!role?.permissions) return normalizePermissions({});
  try {
    return normalizePermissions(JSON.parse(role.permissions));
  } catch {
    return normalizePermissions({});
  }
}

export function isSuperAdminUser(user) {
  if (user.role !== "admin") return false;
  if (!user.adminRoleId) return true;
  return user.adminRole?.slug === SUPER_ADMIN_SLUG;
}

export function resolveUserPermissions(user) {
  if (user.role !== "admin") {
    return { isSuperAdmin: false, permissions: normalizePermissions({}) };
  }
  if (isSuperAdminUser(user)) {
    return { isSuperAdmin: true, permissions: buildFullPermissions() };
  }
  return {
    isSuperAdmin: false,
    permissions: parseRolePermissions(user.adminRole),
  };
}

export async function getAdminUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      adminRole: true,
      attorney: { select: { name: true } },
    },
  });
}

export async function getAdminAccessForUserId(userId) {
  const user = await getAdminUserById(userId);
  if (!user || user.role !== "admin") {
    throw new AuthError("Admin privileges required.", 403, "FORBIDDEN");
  }

  const { isSuperAdmin, permissions } = resolveUserPermissions(user);

  return {
    user,
    isSuperAdmin,
    permissions,
    adminRole: user.adminRole,
  };
}

export function assertAdminPermission(access, resource, action) {
  if (!canPerform(access.permissions, resource, action, { isSuperAdmin: access.isSuperAdmin })) {
    throw new AuthError(
      `You do not have permission to ${action} ${resource}.`,
      403,
      "FORBIDDEN"
    );
  }
}

export function formatAdminUserResponse(user) {
  const { isSuperAdmin, permissions } = resolveUserPermissions(user);
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName || user.attorney?.name || user.email.split("@")[0],
    adminRoleId: user.adminRoleId,
    adminRole: user.adminRole
      ? {
          id: user.adminRole.id,
          name: user.adminRole.name,
          slug: user.adminRole.slug,
        }
      : null,
    isSuperAdmin,
    permissions,
    createdAt: user.createdAt,
  };
}

export function formatRoleResponse(role) {
  return {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    isSystem: role.isSystem,
    permissions: parseRolePermissions(role),
    userCount: role._count?.users ?? role.userCount,
    createdAt: role.createdAt,
  };
}

export function slugifyRoleName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

export function validatePermissionsPayload(permissions) {
  const normalized = normalizePermissions(permissions);
  let hasAny = false;
  for (const resource of Object.keys(ADMIN_RESOURCES)) {
    for (const action of ADMIN_RESOURCES[resource].actions) {
      if (normalized[resource][action]) hasAny = true;
    }
  }
  if (!hasAny) {
    throw new AuthError("Role must grant at least one permission.", 400, "VALIDATION_ERROR");
  }
  return normalized;
}

export { ADMIN_RESOURCES };
