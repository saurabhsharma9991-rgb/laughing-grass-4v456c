"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { HOME_BLOCK_TYPES } from "@/lib/constants/homepage-blocks";
import {
  parseHomepageDocument,
  resolveHomepageDocument,
} from "@/lib/utils/homepage-document";

/** Full-page homepage preview for the CMS editor (scrollable, section anchors). */
export default function CmsFullPreview({ values, activeSection }) {
  const scrollRef = useRef(null);
  const get = (key, fallback = "") => values[key] ?? fallback;

  const homeLayout = useMemo(
    () => resolveHomepageDocument(values["home.layout"], get),
    [values]
  );

  const layoutParsed = parseHomepageDocument(values["home.layout"]);
  const waysBlock = homeLayout.blocks.find((b) => b.type === "home_ways");

  useEffect(() => {
    if (!activeSection || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-cms-section="${activeSection}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  return (
    <div className="flex flex-col h-full min-h-0 border border-[rgba(20,30,48,0.12)] rounded-xl overflow-hidden bg-bg shadow-sm">
      <div className="shrink-0 px-4 py-2.5 border-b border-[rgba(20,30,48,0.10)] bg-surface flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Live preview — Homepage
        </span>
        <span className="text-[10px] text-muted-high">Scrolls with selected section</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4 max-h-[calc(100vh-12rem)]">
        {/* Navigation */}
        <div
          data-cms-section="navigation"
          className={`rounded-lg transition-all ${activeSection === "navigation" ? "ring-2 ring-green ring-offset-2" : ""}`}
        >
          <div className="bg-surface border border-[rgba(20,30,48,0.10)] rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="font-syne font-extrabold text-text">
              {get("nav.logo_text", "ImmFlow")}
            </span>
            <div className="flex gap-2 text-[10px]">
              <span className="text-muted">{get("nav.btn_login", "Log in")}</span>
              <span className="bg-green text-white px-2 py-1 rounded">{get("nav.btn_signup", "Sign up")}</span>
            </div>
          </div>
        </div>

        {/* Homepage block layout */}
        <div
          data-cms-section="home.layout"
          className={`rounded-xl p-4 border border-[rgba(20,30,48,0.10)] bg-surface ${activeSection === "home.layout" ? "ring-2 ring-green ring-offset-2" : ""}`}
        >
          <p className="text-[10px] text-muted mb-3 leading-relaxed">
            Homepage uses block layout — preview the full page on the live site after publishing.
          </p>
          <div className="text-[10px] font-semibold uppercase text-green mb-2">Section order</div>
          <ol className="text-xs text-text space-y-1 mb-4 list-decimal list-inside">
            {homeLayout.blocks.map((b) => {
              const meta = HOME_BLOCK_TYPES.find((t) => t.type === b.type);
              return (
                <li key={b.id}>
                  {meta?.icon} {meta?.label || b.type}
                </li>
              );
            })}
          </ol>
          {waysBlock && (
            <>
              <div className="text-[10px] font-semibold uppercase text-green mb-2">
                {waysBlock.data?.badge || "Ways to use ImmFlow"}
              </div>
              <div className="font-syne text-sm font-bold text-text mb-2">
                {waysBlock.data?.title}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {(waysBlock.data?.cards || []).map((card, idx) => (
                  <div
                    key={idx}
                    className="bg-bg border border-[rgba(20,30,48,0.08)] rounded-lg p-2"
                  >
                    <div className="text-lg">{card.icon}</div>
                    <div className="text-xs font-semibold text-text">{card.title}</div>
                    <p className="text-[10px] text-muted">{card.desc}</p>
                    <div className="text-[9px] text-green mt-1">
                      {card.cta} → {card.href}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {!layoutParsed && (
            <p className="text-[10px] text-muted-high mt-2">
              Layout not saved yet — defaults from legacy CMS keys until you publish.
            </p>
          )}
        </div>

        {/* Footer */}
        <div
          data-cms-section="footer"
          className={`bg-green-dark bg-hero-gradient rounded-lg p-4 text-white ${activeSection === "footer" ? "ring-2 ring-green-medium ring-offset-2" : ""}`}
        >
          <div className="font-syne font-bold">{get("footer.logo_text", "ImmFlow")}</div>
          <p className="text-[10px] text-white/60 mt-2 leading-relaxed">
            {get("footer.description", "The immigration attorney network…")}
          </p>
          <div className="text-[9px] text-white/40 mt-3">{get("footer.copyright", "© 2026 ImmFlow")}</div>
        </div>
      </div>
    </div>
  );
}
