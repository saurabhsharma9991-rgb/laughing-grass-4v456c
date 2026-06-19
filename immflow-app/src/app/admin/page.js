"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import CmsEditor from "@/components/admin/CmsEditor";
import PlatformSettingsPanel from "@/components/admin/PlatformSettingsPanel";
import AttorneyEditorModal from "@/components/admin/AttorneyEditorModal";
import ListingEditorModal from "@/components/admin/ListingEditorModal";
import JobCard from "@/components/JobCard";
import UsersRolesPanel from "@/components/admin/UsersRolesPanel";
import { authFetch, getStoredUser, setStoredUser, logoutSession } from "@/lib/client/auth-storage";
import { TAB_PERMISSIONS, canPerform } from "@/lib/constants/admin-permissions";

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState(null);
  const [adminAccess, setAdminAccess] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Tab controls: 'cms', 'attorneys', 'listings', 'analytics'
  const [activeTab, setActiveTab] = useState("overview");

  // CMS Content
  const [cmsItems, setCmsItems] = useState([]);
  const [cmsFormValues, setCmsFormValues] = useState({});
  const [loadingCms, setLoadingCms] = useState(false);
  const [savingCms, setSavingCms] = useState(false);

  // Resources
  const [attorneys, setAttorneys] = useState([]);
  const [listings, setListings] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState({
    totalSignups: 0,
    totalListings: 0,
    openListings: 0,
    filledListings: 0,
    proSubscribers: 0,
    estimatedRevenue: 0
  });

  // Announcement Compose
  const [announcementSubject, setAnnouncementSubject] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  const [editingAttorney, setEditingAttorney] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [savingAttorney, setSavingAttorney] = useState(false);
  const [savingListing, setSavingListing] = useState(false);

  const can = (resource, action) => {
    if (!adminAccess) return false;
    return canPerform(adminAccess.permissions, resource, action, {
      isSuperAdmin: adminAccess.isSuperAdmin,
    });
  };

  const canViewTab = (key) => {
    if (key === "users") return can("users", "view") || can("roles", "view");
    const [resource, action] = TAB_PERMISSIONS[key] || [];
    return resource ? can(resource, action) : true;
  };

  const loadAdminAccess = async () => {
    const res = await authFetch("/api/admin/me");
    const data = await res.json();
    if (!data.error) {
      setAdminAccess(data);
      setAdminUser(data);
      setStoredUser(data);
      return data;
    }
    return null;
  };

  useEffect(() => {
    const saved = getStoredUser();
    if (saved?.role === "admin") {
      loadAdminAccess().then((access) => {
        if (access) loadAllData(access);
      });
    }
  }, []);

  const loadAllData = (access = adminAccess) => {
    const check = (resource, action) =>
      canPerform(access?.permissions, resource, action, { isSuperAdmin: access?.isSuperAdmin });

    if (check("cms", "view")) loadCmsContent();
    if (check("analytics", "view") || check("attorneys", "view") || check("listings", "view")) {
      loadResourcesAndAnalytics(access);
    }
  };

  const loadCmsContent = async () => {
    setLoadingCms(true);
    try {
      const res = await authFetch("/api/admin/content");
      const data = await res.json();
      if (!data.error) {
        setCmsItems(data);
        const formVals = {};
        data.forEach(item => {
          formVals[item.key] = item.value;
        });
        setCmsFormValues(formVals);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCms(false);
    }
  };

  const loadResourcesAndAnalytics = async (access = adminAccess) => {
    setLoadingResources(true);
    try {
      const check = (resource, action) =>
        canPerform(access?.permissions, resource, action, { isSuperAdmin: access?.isSuperAdmin });

      const fetches = [];
      if (check("attorneys", "view")) {
        fetches.push(authFetch("/api/admin/attorneys").then((r) => r.json()));
      } else {
        fetches.push(Promise.resolve([]));
      }
      if (check("listings", "view")) {
        fetches.push(authFetch("/api/listings").then((r) => r.json()));
      } else {
        fetches.push(Promise.resolve([]));
      }
      if (check("analytics", "view")) {
        fetches.push(authFetch("/api/admin/analytics").then((r) => r.json()));
      } else {
        fetches.push(Promise.resolve({}));
      }

      const [dataAttorneys, dataListings, dataAnalytics] = await Promise.all(fetches);

      if (Array.isArray(dataAttorneys)) setAttorneys(dataAttorneys);
      if (Array.isArray(dataListings)) setListings(dataListings);
      if (!dataAnalytics.error) setAnalytics(dataAnalytics);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.error) {
        setLoginError(data.error.message || "Login failed");
      } else if (data.user.role !== "admin") {
        setLoginError("Access denied: Admin role required.");
      } else {
        setStoredUser(data.user);
        const access = await loadAdminAccess();
        if (access) {
          loadAllData(access);
          const tabOrder = ["overview", "cms", "settings", "attorneys", "listings", "broadcast", "users"];
          const check = (resource, action) =>
            canPerform(access.permissions, resource, action, { isSuperAdmin: access.isSuperAdmin });
          const firstTab = tabOrder.find((t) => {
            if (t === "users") return check("users", "view") || check("roles", "view");
            const [resource, action] = TAB_PERMISSIONS[t] || [];
            return resource ? check(resource, action) : false;
          });
          if (firstTab) setActiveTab(firstTab);
        }
      }
    } catch (err) {
      setLoginError("Connection failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutSession();
    setAdminUser(null);
    setAdminAccess(null);
    setEmail("");
    setPassword("");
  };

  const handleSaveCms = async () => {
    setSavingCms(true);
    try {
      const res = await authFetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates: cmsFormValues }),
      });
      const data = await res.json();
      if (data.success) {
        alert("CMS content updated successfully on the live database!");
        loadCmsContent();
      } else {
        alert("Failed to save: " + (data.error?.message || data.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save content. Connection error.");
    } finally {
      setSavingCms(false);
    }
  };

  const handleToggleAttorneyPro = async (attorney) => {
    try {
      const targetPro = !attorney.user?.isPro;
      const res = await authFetch("/api/admin/attorneys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: attorney.id, isPro: targetPro }),
      });
      const data = await res.json();
      if (data.success) {
        setAttorneys(
          attorneys.map((a) =>
            a.id === attorney.id
              ? {
                  ...a,
                  user: {
                    ...a.user,
                    isPro: targetPro,
                    subscriptionPlan: targetPro ? "Pro (Admin)" : "Free",
                  },
                }
              : a
          )
        );
      } else {
        alert(data.error?.message || "Failed to update plan.");
      }
    } catch {
      alert("Failed to update plan. Connection error.");
    }
  };

  const handleToggleAttorneyVerification = async (id, currentVerified) => {
    try {
      const targetVerified = !currentVerified;
      const res = await authFetch("/api/admin/attorneys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isVerified: targetVerified }),
      });
      const data = await res.json();
      if (data.success) {
        setAttorneys(attorneys.map((a) => (a.id === id ? { ...a, isVerified: targetVerified } : a)));
        loadResourcesAndAnalytics();
      } else {
        alert("Verification update failed: " + (data.error?.message || data.error || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Verification update failed. Connection error.");
    }
  };

  const handleDeleteAttorney = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this attorney account? This will permanently remove their user account, listings, and profile details."
      )
    ) {
      return;
    }
    try {
      const res = await authFetch(`/api/admin/attorneys?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setAttorneys(attorneys.filter((a) => a.id !== id));
        loadResourcesAndAnalytics();
      } else {
        alert("Failed to delete attorney: " + (data.error?.message || data.error || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete attorney. Connection error.");
    }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm("Are you sure you want to moderate/delete this job board listing?")) {
      return;
    }
    try {
      const res = await authFetch(`/api/admin/listings?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setListings(listings.filter((l) => l.id !== id));
        loadResourcesAndAnalytics();
      } else {
        alert("Failed to delete listing: " + (data.error?.message || data.error || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete listing. Connection error.");
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!announcementSubject || !announcementContent) {
      alert("Please fill in both the subject and announcement body.");
      return;
    }
    setSendingBroadcast(true);
    try {
      const res = await authFetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: announcementSubject, content: announcementContent }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Announcement queued for ${data.recipientCount} recipients.`);
        setAnnouncementSubject("");
        setAnnouncementContent("");
      } else {
        alert(data.error?.message || data.error || "Broadcast failed.");
      }
    } catch (e) {
      console.error(e);
      alert("Broadcast failed. Connection error.");
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleSaveAttorney = async (payload) => {
    setSavingAttorney(true);
    try {
      const res = await authFetch("/api/admin/attorneys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.attorney) {
        setEditingAttorney(null);
        loadResourcesAndAnalytics();
      } else {
        alert(data.error?.message || "Failed to save attorney.");
      }
    } catch {
      alert("Failed to save attorney.");
    } finally {
      setSavingAttorney(false);
    }
  };

  const handleSaveListing = async (payload) => {
    setSavingListing(true);
    try {
      const res = await authFetch("/api/admin/listings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditingListing(null);
        loadResourcesAndAnalytics();
      } else {
        alert(data.error?.message || "Failed to save listing.");
      }
    } catch {
      alert("Failed to save listing.");
    } finally {
      setSavingListing(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ────────────────────────────────────────────────────────────────────────────
  if (!adminUser) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-dm-sans">
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-2xl p-8 max-w-[400px] w-full shadow-lg">
          <div className="text-center mb-6">
            <span className="text-3xl">🛡️</span>
            <h1 className="font-syne text-2xl font-extrabold text-text mt-3">
              ImmFlow Admin CMS
            </h1>
            <p className="text-xs text-muted mt-1">
              Authorized legal systems administration access only
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-text block mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@myimmflow.com"
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text block mb-1">
                Security Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
              />
            </div>

            {loginError && (
              <div className="bg-red-light border border-red text-red text-xs p-2.5 rounded-lg">
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="bg-green hover:bg-green-dark text-white py-3 rounded-lg border-none cursor-pointer text-sm font-semibold transition-all duration-200 mt-2 disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loggingIn ? "Logging in..." : "Access Control Panel"}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-green hover:underline font-semibold">
              ← Return to public website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Group CMS items by section — removed; CmsEditor handles grouping

  const navItems = [
    ["overview", "📊 Overview"],
    ["cms", "✏️ Site content"],
    ["settings", "⚙️ Features & test mode"],
    ["attorneys", "⚖️ Attorneys"],
    ["listings", "📋 Listings"],
    ["broadcast", "📢 Broadcast"],
    ["users", "👥 Users & roles"],
  ].filter(([key]) => canViewTab(key));

  return (
    <div className="min-h-screen bg-bg font-dm-sans flex flex-col lg:flex-row">
      <aside className="lg:w-56 xl:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[rgba(0,0,0,0.09)] shrink-0">
        <div className="p-5 border-b border-[rgba(0,0,0,0.09)]">
          <div className="font-syne text-lg font-extrabold text-text">
            Imm<span className="text-green">Flow</span>
          </div>
          <div className="text-[10px] text-muted mt-0.5">Admin dashboard</div>
        </div>
        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto">
          {navItems.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`text-left py-2.5 px-3 rounded-lg text-[13px] font-medium cursor-pointer whitespace-nowrap transition-all ${
                activeTab === key ? "bg-green text-white" : "text-muted hover:bg-bg hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-[rgba(0,0,0,0.09)] hidden lg:block">
          <Link href="/" className="block text-xs text-green hover:underline mb-2">← View live site</Link>
          <div className="text-[10px] text-muted truncate">{adminUser.email}</div>
          <button type="button" onClick={handleLogout} className="mt-2 text-xs text-red bg-transparent border-none cursor-pointer hover:underline">Sign out</button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
        {activeTab === "overview" && (
          <div>
            <h1 className="font-syne text-2xl font-extrabold text-text mb-6">Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ["Signups", analytics.totalSignups],
                ["Listings", analytics.totalListings],
                ["Pro", analytics.proSubscribers],
                ["Revenue", `$${analytics.estimatedRevenue}`],
              ].map(([lbl, val]) => (
                <div key={lbl} className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 shadow-sm">
                  <div className="text-[10px] text-muted uppercase font-semibold">{lbl}</div>
                  <div className="text-2xl font-extrabold text-text font-syne mt-1">{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "cms" && (
          <div>
            <div className="mb-6">
              <h1 className="font-syne text-2xl font-extrabold text-text">Site content</h1>
              <p className="text-sm text-muted mt-1">
                Pick a section on the left, edit fields in the center, and watch the full homepage
                preview update on the right.
              </p>
            </div>
            <CmsEditor
              cmsItems={cmsItems}
              cmsFormValues={cmsFormValues}
              setCmsFormValues={setCmsFormValues}
              onPublish={can("cms", "edit") ? handleSaveCms : undefined}
              saving={savingCms}
              loading={loadingCms}
            />
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h1 className="font-syne text-2xl font-extrabold text-text mb-2">
              Features &amp; test mode
            </h1>
            <p className="text-sm text-muted mb-6">
              Manage Free vs Pro feature access and enable test mode for staging.
            </p>
            <PlatformSettingsPanel readOnly={!can("settings", "edit")} />
          </div>
        )}

        {activeTab === "attorneys" && (
          <div>
            <div className="mb-6">
              <h1 className="font-syne text-2xl font-extrabold text-text">Attorneys</h1>
              <p className="text-sm text-muted mt-1">
                Moderate registrations, verify bar credentials, manage Pro plans, and edit full profiles.
              </p>
            </div>
            {loadingResources ? (
              <div className="text-center py-16 text-muted">Loading attorney records…</div>
            ) : (
              <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs text-left min-w-[900px]">
                    <thead>
                      <tr className="border-b-2 border-[rgba(0,0,0,0.09)] bg-bg/50 text-muted font-semibold">
                        <th className="p-3 pl-4">Name / Contact</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Rate · Exp</th>
                        <th className="p-3">State bar</th>
                        <th className="p-3">Plan</th>
                        <th className="p-3 text-center">Verified</th>
                        <th className="p-3 text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attorneys.map((a) => (
                        <tr
                          key={a.id}
                          className="border-b border-[rgba(0,0,0,0.07)] hover:bg-bg/40 align-top"
                        >
                          <td className="p-3 pl-4">
                            <div className="font-semibold text-text text-sm">{a.name}</div>
                            <div className="text-[10px] text-muted mt-0.5">{a.user?.email}</div>
                            <div className="text-[10px] text-muted-high mt-1 max-w-[200px] truncate">
                              {a.availability || "—"}
                            </div>
                          </td>
                          <td className="p-3 text-muted">{a.location || "—"}</td>
                          <td className="p-3 text-muted whitespace-nowrap">
                            {a.rate || "—"}
                            <br />
                            <span className="text-[10px] text-muted-high">
                              {a.experienceYears != null ? `${a.experienceYears} yrs` : "—"}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-[11px]">
                            <code>{a.barNumber || "N/A"}</code>
                            <br />
                            <span className="text-muted-high">({a.stateBar || "N/A"})</span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                a.user?.isPro
                                  ? "bg-green-light text-green-dark"
                                  : "bg-bg text-muted border border-[rgba(0,0,0,0.09)]"
                              }`}
                            >
                              {a.user?.isPro ? "🌟 Pro" : "Free"}
                            </span>
                            <div className="text-[10px] text-muted-high mt-1">
                              {a.user?.subscriptionPlan || "Free"}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                                a.isVerified
                                  ? "bg-green-light text-green-dark"
                                  : "bg-amber-light text-amber"
                              }`}
                            >
                              {a.isVerified ? "✓ Verified" : "Pending"}
                            </span>
                          </td>
                          <td className="p-3 pr-4">
                            <div className="flex flex-col items-end gap-1.5">
                              {can("attorneys", "edit") && (
                                <button
                                  type="button"
                                  onClick={() => setEditingAttorney(a)}
                                  className="border-none bg-green text-white cursor-pointer font-semibold text-[11px] py-1.5 px-3 rounded-lg hover:bg-green-dark transition-all"
                                >
                                  Edit profile
                                </button>
                              )}
                              {can("attorneys", "edit") && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttorneyPro(a)}
                                  className={`border-none bg-transparent cursor-pointer font-bold text-[11px] ${
                                    a.user?.isPro
                                      ? "text-muted hover:text-text"
                                      : "text-green hover:text-green-dark"
                                  }`}
                                >
                                  {a.user?.isPro ? "Revoke Pro" : "Grant Pro"}
                                </button>
                              )}
                              {can("attorneys", "edit") && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleAttorneyVerification(a.id, a.isVerified)}
                                  className={`border-none bg-transparent cursor-pointer font-bold text-[11px] ${
                                    a.isVerified
                                      ? "text-amber hover:text-[#905000]"
                                      : "text-green hover:text-green-dark"
                                  }`}
                                >
                                  {a.isVerified ? "Revoke verification" : "Approve & verify"}
                                </button>
                              )}
                              {can("attorneys", "delete") && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAttorney(a.id)}
                                  className="border-none bg-transparent cursor-pointer font-bold text-[11px] text-red hover:text-red-dark"
                                >
                                  Delete account
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {attorneys.length === 0 && (
                  <div className="text-center py-12 text-muted text-sm">No attorney records found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "listings" && (
          <div>
            <h1 className="font-syne text-2xl font-extrabold text-text mb-6">Listings</h1>
            {loadingResources ? <div className="text-center py-16 text-muted">Loading…</div> : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map((l) => (
                  <div key={l.id}>
                    <JobCard j={l} />
                    <div className="flex gap-2 mt-2">
                      {can("listings", "edit") && (
                        <button type="button" onClick={() => setEditingListing(l)} className="flex-1 bg-green text-white text-[11px] py-2 rounded-lg border-none cursor-pointer">Edit</button>
                      )}
                      {can("listings", "delete") && (
                        <button type="button" onClick={() => handleDeleteListing(l.id)} className="text-[11px] text-red border border-red py-2 px-3 rounded-lg cursor-pointer">Delete</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "broadcast" && (
          <div className="max-w-xl">
            <h1 className="font-syne text-2xl font-extrabold text-text mb-6">Broadcast</h1>
            <form onSubmit={handleSendBroadcast} className="bg-white border rounded-xl p-6 space-y-4">
              <input type="text" required value={announcementSubject} onChange={(e) => setAnnouncementSubject(e.target.value)} placeholder="Subject" className="w-full text-sm p-2.5 border rounded-lg" />
              <textarea required value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)} rows={5} placeholder="Message" className="w-full text-sm p-2.5 border rounded-lg" />
              <button type="submit" disabled={sendingBroadcast || !can("broadcast", "create")} className="bg-green text-white py-2.5 px-5 rounded-lg border-none text-sm font-semibold cursor-pointer disabled:opacity-60">{sendingBroadcast ? "Sending…" : "Send"}</button>
            </form>
          </div>
        )}

        {activeTab === "users" && (
          <UsersRolesPanel can={can} currentUserId={adminUser?.id} />
        )}
      </main>

      {editingAttorney && <AttorneyEditorModal attorney={editingAttorney} onClose={() => setEditingAttorney(null)} onSave={handleSaveAttorney} saving={savingAttorney} />}
      {editingListing && <ListingEditorModal listing={editingListing} onClose={() => setEditingListing(null)} onSave={handleSaveListing} saving={savingListing} />}
    </div>
  );
}
