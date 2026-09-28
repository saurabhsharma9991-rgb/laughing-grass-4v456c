import { requireAuth } from "@/lib/auth/guards";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { addAccountProfiles } from "@/lib/services/auth";

export async function POST(req) {
  try {
    const session = requireAuth(req);
    const body = await req.json();
    const user = await addAccountProfiles(session.userId, {
      attorney: body.attorney || null,
      services: body.services || (body.categoryId ? [{ category_id: body.categoryId }] : []),
    });
    return apiSuccess({ user });
  } catch (error) {
    return handleApiError(error, "Failed to add that profile.");
  }
}
