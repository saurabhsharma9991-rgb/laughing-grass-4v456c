"use client";

import React, { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";

export default function AdminClientsPanel({ canEdit }) {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ total: 0, proCount: 0, unverifiedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [plan, setPlan] = useState("all");
  const [acting, setActing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (status !== "all") params.set("status", status);
    if (plan !== "all") params.set("plan", plan);
    authFetch(`/api/admin/clients?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.clients)) {
          setClients(data.clients);
          setStats({
            total: data.total || 0,
            proCount: data.proCount || 0,
            unverifiedCount: data.unverifiedCount || 0,
          });
        } else if (data.error) {
          toastError(data.error.message);
        }
      })
      .catch(() => toastError("Failed to load clients."))
      .finally(() => setLoading(false));
  }, [q, status, plan]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const act = async (id, action, extra = {}) => {
    if (!canEdit) return;
    setActing(`${id}-${action}`);
    try {
      const res = await authFetch("/api/admin/clients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, ...extra }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Client updated.");
        load();
      }
    } catch {
      toastError("Update failed.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="font-syne text-2xl font-extrabold text-text">Clients</h1>
          <p className="text-sm text-muted mt-1">
            People looking for immigration services (seekers). They can use Free
            marketplace tools or upgrade to ImmFlow Pro.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-bg px-3 py-1.5 rounded-lg text-muted">
            Total <strong className="text-text">{stats.total}</strong>
          </span>
          <span className="bg-green-light px-3 py-1.5 rounded-lg text-green-dark">
            Pro <strong>{stats.proCount}</strong>
          </span>
          <span className="bg-amber-light px-3 py-1.5 rounded-lg text-amber">
            Unverified <strong>{stats.unverifiedCount}</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="text-sm py-2 px-3 border rounded-lg min-w-[220px]"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="text-sm py-2 px-3 border rounded-lg"
        >
          <option value="all">All statuses</option>
          <option value="verified">Email verified</option>
          <option value="unverified">Email unverified</option>
          <option value="approved">Approved</option>
          <option value="rejected">Restricted</option>
        </select>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="text-sm py-2 px-3 border rounded-lg"
        >
          <option value="all">All plans</option>
          <option value="pro">Pro</option>
          <option value="free">Free</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted py-10">Loading clients…</div>
      ) : clients.length === 0 ? (
        <div className="text-sm text-muted py-10">No clients match these filters.</div>
      ) : (
        <div className="overflow-x-auto bg-white border border-[rgba(0,0,0,0.09)] rounded-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Plan</th>
                <th className="px-4 py-3 font-semibold">Activity</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-t border-[rgba(0,0,0,0.06)]">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-text">{c.displayName}</div>
                    <div className="text-xs text-muted">{c.email}</div>
                    <div className="text-[10px] text-muted mt-0.5">
                      Locale: {c.preferredLocale || "en"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit text-[10px] font-semibold px-2 py-0.5 rounded ${
                          c.emailVerified
                            ? "bg-green-light text-green-dark"
                            : "bg-amber-light text-amber"
                        }`}
                      >
                        {c.emailVerified ? "Email verified" : "Unverified"}
                      </span>
                      <span
                        className={`inline-flex w-fit text-[10px] font-semibold px-2 py-0.5 rounded ${
                          c.signupStatus === "rejected"
                            ? "bg-red-light text-red"
                            : "bg-bg text-muted"
                        }`}
                      >
                        {c.signupStatus === "rejected" ? "Restricted" : "Active"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        c.isPro
                          ? "bg-green-light text-green-dark"
                          : "bg-bg text-muted"
                      }`}
                    >
                      {c.isPro ? "Pro" : "Free"}
                    </span>
                    {c.subscriptionPlan && (
                      <div className="text-[10px] text-muted mt-1">{c.subscriptionPlan}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    <div>{c.ordersCount} orders</div>
                    <div>{c.bookingsCount} bookings</div>
                    <div>{c.applicationsCount} applications</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {canEdit ? (
                      <div className="flex flex-wrap gap-1.5">
                        {!c.emailVerified && (
                          <button
                            type="button"
                            disabled={acting === `${c.id}-mark_verified`}
                            onClick={() => act(c.id, "mark_verified")}
                            className="text-[11px] px-2 py-1 rounded border cursor-pointer"
                          >
                            Verify email
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={acting === `${c.id}-${c.isPro ? "revoke_pro" : "grant_pro"}`}
                          onClick={() =>
                            act(c.id, c.isPro ? "revoke_pro" : "grant_pro")
                          }
                          className="text-[11px] px-2 py-1 rounded border cursor-pointer"
                        >
                          {c.isPro ? "Revoke Pro" : "Grant Pro"}
                        </button>
                        {c.signupStatus === "rejected" ? (
                          <button
                            type="button"
                            disabled={acting === `${c.id}-approve`}
                            onClick={() => act(c.id, "approve")}
                            className="text-[11px] px-2 py-1 rounded border cursor-pointer"
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={acting === `${c.id}-reject`}
                            onClick={() => act(c.id, "reject")}
                            className="text-[11px] px-2 py-1 rounded border border-red text-red cursor-pointer"
                          >
                            Restrict
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
