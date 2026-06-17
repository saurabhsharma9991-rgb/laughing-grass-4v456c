"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import CmsPreview from "@/components/admin/CmsPreview";
import AttorneyEditorModal from "@/components/admin/AttorneyEditorModal";
import ListingEditorModal from "@/components/admin/ListingEditorModal";
import JobCard from "@/components/JobCard";

export default function AdminPage() {
  const [adminUser, setAdminUser] = useState(null);
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

  useEffect(() => {
    const savedUserStr = localStorage.getItem("immflow_user");
    const token = localStorage.getItem("immflow_token");
    if (savedUserStr && token) {
      try {
        const parsed = JSON.parse(savedUserStr);
        if (parsed.role === "admin") {
          setAdminUser(parsed);
          loadAllData(token);
        }
      } catch (e) {
        console.error("Failed to parse admin session", e);
      }
    }
  }, []);

  const loadAllData = (token) => {
    loadCmsContent(token);
    loadResourcesAndAnalytics(token);
  };

  const loadCmsContent = async (token) => {
    setLoadingCms(true);
    try {
      const res = await fetch("/api/admin/content", {
        headers: { "Authorization": `Bearer ${token}` }
      });
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

  const loadResourcesAndAnalytics = async (token) => {
    setLoadingResources(true);
    try {
      const authHeader = { "Authorization": `Bearer ${token}` };
      
      const [resAttorneys, resListings, resAnalytics] = await Promise.all([
        fetch("/api/admin/attorneys", { headers: authHeader }),
        fetch("/api/listings"),
        fetch("/api/admin/analytics", { headers: authHeader })
      ]);

      const dataAttorneys = await resAttorneys.json();
      const dataListings = await resListings.json();
      const dataAnalytics = await resAnalytics.json();

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
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.error) {
        setLoginError(data.error.message || "Login failed");
      } else if (data.user.role !== "admin") {
        setLoginError("Access denied: Admin role required.");
      } else {
        setAdminUser(data.user);
        localStorage.setItem("immflow_user", JSON.stringify(data.user));
        localStorage.setItem("immflow_token", data.access_token);
        loadAllData(data.access_token);
      }
    } catch (err) {
      setLoginError("Connection failed. Please try again.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("immflow_user");
    localStorage.removeItem("immflow_token");
    setAdminUser(null);
    setEmail("");
    setPassword("");
  };

  // 1. Save CMS Content
  const handleSaveCms = async () => {
    setSavingCms(true);
    try {
      const token = localStorage.getItem("immflow_token");
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ updates: cmsFormValues }),
      });
      const data = await res.json();
      if (data.success) {
        alert("CMS content updated successfully on the live database!");
        loadCmsContent(token);
      } else {
        alert("Failed to save: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to save content. Connection error.");
    } finally {
      setSavingCms(false);
    }
  };

  // 2. Toggle Attorney Verification Status
  const handleToggleAttorneyVerification = async (id, currentVerified) => {
    try {
      const token = localStorage.getItem("immflow_token");
      const targetVerified = !currentVerified;
      const res = await fetch("/api/admin/attorneys", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id, isVerified: targetVerified }),
      });
      const data = await res.json();
      if (data.success) {
        setAttorneys(attorneys.map(a => a.id === id ? { ...a, isVerified: targetVerified } : a));
        // Reload analytics
        loadResourcesAndAnalytics(token);
      } else {
        alert("Verification update failed: " + (data.error || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Verification update failed. Connection error.");
    }
  };

  // 3. Delete Attorney Account
  const handleDeleteAttorney = async (id) => {
    if (!confirm("Are you sure you want to delete this attorney account? This will permanently remove their user account, listings, and profile details.")) {
      return;
    }
    try {
      const token = localStorage.getItem("immflow_token");
      const res = await fetch(`/api/admin/attorneys?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setAttorneys(attorneys.filter(a => a.id !== id));
        loadResourcesAndAnalytics(token);
      } else {
        alert("Failed to delete attorney: " + (data.error || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete attorney. Connection error.");
    }
  };

  // 4. Delete Listing
  const handleDeleteListing = async (id) => {
    if (!confirm("Are you sure you want to moderate/delete this job board listing?")) {
      return;
    }
    try {
      const token = localStorage.getItem("immflow_token");
      const res = await fetch(`/api/admin/listings?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setListings(listings.filter(l => l.id !== id));
        loadResourcesAndAnalytics(token);
      } else {
        alert("Failed to delete listing: " + (data.error || ""));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete listing. Connection error.");
    }
  };

  // 5. Send Announcements Broadcast
  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!announcementSubject || !announcementContent) {
      alert("Please fill in both the subject and announcement body.");
      return;
    }
    setSendingBroadcast(true);
    try {
      const token = localStorage.getItem("immflow_token");
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ subject: announcementSubject, content: announcementContent }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Broadcast simulation success! Recipient count: ${data.recipients.length}\nEmails printed to server stdout.`);
        setAnnouncementSubject("");
        setAnnouncementContent("");
      } else {
        alert("Broadcast failed: " + (data.error || ""));
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
      const token = localStorage.getItem("immflow_token");
      const res = await fetch("/api/admin/attorneys", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success || data.attorney) {
        setEditingAttorney(null);
        loadResourcesAndAnalytics(token);
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
      const token = localStorage.getItem("immflow_token");
      const res = await fetch("/api/admin/listings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setEditingListing(null);
        loadResourcesAndAnalytics(token);
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

  // Group CMS items by section
  const groupedCms = {};
  cmsItems.forEach(item => {
    if (!groupedCms[item.section]) {
      groupedCms[item.section] = [];
    }
    groupedCms[item.section].push(item);
  });

  const navItems = [
    ["overview", "📊 Overview"],
    ["cms", "✏️ Site content"],
    ["attorneys", "⚖️ Attorneys"],
    ["listings", "📋 Listings"],
    ["broadcast", "📢 Broadcast"],
  ];

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
            <div className="flex justify-between items-start mb-6 gap-4 flex-wrap">
              <h1 className="font-syne text-2xl font-extrabold text-text">Site content</h1>
              <button type="button" onClick={handleSaveCms} disabled={savingCms || loadingCms} className="bg-green text-white py-2.5 px-5 rounded-lg border-none text-sm font-semibold cursor-pointer disabled:opacity-60">
                {savingCms ? "Publishing…" : "Publish changes"}
              </button>
            </div>
            {loadingCms ? (
              <div className="text-center py-16 text-muted">Loading…</div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="space-y-4 max-h-[75vh] overflow-y-auto">
                  {Object.entries(groupedCms).map(([section, items]) => (
                    <div key={section} className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5">
                      <h3 className="text-xs font-bold text-green-dark uppercase mb-3">{section.replace(/\./g, " / ")}</h3>
                      {items.map((item) => (
                        <div key={item.key} className="mb-3">
                          <label className="text-xs font-semibold text-text block mb-1">{item.label}</label>
                          {item.type === "textarea" ? (
                            <textarea value={cmsFormValues[item.key] || ""} onChange={(e) => setCmsFormValues({ ...cmsFormValues, [item.key]: e.target.value })} className="w-full p-2 text-xs border rounded-lg min-h-[64px] focus:outline-none focus:border-green" />
                          ) : (
                            <input type="text" value={cmsFormValues[item.key] || ""} onChange={(e) => setCmsFormValues({ ...cmsFormValues, [item.key]: e.target.value })} className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:border-green" />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <CmsPreview values={cmsFormValues} />
              </div>
            )}
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
                              <button
                                type="button"
                                onClick={() => setEditingAttorney(a)}
                                className="border-none bg-green text-white cursor-pointer font-semibold text-[11px] py-1.5 px-3 rounded-lg hover:bg-green-dark transition-all"
                              >
                                Edit profile
                              </button>
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
                              <button
                                type="button"
                                onClick={() => handleDeleteAttorney(a.id)}
                                className="border-none bg-transparent cursor-pointer font-bold text-[11px] text-red hover:text-red-dark"
                              >
                                Delete account
                              </button>
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
                      <button type="button" onClick={() => setEditingListing(l)} className="flex-1 bg-green text-white text-[11px] py-2 rounded-lg border-none cursor-pointer">Edit</button>
                      <button type="button" onClick={() => handleDeleteListing(l.id)} className="text-[11px] text-red border border-red py-2 px-3 rounded-lg cursor-pointer">Delete</button>
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
              <button type="submit" disabled={sendingBroadcast} className="bg-green text-white py-2.5 px-5 rounded-lg border-none text-sm font-semibold cursor-pointer">{sendingBroadcast ? "Sending…" : "Send"}</button>
            </form>
          </div>
        )}
      </main>

      {editingAttorney && <AttorneyEditorModal attorney={editingAttorney} onClose={() => setEditingAttorney(null)} onSave={handleSaveAttorney} saving={savingAttorney} />}
      {editingListing && <ListingEditorModal listing={editingListing} onClose={() => setEditingListing(null)} onSave={handleSaveListing} saving={savingListing} />}
    </div>
  );
}
