"use client";

import React, { useEffect, useRef } from "react";

/** Full-page homepage preview for the CMS editor (scrollable, section anchors). */
export default function CmsFullPreview({ values, activeSection }) {
  const scrollRef = useRef(null);
  const get = (key, fallback = "") => values[key] ?? fallback;

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

        {/* Hero */}
        <div
          data-cms-section="home.hero"
          className={`bg-hero-light rounded-xl p-5 border border-[rgba(20,30,48,0.08)] ${activeSection === "home.hero" ? "ring-2 ring-green ring-offset-2" : ""}`}
        >
          <div className="text-[10px] font-semibold uppercase tracking-wider text-green mb-2">
            {get("home.hero.badge", "Immigration only · Verified attorneys")}
          </div>
          <h2 className="font-syne text-xl font-extrabold text-text whitespace-pre-line leading-tight mb-2">
            {get("home.hero.title", "The network built for\nimmigration attorneys")}
          </h2>
          <p className="text-xs text-muted leading-relaxed mb-3">
            {get("home.hero.subtitle", "Find hearing coverage…")}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-green text-white text-[10px] py-1.5 px-3 rounded-lg">
              {get("home.hero.cta_primary", "Find an attorney")}
            </span>
            <span className="border text-[10px] py-1.5 px-3 rounded-lg text-text">
              {get("home.hero.cta_secondary", "Browse job board")}
            </span>
            <span className="text-[10px] text-green py-1.5 px-2">
              {get("home.hero.cta_tertiary", "Join free →")}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div
          data-cms-section="home.stats"
          className={`bg-green-dark bg-hero-gradient rounded-lg p-4 grid grid-cols-2 gap-2 ${activeSection === "home.stats" ? "ring-2 ring-green-medium ring-offset-2" : ""}`}
        >
          {[
            ["home.stats.attorneys_count", "home.stats.attorneys_label", "1,800+", "Verified"],
            ["home.stats.states_count", "home.stats.states_label", "50 states", "Coverage"],
            ["home.stats.listings_count", "home.stats.listings_label", "340+", "Listings"],
            ["home.stats.languages_count", "home.stats.languages_label", "28", "Languages"],
          ].map(([n, l, nf, lf]) => (
            <div key={n} className="text-center text-white">
              <div className="font-syne text-lg font-extrabold">{get(n, nf)}</div>
              <div className="text-[9px] text-white/70">{get(l, lf)}</div>
            </div>
          ))}
        </div>

        {/* How it works + cards */}
        <div data-cms-section="home.how_it_works" className={activeSection === "home.how_it_works" ? "ring-2 ring-green ring-offset-2 rounded-lg p-1" : ""}>
          <div className="text-[10px] text-green font-semibold uppercase mb-1">
            {get("home.how_it_works.badge", "How it works")}
          </div>
          <div className="font-syne text-base font-bold text-text mb-3">
            {get("home.how_it_works.title", "Three ways to use ImmFlow")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {[
            ["home.card1", "home.card1.icon", "home.card1.title", "home.card1.desc", "⚖️", "Find an attorney"],
            ["home.card2", "home.card2.icon", "home.card2.title", "home.card2.desc", "📋", "Job board"],
            ["home.card3", "home.card3.icon", "home.card3.title", "home.card3.desc", "🤝", "Network"],
          ].map(([section, iconKey, titleKey, descKey, iconFb, titleFb]) => (
            <div
              key={section}
              data-cms-section={section}
              className={`bg-surface border border-[rgba(20,30,48,0.10)] rounded-lg p-3 ${activeSection === section ? "ring-2 ring-green ring-offset-1" : ""}`}
            >
              <div className="text-xl mb-1">{get(iconKey, iconFb)}</div>
              <div className="text-sm font-semibold text-text">{get(titleKey, titleFb)}</div>
              <p className="text-[10px] text-muted mt-1">{get(descKey, "…")}</p>
            </div>
          ))}
        </div>

        {/* AI */}
        <div
          data-cms-section="home.ai"
          className={`bg-surface border rounded-lg p-4 ${activeSection === "home.ai" ? "ring-2 ring-green ring-offset-2" : ""}`}
        >
          <div className="text-[10px] text-green uppercase mb-1">{get("home.ai.badge", "AI-powered")}</div>
          <div className="font-syne font-bold text-text">{get("home.ai.title", "Smart matching")}</div>
          <span className="inline-block mt-2 bg-green text-white text-[10px] px-3 py-1.5 rounded-lg">
            {get("home.ai.cta", "Try the AI matcher ✦")}
          </span>
        </div>

        {/* Featured */}
        <div
          data-cms-section="home.featured"
          className={`p-2 ${activeSection === "home.featured" ? "ring-2 ring-green ring-offset-2 rounded-lg" : ""}`}
        >
          <div className="text-[10px] text-green uppercase">{get("home.featured.badge", "Featured")}</div>
          <div className="font-syne font-bold text-text">{get("home.featured.title", "Top-rated attorneys")}</div>
        </div>

        {/* Pricing */}
        <div
          data-cms-section="home.pricing"
          className={`bg-green-light border border-green-medium rounded-lg p-4 ${activeSection === "home.pricing" ? "ring-2 ring-green ring-offset-2" : ""}`}
        >
          <div className="text-[10px] text-green-dark font-semibold uppercase mb-1">
            {get("home.pricing.badge", "Pricing")}
          </div>
          <div className="font-syne text-base font-bold text-text">
            {get("home.pricing.title", "Simple, transparent pricing")}
          </div>
          <p className="text-[10px] text-muted mt-1">{get("home.pricing.subtitle", "Free to start…")}</p>
        </div>

        {/* Join CTA */}
        <div
          data-cms-section="home.join"
          className={`bg-hero-gradient rounded-lg p-5 text-center text-white ${activeSection === "home.join" ? "ring-2 ring-green-medium ring-offset-2" : ""}`}
        >
          <div className="font-syne text-lg font-bold mb-2">{get("home.join.title", "Ready to join?")}</div>
          <p className="text-[10px] text-white/70 mb-3">{get("home.join.subtitle", "Free to join…")}</p>
          <div className="flex gap-2 justify-center flex-wrap">
            <span className="bg-white text-green-dark text-[10px] px-3 py-1.5 rounded-lg font-semibold">
              {get("home.join.cta", "Create account")}
            </span>
            <span className="border border-white/40 text-[10px] px-3 py-1.5 rounded-lg">
              {get("home.join.cta_secondary", "Browse listings")}
            </span>
          </div>
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
