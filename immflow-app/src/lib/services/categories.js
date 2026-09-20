import { prisma } from "@/lib/db";
import { AuthError } from "@/lib/auth/guards.js";
import { normalizeProfileSchema } from "@/lib/validators/category-profile-schema";

function slugify(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function listCategories({ activeOnly = false } = {}) {
  const rows = await prisma.serviceCategory.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map((row) => ({
    ...row,
    profileSchema: normalizeProfileSchema(row.profileSchema || { fields: [] }),
  }));
}

export async function getCategoryBySlug(slug) {
  return prisma.serviceCategory.findUnique({ where: { slug } });
}

export async function getCategoryById(id) {
  return prisma.serviceCategory.findUnique({ where: { id: Number(id) } });
}

export async function createCategory(input) {
  const name = input.name?.trim();
  if (!name) throw new AuthError("Name is required.", 400, "VALIDATION_ERROR");

  let slug = (input.slug?.trim() || slugify(name)).toLowerCase();
  if (!slug) throw new AuthError("Slug is required.", 400, "VALIDATION_ERROR");

  const existing = await prisma.serviceCategory.findUnique({ where: { slug } });
  if (existing) throw new AuthError("A category with this slug already exists.", 409, "SLUG_EXISTS");

  return prisma.serviceCategory.create({
    data: {
      name,
      slug,
      description: input.description?.trim() || null,
      icon: input.icon?.trim() || null,
      isActive: input.isActive !== false,
      sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
      profileSchema: normalizeProfileSchema(input.profileSchema ?? { fields: [] }),
    },
  });
}

export async function updateCategory(id, input) {
  const category = await prisma.serviceCategory.findUnique({ where: { id: Number(id) } });
  if (!category) throw new AuthError("Category not found.", 404, "NOT_FOUND");

  const data = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.description !== undefined) data.description = input.description?.trim() || null;
  if (input.icon !== undefined) data.icon = input.icon?.trim() || null;
  if (input.isActive !== undefined) data.isActive = Boolean(input.isActive);
  if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder) || 0;
  if (input.profileSchema !== undefined) {
    data.profileSchema = normalizeProfileSchema(input.profileSchema);
  }
  if (input.slug !== undefined) {
    const slug = input.slug.trim().toLowerCase();
    if (!slug) throw new AuthError("Slug cannot be empty.", 400, "VALIDATION_ERROR");
    if (slug !== category.slug) {
      const clash = await prisma.serviceCategory.findUnique({ where: { slug } });
      if (clash) throw new AuthError("A category with this slug already exists.", 409, "SLUG_EXISTS");
      data.slug = slug;
    }
  }

  return prisma.serviceCategory.update({ where: { id: category.id }, data });
}

export async function deleteCategory(id) {
  const category = await prisma.serviceCategory.findUnique({
    where: { id: Number(id) },
    include: { _count: { select: { providers: true } } },
  });
  if (!category) throw new AuthError("Category not found.", 404, "NOT_FOUND");
  if (category._count.providers > 0) {
    throw new AuthError(
      "Cannot delete a category that still has providers. Deactivate it instead.",
      400,
      "CATEGORY_HAS_PROVIDERS"
    );
  }
  await prisma.serviceCategory.delete({ where: { id: category.id } });
  return { success: true };
}
