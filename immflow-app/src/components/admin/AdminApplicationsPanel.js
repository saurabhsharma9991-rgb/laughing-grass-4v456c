"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/client/auth-storage";
import { confirmDialog, toastError, toastSuccess } from "@/lib/client/alerts";
import {
  APPLICATION_STATUS,
  applicationStatusLabel,
} from "@/lib/constants/application-status";

function StatusBadge({ status }) {
  const meta = APPLICATION_STATUS[status] || APPLICATION_STATUS.applied;
  const tones = {
    green: "bg-green-light text-green-dark",
    amber: "bg-amber-light text-amber",
    red: "bg-red-light text-red",
    blue: "bg-blue-light text-blue",
    muted: "bg-bg text-muted",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded uppercase ${tones[meta.tone]}`}>
      {applicationStatusLabel(status)}
    </span>
  );
}

export default function AdminApplicationsPanel({ canEdit, canDelete }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [acting, setActing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const q = statusFilter !== "all" ? `?status=${statusFilter}` : "";
    authFetch(`/api/admin/applications${q}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setApplications(data);
      })
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    setActing(id);
    try {
      const res = await authFetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Application updated.");
        load();
      }
    } catch {
      toastError("Failed to update application.");
    } finally {
      setActing(null);
    }
  };

  const remove = async (id) => {
    const ok = await confirmDialog({
      title: "Delete application",
      message: "Remove this application record permanently?",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    setActing(id);
    try {
      const res = await authFetch(`/api/admin/applications?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Application deleted.");
        load();
      }
    } catch {
      toastError("Failed to delete application.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", "applied", "reviewed", "accepted", "rejected"].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`text-xs py-1.5 px-3 rounded-lg border cursor-pointer ${
              statusFilter === s
                ? "bg-green text-white border-green"
                : "bg-white text-muted border-[rgba(0,0,0,0.12)]"
            }`}
          >
            {s === "all" ? "All" : applicationStatusLabel(s)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">Loading applications…</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">No applications found.</div>
      ) : (
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs text-left min-w-[800px]">
              <thead>
                <tr className="border-b-2 border-[rgba(0,0,0,0.09)] bg-bg/50 text-muted font-semibold">
                  <th className="p-3 pl-4">Applicant</th>
                  <th className="p-3">Listing</th>
                  <th className="p-3">Applied</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} className="border-b border-[rgba(0,0,0,0.07)] align-top">
                    <td className="p-3 pl-4">
                      <div className="font-semibold text-sm text-text">
                        {app.applicant.attorneyId ? (
                          <Link href={`/attorneys/${app.applicant.attorneyId}`} className="text-green hover:underline">
                            {app.applicant.name}
                          </Link>
                        ) : (
                          app.applicant.name
                        )}
                      </div>
                      <div className="text-[10px] text-muted mt-0.5">{app.applicant.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-text">{app.listing?.title}</div>
                      <div className="text-[10px] text-muted-high">Listing status: {app.listing?.status}</div>
                    </td>
                    <td className="p-3 text-muted whitespace-nowrap">{app.appliedLabel}</td>
                    <td className="p-3 text-center">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-3 pr-4">
                      <div className="flex flex-col items-end gap-1">
                        {canEdit && (app.status === "applied" || app.status === "reviewed") && (
                          <>
                            <button
                              type="button"
                              disabled={acting === app.id}
                              onClick={() => setStatus(app.id, "accepted")}
                              className="text-[11px] font-semibold text-green bg-transparent border-none cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={acting === app.id}
                              onClick={() => setStatus(app.id, "reviewed")}
                              className="text-[11px] text-muted bg-transparent border-none cursor-pointer"
                            >
                              Mark reviewed
                            </button>
                            <button
                              type="button"
                              disabled={acting === app.id}
                              onClick={() => setStatus(app.id, "rejected")}
                              className="text-[11px] text-red bg-transparent border-none cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            disabled={acting === app.id}
                            onClick={() => remove(app.id)}
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
    </div>
  );
}
