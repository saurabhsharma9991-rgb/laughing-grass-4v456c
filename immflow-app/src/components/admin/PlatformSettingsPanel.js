"use client";

import React, { useEffect, useState } from "react";
import { DEFAULT_FEATURE_FLAGS, PROMO_CODE_TEST } from "@/lib/constants/platform-features";
import { usePlatform } from "@/components/PlatformContext";

import { authFetch } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";

export default function PlatformSettingsPanel({ readOnly = false }) {
  const { refreshPlatform } = usePlatform();
  const [testMode, setTestMode] = useState(false);
  const [features, setFeatures] = useState(DEFAULT_FEATURE_FLAGS);
  const [freeListingLimit, setFreeListingLimit] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/settings");
      const data = await res.json();
      if (!data.error) {
        setTestMode(Boolean(data.testMode));
        setFeatures(data.features || DEFAULT_FEATURE_FLAGS);
        setFreeListingLimit(data.freeListingLimit ?? 1);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleFeature = (key, tier) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: { ...prev[key], [tier]: !prev[key]?.[tier] },
    }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testMode, features, freeListingLimit }),
      });
      const data = await res.json();
      if (data.success) {
        toastSuccess("Platform settings saved.");
        await refreshPlatform();
        load();
      } else {
        toastError(data.error?.message || "Failed to save settings.");
      }
    } catch {
      toastError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-muted">Loading platform settings…</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-surface border border-[rgba(20,30,48,0.10)] rounded-xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-syne text-lg font-bold text-text">Test mode</h3>
            <p className="text-sm text-muted mt-1 leading-relaxed">
              When enabled, test billing tools are available (promo code{" "}
              <code className="text-xs bg-bg px-1.5 py-0.5 rounded">{PROMO_CODE_TEST}</code> and
              simulated Stripe activation). A visible banner appears on the public site. Turn off
              before production launch.
            </p>
          </div>
          <button
            type="button"
            onClick={() => !readOnly && setTestMode((v) => !v)}
            disabled={readOnly}
            className={`shrink-0 relative w-12 h-7 rounded-full border-none cursor-pointer transition-all ${
              testMode ? "bg-green" : "bg-muted-high"
            }`}
            aria-pressed={testMode}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${
                testMode ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        {testMode && (
          <div className="mt-4 text-xs bg-amber-light text-amber border border-amber/30 rounded-lg px-3 py-2">
            Test mode is ON — simulated payments are active for all users.
          </div>
        )}
      </div>

      <div className="bg-surface border border-[rgba(20,30,48,0.10)] rounded-xl p-5">
        <h3 className="font-syne text-lg font-bold text-text mb-1">Free tier listing limit</h3>
        <p className="text-sm text-muted mb-3">
          Max active listings when unlimited listings is not available.
        </p>
        <input
          type="number"
          min={1}
          max={99}
          value={freeListingLimit}
          onChange={(e) => !readOnly && setFreeListingLimit(Number(e.target.value) || 1)}
          disabled={readOnly}
          className="w-24 p-2 text-sm border rounded-lg bg-bg focus:outline-none focus:border-green"
        />
      </div>

      <div className="bg-surface border border-[rgba(20,30,48,0.10)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(20,30,48,0.10)]">
          <h3 className="font-syne text-lg font-bold text-text">Feature access</h3>
          <p className="text-sm text-muted mt-1">
            Control which features Free vs Pro users can access across the platform.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-bg/80 text-left text-[11px] uppercase tracking-wider text-muted">
              <th className="p-3 pl-5 font-semibold">Feature</th>
              <th className="p-3 text-center font-semibold w-20">Free</th>
              <th className="p-3 pr-5 text-center font-semibold w-20">Pro</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(features).map(([key, flag]) => (
              <tr key={key} className="border-t border-[rgba(20,30,48,0.08)]">
                <td className="p-3 pl-5">
                  <div className="font-medium text-text">{flag.label}</div>
                  <div className="text-[11px] text-muted mt-0.5">{flag.description}</div>
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(flag.free)}
                    onChange={() => !readOnly && toggleFeature(key, "free")}
                    disabled={readOnly}
                    className="w-4 h-4 accent-[#35577D] cursor-pointer"
                  />
                </td>
                <td className="p-3 pr-5 text-center">
                  <input
                    type="checkbox"
                    checked={Boolean(flag.pro)}
                    onChange={() => !readOnly && toggleFeature(key, "pro")}
                    disabled={readOnly}
                    className="w-4 h-4 accent-[#35577D] cursor-pointer"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-green text-white py-2.5 px-6 rounded-lg border-none text-sm font-semibold cursor-pointer disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save platform settings"}
        </button>
      )}
    </div>
  );
}
