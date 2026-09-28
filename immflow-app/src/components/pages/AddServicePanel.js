"use client";

import React, { useEffect, useState } from "react";
import { authFetch, setStoredUser } from "@/lib/client/auth-storage";
import { toastError, toastSuccess } from "@/lib/client/alerts";
import { accountCapabilities } from "@/lib/constants/account-capabilities";

export default function AddServicePanel({ user, setUser }) {
  const caps = accountCapabilities(user);
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [barState, setBarState] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.filter((c) => c.slug !== "attorney"));
      })
      .catch(() => {});
  }, []);

  const available = categories.filter((c) => !caps.categories.includes(c.slug));
  if (caps.isAdmin) return null;
  if (available.length === 0 && caps.isAttorney) return null;

  const addService = async () => {
    if (!categoryId) {
      toastError("Choose a service to add.");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/user/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: Number(categoryId) }),
      });
      const data = await res.json();
      if (data.error) {
        toastError(data.error.message);
        return;
      }
      if (data.user) {
        setUser?.(data.user);
        setStoredUser(data.user);
      }
      setCategoryId("");
      toastSuccess("Service added. Finish the profile below. It stays pending until an admin verifies it.");
    } catch {
      toastError("Could not add that service.");
    } finally {
      setSaving(false);
    }
  };

  const addAttorney = async () => {
    if (!barNumber.trim() || !barState.trim()) {
      toastError("Bar number and state bar are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch("/api/user/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attorney: { bar_number: barNumber.trim(), bar_state: barState.trim() },
        }),
      });
      const data = await res.json();
      if (data.error) {
        toastError(data.error.message);
        return;
      }
      if (data.user) {
        setUser?.(data.user);
        setStoredUser(data.user);
      }
      toastSuccess("Attorney profile added. It stays pending until an admin verifies it.");
    } catch {
      toastError("Could not add an attorney profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-8 border border-[rgba(0,0,0,0.09)] rounded-xl p-4 bg-bg">
      <h3 className="font-syne text-sm font-bold text-text">Add another role on this account</h3>
      <p className="text-xs text-muted mt-1 mb-4 leading-relaxed">
        Use the same login for attorney work and for translation, interpreting, or evaluations.
      </p>
      {available.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white"
          >
            <option value="">Add a service…</option>
            {available.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={saving}
            onClick={addService}
            className="bg-green text-white text-sm font-semibold py-2 px-4 rounded-lg border-none cursor-pointer disabled:opacity-50"
          >
            Add service
          </button>
        </div>
      )}
      {!caps.isAttorney && (
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
          <input
            value={barNumber}
            onChange={(e) => setBarNumber(e.target.value)}
            placeholder="Bar number"
            className="text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white"
          />
          <input
            value={barState}
            onChange={(e) => setBarState(e.target.value)}
            placeholder="State bar"
            className="text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white"
          />
          <button
            type="button"
            disabled={saving}
            onClick={addAttorney}
            className="bg-white text-text text-sm font-semibold py-2 px-4 rounded-lg border border-[rgba(0,0,0,0.15)] cursor-pointer disabled:opacity-50"
          >
            Add attorney
          </button>
        </div>
      )}
    </div>
  );
}
