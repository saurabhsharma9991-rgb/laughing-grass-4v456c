"use client";

import React, { useMemo, useState } from "react";
import { CMS_SECTION_GROUPS } from "@/lib/constants/cms-sections";
import CmsFullPreview from "./CmsFullPreview";

export default function CmsEditor({
  cmsItems,
  cmsFormValues,
  setCmsFormValues,
  onPublish,
  saving,
  loading,
}) {
  const [activeSection, setActiveSection] = useState("home.hero");

  const grouped = useMemo(() => {
    const map = {};
    cmsItems.forEach((item) => {
      if (!map[item.section]) map[item.section] = [];
      map[item.section].push(item);
    });
    return map;
  }, [cmsItems]);

  const activeMeta = CMS_SECTION_GROUPS.flatMap((g) => g.sections).find(
    (s) => s.id === activeSection
  );

  const activeItems = grouped[activeSection] || [];

  if (loading) {
    return <div className="text-center py-16 text-muted">Loading content…</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_minmax(280px,1fr)] gap-4 min-h-[calc(100vh-10rem)]">
      {/* Section sidebar — Shopify-style */}
      <aside className="bg-surface border border-[rgba(20,30,48,0.10)] rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-10rem)]">
        <div className="px-4 py-3 border-b border-[rgba(20,30,48,0.10)] shrink-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Sections
          </div>
        </div>
        <nav className="overflow-y-auto flex-1 p-2 space-y-4">
          {CMS_SECTION_GROUPS.map((group) => (
            <div key={group.page}>
              <div className="text-[10px] font-bold text-muted-high uppercase px-2 mb-1.5">
                {group.page}
              </div>
              <div className="space-y-0.5">
                {group.sections.map((section) => {
                  const isActive = activeSection === section.id;
                  const fieldCount = grouped[section.id]?.length || 0;
                  if (!fieldCount && section.id !== "navigation") return null;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer border-none ${
                        isActive
                          ? "bg-green text-white shadow-sm"
                          : "bg-transparent text-text hover:bg-bg"
                      }`}
                    >
                      <div className="font-semibold">{section.label}</div>
                      <div className={`text-[10px] mt-0.5 ${isActive ? "text-white/75" : "text-muted"}`}>
                        {section.description}
                        {fieldCount > 0 && ` · ${fieldCount} fields`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Active section editor */}
      <div className="bg-surface border border-[rgba(20,30,48,0.10)] rounded-xl flex flex-col max-h-[calc(100vh-10rem)] min-h-0">
        <div className="px-5 py-4 border-b border-[rgba(20,30,48,0.10)] shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-green mb-1">
            Editing section
          </div>
          <h2 className="font-syne text-lg font-extrabold text-text">
            {activeMeta?.label || activeSection}
          </h2>
          <p className="text-xs text-muted mt-1">{activeMeta?.description}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeItems.length === 0 ? (
            <p className="text-sm text-muted">No editable fields in this section.</p>
          ) : (
            activeItems.map((item) => (
              <div key={item.key}>
                <label className="text-xs font-semibold text-text block mb-1.5">
                  {item.label}
                </label>
                <p className="text-[10px] text-muted-high mb-1.5 font-mono">{item.key}</p>
                {item.type === "textarea" ? (
                  <textarea
                    value={cmsFormValues[item.key] || ""}
                    onChange={(e) =>
                      setCmsFormValues({ ...cmsFormValues, [item.key]: e.target.value })
                    }
                    className="w-full p-3 text-sm border border-[rgba(20,30,48,0.15)] rounded-lg min-h-[88px] focus:outline-none focus:border-green bg-bg"
                  />
                ) : (
                  <input
                    type="text"
                    value={cmsFormValues[item.key] || ""}
                    onChange={(e) =>
                      setCmsFormValues({ ...cmsFormValues, [item.key]: e.target.value })
                    }
                    className="w-full p-3 text-sm border border-[rgba(20,30,48,0.15)] rounded-lg focus:outline-none focus:border-green bg-bg"
                  />
                )}
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-[rgba(20,30,48,0.10)] shrink-0">
          <button
            type="button"
            onClick={onPublish}
            disabled={saving}
            className="w-full bg-green text-white py-2.5 rounded-lg border-none text-sm font-semibold cursor-pointer disabled:opacity-60"
          >
            {saving ? "Publishing…" : "Publish all changes"}
          </button>
        </div>
      </div>

      {/* Full scrollable preview */}
      <div className="min-h-0 hidden lg:block">
        <CmsFullPreview values={cmsFormValues} activeSection={activeSection} />
      </div>
    </div>
  );
}
