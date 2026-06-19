import { prisma } from "@/lib/db";
import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import { validateUpdateListing } from "@/lib/validators/listings";
import { updateListing } from "@/lib/services/listings";

export async function PATCH(req) {
  try {
    await requireAdminPermission(req, "listings", "edit");
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return apiError("id is required.", 400, "VALIDATION_ERROR");

    const validation = validateUpdateListing(fields);
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return apiError(firstError, 400, "VALIDATION_ERROR", validation.errors);
    }

    const listing = await updateListing(parseInt(id, 10), validation.data, { isAdmin: true });
    return apiSuccess({ success: true, listing });
  } catch (error) {
    return handleApiError(error, "Failed to update listing.");
  }
}

export async function DELETE(req) {
  try {
    await requireAdminPermission(req, "listings", "delete");
    const idStr = new URL(req.url).searchParams.get("id");
    if (!idStr) return apiError("Missing query parameter: id", 400, "VALIDATION_ERROR");

    const listingId = parseInt(idStr, 10);
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return apiError("Listing not found.", 404, "NOT_FOUND");

    await prisma.listing.delete({ where: { id: listingId } });
    return apiSuccess({ success: true, message: "Listing deleted successfully." });
  } catch (error) {
    return handleApiError(error, "Failed to delete listing.");
  }
}
