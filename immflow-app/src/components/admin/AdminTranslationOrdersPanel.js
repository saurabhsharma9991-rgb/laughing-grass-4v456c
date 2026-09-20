"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { TRANSLATION_ORDER_STATUSES } from "@/lib/constants/translation";

export default function AdminTranslationOrdersPanel({ canEdit }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [translators, setTranslators] = useState([]);

  const load = () => {
    setLoading(true);
    const q = status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
    authFetch(`/api/admin/orders${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
        else if (data.error) toastError(data.error.message);
      })
      .catch(() => toastError("Failed to load orders."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    authFetch("/api/admin/providers?status=verified&category=translation")
      .then((r) => r.json())
      .then((data) => setTranslators(data.providers || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const patch = async (id, body) => {
    if (!canEdit) return;
    setBusyId(id);
    try {
      const res = await authFetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Order updated.");
        load();
      }
    } catch {
      toastError("Update failed.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="text-xs text-muted">
          Status{" "}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="ml-1 text-sm border border-[rgba(0,0,0,0.15)] rounded-lg px-2 py-1"
          >
            <option value="all">All</option>
            {TRANSLATION_ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={load}
          className="text-xs font-semibold text-green hover:underline"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-[rgba(0,0,0,0.09)] rounded-xl bg-white">
          <table className="w-full text-xs text-left min-w-[900px]">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
                <th className="px-3 py-2 font-semibold">Client</th>
                <th className="px-3 py-2 font-semibold">Languages</th>
                <th className="px-3 py-2 font-semibold">Type</th>
                <th className="px-3 py-2 font-semibold">Price</th>
                <th className="px-3 py-2 font-semibold">Provider</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-[rgba(0,0,0,0.06)]">
                  <td className="px-3 py-2">#{o.id}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{o.client?.displayName || "—"}</div>
                    <div className="text-muted">{o.client?.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    {o.sourceLanguage} → {o.targetLanguage}
                    <div className="text-muted">{o.documentType}</div>
                  </td>
                  <td className="px-3 py-2 capitalize">
                    {o.translationType}
                    <div className="text-muted">{o.turnaround}</div>
                  </td>
                  <td className="px-3 py-2">{o.priceLabel || "—"}</td>
                  <td className="px-3 py-2">
                    {canEdit ? (
                      <select
                        value={o.providerId || ""}
                        disabled={busyId === o.id}
                        onChange={(e) =>
                          patch(o.id, {
                            action: "assign_provider",
                            providerId: Number(e.target.value),
                          })
                        }
                        className="max-w-[180px] border border-[rgba(0,0,0,0.12)] rounded px-1 py-0.5"
                      >
                        <option value="">Assign translator…</option>
                        {translators.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.displayName}
                          </option>
                        ))}
                      </select>
                    ) : (
                      o.provider?.displayName || "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {canEdit ? (
                      <select
                        value={o.status}
                        disabled={busyId === o.id}
                        onChange={(e) => patch(o.id, { status: e.target.value })}
                        className="border border-[rgba(0,0,0,0.12)] rounded px-1 py-0.5"
                      >
                        {TRANSLATION_ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      o.status
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-[10px] text-muted">
                      {(o.files || []).length} file(s)
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-muted">
                    No translation orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
