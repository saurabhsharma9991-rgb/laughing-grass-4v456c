"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { BOOKING_STATUSES, BOOKING_TYPES } from "@/lib/constants/bookings";

export default function AdminBookingsPanel({ canEdit }) {
  const [bookings, setBookings] = useState([]);
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [providers, setProviders] = useState([]);

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (type !== "all") params.set("type", type);
    if (status !== "all") params.set("status", status);
    const q = params.toString() ? `?${params}` : "";
    authFetch(`/api/admin/bookings${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBookings(data);
        else if (data.error) toastError(data.error.message);
      })
      .catch(() => toastError("Failed to load bookings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    authFetch("/api/admin/providers?status=verified")
      .then((r) => r.json())
      .then((data) => setProviders(data.providers || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status]);

  const patch = async (id, body) => {
    if (!canEdit) return;
    setBusyId(id);
    try {
      const res = await authFetch("/api/admin/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Booking updated.");
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
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="text-sm border rounded-lg px-2 py-1"
        >
          <option value="all">All types</option>
          {BOOKING_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm border rounded-lg px-2 py-1"
        >
          <option value="all">All statuses</option>
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <div className="overflow-x-auto border border-[rgba(0,0,0,0.09)] rounded-xl bg-white">
          <table className="w-full text-xs text-left min-w-[900px]">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Type / service</th>
                <th className="px-3 py-2">Provider</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-t border-[rgba(0,0,0,0.06)]">
                  <td className="px-3 py-2">#{b.id}</td>
                  <td className="px-3 py-2">
                    <div>{b.client?.displayName || "—"}</div>
                    <div className="text-muted">{b.client?.email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="capitalize font-medium">{b.bookingType}</div>
                    <div className="text-muted">{b.serviceType}</div>
                    <div className="text-muted">
                      {b.language} · {b.modality}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {canEdit ? (
                      <select
                        value={b.providerId || ""}
                        disabled={busyId === b.id}
                        onChange={(e) =>
                          patch(b.id, { providerId: Number(e.target.value) })
                        }
                        className="max-w-[180px] border rounded px-1 py-0.5"
                      >
                        <option value="">Assign provider…</option>
                        {providers
                          .filter(
                            (p) =>
                              p.categorySlug ===
                              (b.bookingType === "interpreter"
                                ? "interpreter"
                                : "psychological")
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.displayName}
                            </option>
                          ))}
                      </select>
                    ) : (
                      b.provider?.displayName || "—"
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {b.scheduledAt
                      ? new Date(b.scheduledAt).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-3 py-2">
                    {canEdit ? (
                      <select
                        value={b.status}
                        disabled={busyId === b.id}
                        onChange={(e) => patch(b.id, { status: e.target.value })}
                        className="border rounded px-1 py-0.5"
                      >
                        {BOOKING_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      b.status
                    )}
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted">
                    No bookings.
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
