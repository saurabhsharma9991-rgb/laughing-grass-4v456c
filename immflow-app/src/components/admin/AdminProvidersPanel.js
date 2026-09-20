"use client";

import React, { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { confirmDialog, toastError, toastSuccess } from "@/lib/client/alerts";

const STATUS_TONES = {
  pending: "bg-amber-light text-amber",
  verified: "bg-green-light text-green-dark",
  rejected: "bg-red-light text-red",
  expired: "bg-bg text-muted",
  suspended: "bg-red-light text-red",
};

export default function AdminProvidersPanel({ canEdit, canDelete }) {
  const [providers, setProviders] = useState([]);
  const [expiring, setExpiring] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [acting, setActing] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [credentialProviderId, setCredentialProviderId] = useState(null);
  const [credentialForm, setCredentialForm] = useState({
    label: "",
    organization: "",
    credentialNumber: "",
    expiresAt: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (statusFilter !== "all") q.set("status", statusFilter);
    if (categoryFilter) q.set("category", categoryFilter);
    authFetch(`/api/admin/providers?${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.providers)) {
          setProviders(data.providers);
          setExpiring(data.expiringCredentials || 0);
        } else if (Array.isArray(data)) {
          setProviders(data);
        }
      })
      .finally(() => setLoading(false));
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    load();
    authFetch("/api/admin/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, [load]);

  const act = async (id, action, extra = {}) => {
    setActing(id);
    try {
      const res = await authFetch("/api/admin/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess(`Provider ${action}d.`);
        setRejectId(null);
        setRejectReason("");
        load();
      }
    } catch {
      toastError("Action failed.");
    } finally {
      setActing(null);
    }
  };

  const remove = async (id) => {
    const ok = await confirmDialog({
      title: "Delete provider",
      message: "Delete this provider profile? The user account is not deleted.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      const res = await authFetch(`/api/admin/providers?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Provider deleted.");
        load();
      }
    } catch {
      toastError("Delete failed.");
    }
  };

  return (
    <div>
      {expiring > 0 && (
        <div className="mb-4 text-xs bg-amber-light text-amber rounded-lg px-4 py-3 font-medium">
          {expiring} credential{expiring !== 1 ? "s" : ""} expire within 60 days — review below.
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {["all", "pending", "verified", "rejected", "expired", "suspended"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`text-xs py-1.5 px-3 rounded-lg border cursor-pointer capitalize ${
              statusFilter === s ? "bg-green text-white border-green" : "bg-white text-muted border-[rgba(0,0,0,0.12)]"
            }`}
          >
            {s}
          </button>
        ))}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs py-1.5 px-3 rounded-lg border bg-white"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">Loading providers…</div>
      ) : providers.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">No providers found.</div>
      ) : (
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[900px]">
              <thead>
                <tr className="border-b-2 bg-bg/50 text-muted font-semibold">
                  <th className="p-3 pl-4">Provider</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Credentials</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p) => (
                  <tr key={p.id} className="border-b border-[rgba(0,0,0,0.06)] align-top">
                    <td className="p-3 pl-4">
                      <div className="font-semibold text-sm">{p.displayName}</div>
                      <div className="text-[10px] text-muted">{p.email}</div>
                      <div className="text-[10px] text-muted-high">{p.location || "—"}</div>
                    </td>
                    <td className="p-3">{p.categoryName}</td>
                    <td className="p-3">
                      {(p.credentials || []).length === 0 && <span className="text-muted">None</span>}
                      {(p.credentials || []).map((c) => (
                        <div key={c.id} className="mb-1">
                          <span className="font-medium">{c.label}</span>
                          {c.credentialNumber && (
                            <span className="text-muted"> · {c.credentialNumber}</span>
                          )}
                            {c.expiringSoon && (
                            <span className="ml-1 text-amber font-semibold">expiring soon</span>
                          )}
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {canEdit && (
                              <select
                                value={c.status}
                                disabled={acting === p.id}
                                onChange={(e) =>
                                  act(p.id, "credential_status", {
                                    credentialId: c.id,
                                    status: e.target.value,
                                  })
                                }
                                className="text-[10px] border rounded px-1 py-0.5"
                              >
                                {["pending", "verified", "rejected", "expired"].map(
                                  (status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  )
                                )}
                              </select>
                            )}
                            {canEdit && (
                              <button
                                type="button"
                                disabled={acting === p.id}
                                onClick={() =>
                                  act(p.id, "request_credential_update", {
                                    credentialId: c.id,
                                    notes:
                                      "Please upload current credential documentation.",
                                  })
                                }
                                className="text-[10px] text-amber font-semibold"
                              >
                                Request update
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_TONES[p.verificationStatus] || STATUS_TONES.pending}`}>
                        {p.verificationStatus}
                      </span>
                    </td>
                    <td className="p-3 pr-4">
                      <div className="flex flex-col items-end gap-1">
                        {canEdit && p.verificationStatus !== "verified" && (
                          <button
                            type="button"
                            disabled={acting === p.id}
                            onClick={() => act(p.id, "verify")}
                            className="text-[11px] text-green font-semibold bg-transparent border-none cursor-pointer"
                          >
                            Verify
                          </button>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setCredentialProviderId(p.id)}
                            className="text-[11px] text-green font-semibold bg-transparent border-none cursor-pointer"
                          >
                            Add credential
                          </button>
                        )}
                        {canEdit && p.verificationStatus !== "rejected" && (
                          <button
                            type="button"
                            disabled={acting === p.id}
                            onClick={() => setRejectId(p.id)}
                            className="text-[11px] text-red font-semibold bg-transparent border-none cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                        {canEdit && p.verificationStatus === "verified" && (
                          <>
                            <button
                              type="button"
                              disabled={acting === p.id}
                              onClick={() => act(p.id, "suspend")}
                              className="text-[11px] text-amber font-semibold bg-transparent border-none cursor-pointer"
                            >
                              Suspend
                            </button>
                            <button
                              type="button"
                              disabled={acting === p.id}
                              onClick={() => act(p.id, "expire")}
                              className="text-[11px] text-muted font-semibold bg-transparent border-none cursor-pointer"
                            >
                              Mark expired
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => remove(p.id)}
                            className="text-[11px] text-red bg-transparent border-none cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
            <h2 className="font-syne text-lg font-bold mb-2">Reject provider</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Reason shown to the provider"
              className="w-full text-sm p-3 border rounded-lg mb-4"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejectId(null)} className="text-sm py-2 px-4 rounded-lg border cursor-pointer bg-transparent">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => act(rejectId, "reject", { rejectionReason: rejectReason })}
                className="text-sm py-2 px-4 rounded-lg border-none bg-red text-white font-semibold cursor-pointer"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {credentialProviderId && (
        <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center p-4">
          <form
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              await act(credentialProviderId, "add_credential", credentialForm);
              setCredentialProviderId(null);
              setCredentialForm({
                label: "",
                organization: "",
                credentialNumber: "",
                expiresAt: "",
              });
            }}
          >
            <h2 className="font-syne text-lg font-bold">Add credential</h2>
            {[
              ["label", "Credential label"],
              ["organization", "Organization"],
              ["credentialNumber", "Credential number"],
            ].map(([key, placeholder]) => (
              <input
                key={key}
                required={key === "label"}
                value={credentialForm[key]}
                onChange={(e) =>
                  setCredentialForm({
                    ...credentialForm,
                    [key]: e.target.value,
                  })
                }
                placeholder={placeholder}
                className="w-full text-sm p-2.5 border rounded-lg"
              />
            ))}
            <label className="block text-xs text-muted">
              Expiration date
              <input
                type="date"
                value={credentialForm.expiresAt}
                onChange={(e) =>
                  setCredentialForm({
                    ...credentialForm,
                    expiresAt: e.target.value,
                  })
                }
                className="mt-1 w-full text-sm p-2.5 border rounded-lg"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCredentialProviderId(null)}
                className="text-sm px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-sm px-4 py-2 bg-green text-white rounded-lg"
              >
                Add
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
