"use client";

import React, { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { PROVIDER_BOOKING_TRANSITIONS } from "@/lib/constants/bookings";
import { useI18n } from "@/components/I18nProvider";

export default function BookingsPanel({ user, mode = "auto" }) {
  const { t } = useI18n();
  const isProvider = mode === "provider" || user?.role === "provider";
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const scope = isProvider ? "provider" : "mine";
      const res = await authFetch(`/api/bookings?scope=${scope}`);
      const data = await res.json();
      if (Array.isArray(data)) setBookings(data);
      else if (data.error) toastError(data.error.message);
    } catch {
      toastError(t("bookings.loadFailed", "Failed to load bookings."));
    } finally {
      setLoading(false);
    }
  }, [isProvider]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking");
    const sessionId = params.get("session_id");
    if (params.get("paid") !== "1" || !bookingId || !sessionId) return;
    authFetch(`/api/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "confirm_payment", sessionId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) toastError(data.error.message);
        else {
          toastSuccess(t("bookings.paymentConfirmed", "Payment confirmed. Your request was submitted."));
          load();
          window.history.replaceState({}, "", "/dashboard?tab=bookings");
        }
      });
  }, [load]);

  const checkout = async (bookingId) => {
    setBusyId(bookingId);
    try {
      const res = await authFetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else if (data.url) window.location.href = data.url;
      else {
        toastSuccess("Development payment completed.");
        load();
      }
    } catch {
      toastError(t("bookings.checkoutFailed", "Could not start checkout."));
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = async (id, status) => {
    setBusyId(id);
    try {
      const res = await authFetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess(`Booking ${status}.`);
        load();
      }
    } catch {
      toastError(t("bookings.updateFailed", "Update failed."));
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <p className="text-sm text-muted py-6">{t("common.loading", "Loading…")}</p>;

  if (bookings.length === 0) {
    return <p className="text-sm text-muted py-4">{t("bookings.noBookings", "No bookings yet.")}</p>;
  }

  return (
    <div className="overflow-x-auto border border-[rgba(0,0,0,0.09)] rounded-xl">
      <table className="w-full text-xs text-left min-w-[720px]">
        <thead className="bg-bg text-muted">
          <tr>
            <th className="px-3 py-2">ID</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Details</th>
            <th className="px-3 py-2">When</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-t border-[rgba(0,0,0,0.06)]">
              <td className="px-3 py-2">#{b.id}</td>
              <td className="px-3 py-2 capitalize">{b.bookingType}</td>
              <td className="px-3 py-2">
                <div className="font-medium">{b.serviceType || "—"}</div>
                <div className="text-muted">
                  {b.language || "—"} · {b.modality?.replace(/_/g, " ")}
                  {b.durationMinutes ? ` · ${b.durationMinutes}m` : ""}
                </div>
                <div className="text-muted">
                  {isProvider
                    ? b.client?.displayName || b.client?.email
                    : b.provider?.displayName || "Unassigned"}
                </div>
              </td>
              <td className="px-3 py-2">
                {b.scheduledAt
                  ? new Date(b.scheduledAt).toLocaleString()
                  : "Flexible"}
              </td>
              <td className="px-3 py-2 capitalize">{b.status}</td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {!isProvider && b.status === "pending_payment" && (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => checkout(b.id)}
                      className="rounded px-2 py-1 bg-green text-white font-semibold disabled:opacity-50"
                    >
                      Pay {b.priceLabel}
                    </button>
                  )}
                  {isProvider &&
                    (PROVIDER_BOOKING_TRANSITIONS[b.status] || []).map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => setStatus(b.id, s)}
                        className="border border-[rgba(0,0,0,0.12)] rounded px-2 py-1 capitalize hover:bg-bg disabled:opacity-50"
                      >
                        {s}
                      </button>
                    ))}
                  {!isProvider &&
                    ["pending_payment", "requested", "confirmed"].includes(
                      b.status
                    ) && (
                      <button
                        type="button"
                        disabled={busyId === b.id}
                        onClick={() => setStatus(b.id, "cancelled")}
                        className="text-muted hover:text-text px-1"
                      >
                        Cancel
                      </button>
                    )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
