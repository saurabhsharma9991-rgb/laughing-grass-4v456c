"use client";

import React, { useEffect, useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
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
    muted: "bg-bg text-muted border border-[rgba(0,0,0,0.09)]",
  };
  return (
    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase ${tones[meta.tone]}`}>
      {applicationStatusLabel(status)}
    </span>
  );
}

export default function MyApplications({ setPage }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    authFetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.applications)) setApplications(data.applications);
        else if (Array.isArray(data)) setApplications(data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted text-sm">Loading your applications…</div>;
  }

  if (!applications.length) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">📋</div>
        <p className="text-sm text-muted mb-4">You haven&apos;t applied to any listings yet.</p>
        <button
          type="button"
          onClick={() => setPage("jobs")}
          className="bg-green text-white text-sm py-2.5 px-5 rounded-lg border-none cursor-pointer font-semibold"
        >
          Browse job board
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted mb-4">
        Track every listing you&apos;ve applied to. Status updates when the posting attorney reviews your application.
      </p>
      {applications.map((app) => (
        <div
          key={app.id}
          className="border border-[rgba(0,0,0,0.09)] rounded-xl p-4 bg-white shadow-sm"
        >
          <div className="flex flex-wrap justify-between gap-3 items-start">
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-text text-sm">{app.listing?.title}</div>
              <div className="text-xs text-muted mt-0.5">
                {app.listing?.org} · {app.listing?.location} · {app.listing?.type}
              </div>
              <div className="text-[11px] text-muted-high mt-1">
                Applied {app.appliedLabel} · 💰 {app.listing?.pay}
              </div>
              {app.message && (
                <p className="text-xs text-muted mt-2 italic border-l-2 border-green/30 pl-2">
                  &ldquo;{app.message}&rdquo;
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={app.status} />
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                  app.listing?.status === "open"
                    ? "text-green-dark bg-green-light"
                    : "text-muted bg-bg"
                }`}
              >
                Listing: {app.listing?.status}
              </span>
            </div>
          </div>
          {app.status === "accepted" && (
            <div className="mt-3 text-xs bg-green-light text-green-dark rounded-lg px-3 py-2 font-medium">
              Congratulations — the posting attorney accepted your application.
            </div>
          )}
          {app.status === "rejected" && (
            <div className="mt-3 text-xs bg-bg text-muted rounded-lg px-3 py-2">
              This listing moved forward with another applicant. Keep browsing for more opportunities.
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setPage("jobs")}
        className="text-sm text-green font-semibold bg-transparent border-none cursor-pointer hover:underline mt-2"
      >
        Browse more listings →
      </button>
    </div>
  );
}
