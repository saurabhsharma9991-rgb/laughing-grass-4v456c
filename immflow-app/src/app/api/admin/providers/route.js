import { requireAdminPermission } from "@/lib/auth/guards";
import { apiSuccess, handleApiError, apiError } from "@/lib/api/response";
import {
  listProviders,
  getProviderById,
  updateProviderVerification,
  updateProviderAsAdmin,
  deleteProvider,
  addProviderCredential,
  updateCredentialStatus,
  requestUpdatedCredential,
  countExpiringCredentials,
} from "@/lib/services/providers";
import {
  notifySignupApproved,
  notifySignupRejected,
  notifyCredentialUpdateRequested,
} from "@/lib/email/notify";

export async function GET(req) {
  try {
    await requireAdminPermission(req, "providers", "view");
    const params = new URL(req.url).searchParams;
    const id = params.get("id");
    if (id) {
      const provider = await getProviderById(id);
      if (!provider) return apiError("Provider not found.", 404, "NOT_FOUND");
      return apiSuccess(provider);
    }

    const providers = await listProviders({
      categorySlug: params.get("category") || undefined,
      verificationStatus: params.get("status") || "all",
      includeInactive: true,
      q: params.get("q") || undefined,
    });
    const expiringCredentials = await countExpiringCredentials(60);
    return apiSuccess({ providers, expiringCredentials });
  } catch (error) {
    return handleApiError(error, "Failed to fetch providers.");
  }
}

export async function PATCH(req) {
  try {
    await requireAdminPermission(req, "providers", "edit");
    const body = await req.json();
    const { id, action, credentialId, ...rest } = body;
    if (!id) return apiError("id is required.", 400, "VALIDATION_ERROR");

    if (action === "verify" || action === "reject" || action === "suspend" || action === "expire" || action === "pending") {
      const statusMap = {
        verify: "verified",
        reject: "rejected",
        suspend: "suspended",
        expire: "expired",
        pending: "pending",
      };
      const provider = await updateProviderVerification(id, {
        status: statusMap[action],
        rejectionReason: rest.rejectionReason,
      });

      if (action === "verify" && provider.email) {
        void notifySignupApproved({
          email: provider.email,
          name: provider.displayName,
          locale: provider.preferredLocale,
        });
      }
      if (action === "reject" && provider.email) {
        void notifySignupRejected({
          email: provider.email,
          name: provider.displayName,
          reason: rest.rejectionReason || "Credentials could not be verified.",
          locale: provider.preferredLocale,
        });
      }

      return apiSuccess({ success: true, provider });
    }

    if (action === "add_credential") {
      const provider = await addProviderCredential(id, rest);
      return apiSuccess({ success: true, provider });
    }

    if (action === "credential_status" && credentialId) {
      const provider = await updateCredentialStatus(credentialId, rest.status);
      return apiSuccess({ success: true, provider });
    }
    if (action === "request_credential_update" && credentialId) {
      const provider = await requestUpdatedCredential(
        credentialId,
        rest.notes
      );
      void notifyCredentialUpdateRequested(provider.id, rest.notes);
      return apiSuccess({ success: true, provider });
    }

    const provider = await updateProviderAsAdmin(id, rest);
    return apiSuccess({ success: true, provider });
  } catch (error) {
    return handleApiError(error, "Failed to update provider.");
  }
}

export async function DELETE(req) {
  try {
    await requireAdminPermission(req, "providers", "delete");
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return apiError("Missing query parameter: id", 400, "VALIDATION_ERROR");
    const result = await deleteProvider(id);
    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error, "Failed to delete provider.");
  }
}
