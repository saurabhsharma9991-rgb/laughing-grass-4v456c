"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { authFetch } from "@/lib/client/auth-storage";
import { confirmDialog, toastError, toastSuccess } from "@/lib/client/alerts";

export default function AdminReviewsPanel({ canDelete }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    authFetch("/api/admin/reviews")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReviews(data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (review) => {
    const ok = await confirmDialog({
      title: "Delete review",
      message: "Remove this review permanently? The provider's rating will be recalculated.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    const actionKey = `${review.reviewType || "attorney"}-${review.id}`;
    setActing(actionKey);
    try {
      const params = new URLSearchParams({
        id: String(review.id),
        type: review.reviewType || "attorney",
      });
      const res = await authFetch(`/api/admin/reviews?${params}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) toastError(data.error.message);
      else {
        toastSuccess("Review deleted.");
        load();
      }
    } catch {
      toastError("Failed to delete review.");
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-muted">Loading reviews…</div>;
  }

  if (!reviews.length) {
    return <div className="text-center py-12 text-muted text-sm">No reviews yet.</div>;
  }

  return (
    <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs text-left min-w-[700px]">
          <thead>
            <tr className="border-b-2 border-[rgba(0,0,0,0.09)] bg-bg/50 text-muted font-semibold">
              <th className="p-3 pl-4">Provider</th>
              <th className="p-3">Reviewer</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Comment</th>
              <th className="p-3 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={`${r.reviewType || "attorney"}-${r.id}`} className="border-b border-[rgba(0,0,0,0.07)] align-top">
                <td className="p-3 pl-4">
                  <Link
                    href={
                      r.reviewType === "provider"
                        ? `/providers/${r.providerId}`
                        : `/attorneys/${r.attorneyId}`
                    }
                    className="font-semibold text-green hover:underline"
                  >
                    {r.attorneyName}
                  </Link>
                </td>
                <td className="p-3 text-muted">{r.reviewerName}</td>
                <td className="p-3 font-semibold">{"★".repeat(r.rating)}</td>
                <td className="p-3 text-muted max-w-[280px]">{r.comment || "—"}</td>
                <td className="p-3 pr-4 text-right">
                  {canDelete && (
                    <button
                      type="button"
                      disabled={
                        acting === `${r.reviewType || "attorney"}-${r.id}`
                      }
                      onClick={() => remove(r)}
                      className="text-[11px] text-red bg-transparent border-none cursor-pointer font-semibold"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
