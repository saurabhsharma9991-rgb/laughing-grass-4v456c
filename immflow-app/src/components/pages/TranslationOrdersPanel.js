"use client";

import React, { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { PROVIDER_STATUS_FLOW } from "@/lib/constants/translation";
import { useI18n } from "@/components/I18nProvider";

function StatusBadge({ status }) {
  const colors = {
    pending_payment: "bg-amber-50 text-amber-800",
    pending: "bg-blue-50 text-blue-800",
    accepted: "bg-indigo-50 text-indigo-800",
    in_progress: "bg-violet-50 text-violet-800",
    quality_review: "bg-fuchsia-50 text-fuchsia-800",
    completed: "bg-emerald-50 text-emerald-800",
    delivered: "bg-green-light text-green-dark",
    cancelled: "bg-bg text-muted",
    refunded: "bg-bg text-muted",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide ${
        colors[status] || "bg-bg text-muted"
      }`}
    >
      {String(status || "").replace(/_/g, " ")}
    </span>
  );
}

export default function TranslationOrdersPanel({ user, mode = "auto" }) {
  const { t } = useI18n();
  const isProvider = mode === "provider" || user?.role === "provider";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const scope = isProvider ? "provider" : "mine";
      const res = await authFetch(`/api/translation-orders?scope=${scope}`);
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
      else if (data.error) toastError(data.error.message);
    } catch {
      toastError(t("translation.loadFailed", "Failed to load orders."));
    } finally {
      setLoading(false);
    }
  }, [isProvider]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("order");
    const paid = params.get("paid");
    const sessionId = params.get("session_id");
    if (orderId && paid === "1") {
      authFetch(`/api/translation-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm_payment", sessionId }),
      })
        .then((r) => r.json())
        .then(() => {
          toastSuccess(t("translation.paymentConfirmed", "Payment confirmed."));
          load();
          setSelectedId(Number(orderId));
        })
        .catch(() => {});
    }
  }, [load]);

  const selected = orders.find((o) => o.id === selectedId) || null;

  const checkout = async (order) => {
    setBusy(true);
    try {
      const res = await authFetch(`/api/translation-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      const data = await res.json();
      if (data.error) {
        toastError(data.error.message);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.checkoutSimulated) {
        toastSuccess("Payment recorded (Stripe not configured — local mode).");
        load();
      }
    } catch {
      toastError(t("translation.checkoutFailed", "Checkout failed."));
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (order, status) => {
    setBusy(true);
    try {
      const res = await authFetch(`/api/translation-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess(`Status → ${status.replace(/_/g, " ")}`);
        load();
      }
    } catch {
      toastError("Failed to update status.");
    } finally {
      setBusy(false);
    }
  };

  const uploadFile = async (order, kind, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await authFetch(`/api/translation-orders/${order.id}/files`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess(t("translation.fileUploaded", "File uploaded."));
        load();
      }
    } catch {
      toastError(t("translation.uploadFailed", "Upload failed."));
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (order, file) => {
    try {
      const res = await authFetch(
        `/api/translation-orders/${order.id}/files?fileId=${file.id}`
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toastError(err?.error?.message || "Download failed.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.originalName || "document";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toastError("Download failed.");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted py-8">{t("common.loading", "Loading…")}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-4">
      <div className="border border-[rgba(0,0,0,0.09)] rounded-xl overflow-hidden bg-white">
        <div className="px-4 py-3 border-b border-[rgba(0,0,0,0.06)] font-syne font-bold text-sm">
          {isProvider
            ? t("translation.incoming", "Incoming translation jobs")
            : t("translation.myOrders", "My translation orders")}
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-muted p-4">{t("translation.noOrders", "No orders yet.")}</p>
        ) : (
          <ul className="divide-y divide-[rgba(0,0,0,0.06)] max-h-[480px] overflow-auto">
            {orders.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-bg ${
                    selectedId === o.id ? "bg-bg" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-text">
                      #{o.id} · {o.sourceLanguage} → {o.targetLanguage}
                    </span>
                    <StatusBadge status={o.status} />
                  </div>
                  <div className="text-[11px] text-muted">
                    {o.documentType} · {o.translationType} · {o.priceLabel || "—"}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border border-[rgba(0,0,0,0.09)] rounded-xl bg-white p-4 min-h-[280px]">
        {!selected ? (
          <p className="text-sm text-muted">{t("translation.selectOrder", "Select an order to view details.")}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-syne text-lg font-extrabold">
                  Order #{selected.id}
                </h3>
                <p className="text-xs text-muted mt-1">
                  {selected.sourceLanguage} → {selected.targetLanguage} ·{" "}
                  {selected.documentType}
                </p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <dl className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted">{t("translation.translationType", "Type")}</dt>
                <dd className="font-medium capitalize">{selected.translationType}</dd>
              </div>
              <div>
                <dt className="text-muted">{t("translation.turnaround", "Turnaround")}</dt>
                <dd className="font-medium capitalize">{selected.turnaround}</dd>
              </div>
              <div>
                <dt className="text-muted">Price</dt>
                <dd className="font-medium">{selected.priceLabel || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Provider</dt>
                <dd className="font-medium">{selected.provider?.displayName || "Unassigned"}</dd>
              </div>
            </dl>

            {selected.certificationNote && (
              <p className="text-[11px] text-muted-high bg-bg rounded-lg p-3 leading-relaxed">
                {selected.certificationNote}
              </p>
            )}

            {selected.clientNotes && (
              <div className="text-xs">
                <div className="text-muted mb-1">Client notes</div>
                <p className="whitespace-pre-wrap">{selected.clientNotes}</p>
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-muted mb-2">Files</div>
              {(selected.files || []).length === 0 ? (
                <p className="text-xs text-muted">No files yet.</p>
              ) : (
                <ul className="space-y-1">
                  {selected.files.map((f) => (
                    <li key={f.id} className="flex items-center justify-between text-xs">
                      <span>
                        <span className="uppercase text-[10px] text-muted mr-2">{f.kind}</span>
                        {f.originalName}
                      </span>
                      <button
                        type="button"
                        className="text-green font-semibold hover:underline"
                        onClick={() => downloadFile(selected, f)}
                      >
                        Download
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-[rgba(0,0,0,0.06)]">
              {!isProvider && selected.status === "pending_payment" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => checkout(selected)}
                  className="bg-green text-white text-xs font-semibold px-3 py-2 rounded-lg disabled:opacity-50"
                >
                  Pay now
                </button>
              )}

              {!isProvider && selected.status === "pending_payment" && (
                <label className="text-xs border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2 cursor-pointer">
                  {uploading ? "Uploading…" : "Upload source"}
                  <input
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadFile(selected, "source", f);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}

              {isProvider &&
                (PROVIDER_STATUS_FLOW[selected.status] || []).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(selected, s)}
                    className="border border-[rgba(0,0,0,0.12)] text-xs font-semibold px-3 py-2 rounded-lg hover:bg-bg disabled:opacity-50 capitalize"
                  >
                    Mark {s.replace(/_/g, " ")}
                  </button>
                ))}

              {isProvider &&
                ["accepted", "in_progress", "quality_review", "completed"].includes(
                  selected.status
                ) && (
                  <>
                    <label className="text-xs border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2 cursor-pointer">
                      Upload delivery
                      <input
                        type="file"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) uploadFile(selected, "delivery", f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {selected.translationType === "certified" && (
                      <label className="text-xs border border-[rgba(0,0,0,0.12)] rounded-lg px-3 py-2 cursor-pointer">
                        Upload attestation
                        <input
                          type="file"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) uploadFile(selected, "certification", f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    )}
                  </>
                )}

              {!isProvider &&
                ["pending_payment", "pending"].includes(selected.status) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStatus(selected, "cancelled")}
                    className="text-xs text-muted hover:text-text px-2"
                  >
                    Cancel
                  </button>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
