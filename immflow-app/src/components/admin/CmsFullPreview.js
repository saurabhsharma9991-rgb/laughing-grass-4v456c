"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { HOME_BLOCK_TYPES } from "@/lib/constants/homepage-blocks";
import { resolveHomepageDocument } from "@/lib/utils/homepage-document";
import { Icon } from "@/components/icons/Icon";

const AI_FEATURE_CARDS = [
  {
    icon: "spark",
    title: "AI attorney matcher",
    desc: "Describe your need. AI returns ranked matches with fit scores.",
  },
  {
    icon: "search",
    title: "Natural language search",
    desc: "Type what you need instead of filling out 10 dropdowns.",
  },
  {
    icon: "chat",
    title: "Client intake chatbot",
    desc: "Visitors answer a few questions and get routed automatically.",
  },
];

function formatHeroTitle(text) {
  const parts = String(text || "").split("\n");
  return parts.map((part, index) => (
    <span key={index}>
      {index > 0 && <br />}
      {part}
    </span>
  ));
}

function PreviewBlock({ block }) {
  const d = block.data || {};

  switch (block.type) {
    case "home_hero":
      return (
        <section className="relative bg-hero-light border border-[rgba(20,30,48,0.08)] rounded-xl p-5 overflow-hidden">
          <div className="text-center max-w-md mx-auto">
            <div className="font-syne text-lg font-extrabold text-text mb-1">
              Imm<span className="text-green">Flow</span>
            </div>
            <div className="text-[9px] font-medium tracking-wider uppercase text-green mb-2">
              {d.badge}
            </div>
            <h1 className="font-syne text-xl font-extrabold leading-tight text-text mb-2">
              {formatHeroTitle(d.title)}
            </h1>
            <p className="text-[11px] text-muted leading-relaxed mb-3">{d.subtitle}</p>
            <div className="flex flex-wrap justify-center gap-2 text-[10px]">
              {d.cta_primary && (
                <span className="bg-green text-white px-2.5 py-1 rounded-md font-semibold">
                  {d.cta_primary}
                </span>
              )}
              {d.cta_secondary && (
                <span className="border border-[rgba(0,0,0,0.12)] px-2.5 py-1 rounded-md text-text">
                  {d.cta_secondary}
                </span>
              )}
              {d.cta_tertiary && (
                <span className="text-green font-semibold">{d.cta_tertiary}</span>
              )}
            </div>
            <p className="text-[9px] text-muted-high mt-3">
              Category tiles + AI finder appear on the live page with this section.
            </p>
          </div>
        </section>
      );

    case "home_network":
      return (
        <section className="bg-white border border-[rgba(20,30,48,0.08)] rounded-xl p-4">
          <div className="text-[9px] font-medium tracking-wider uppercase text-green mb-1">
            {d.badge}
          </div>
          <h2 className="font-syne text-base font-extrabold text-text mb-1">{d.title}</h2>
          <p className="text-[11px] text-muted leading-relaxed mb-3">{d.body}</p>
          <div className="flex flex-wrap gap-2 text-[10px]">
            <span className="bg-green text-white px-2.5 py-1 rounded-md">{d.primaryLabel}</span>
            <span className="border border-[rgba(0,0,0,0.12)] px-2.5 py-1 rounded-md">
              {d.secondaryLabel}
            </span>
          </div>
          <div className="mt-3 bg-bg rounded-lg p-3 border border-[rgba(0,0,0,0.06)]">
            <div className="text-[9px] text-green font-medium mb-1">{d.aiPanelTitle}</div>
            <div className="text-[10px] text-muted">AI match panel preview</div>
            <span className="inline-block mt-2 text-[10px] bg-green text-white px-2 py-1 rounded">
              {d.aiPanelCta}
            </span>
          </div>
        </section>
      );

    case "home_stats":
      return (
        <section className="bg-green-dark rounded-xl py-4 px-3">
          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              ["1,800+", d.attorneys_label],
              [d.states_count, d.states_label],
              ["340+", d.listings_label],
              ["28", d.languages_label],
            ].map(([n, l]) => (
              <div key={String(l)}>
                <div className="font-syne text-lg font-extrabold text-white">{n}</div>
                <div className="text-[9px] text-white/60">{l}</div>
              </div>
            ))}
          </div>
        </section>
      );

    case "home_ways": {
      const cards = Array.isArray(d.cards) ? d.cards : [];
      return (
        <section className="bg-white border border-[rgba(20,30,48,0.08)] rounded-xl p-4">
          <div className="text-[9px] font-medium tracking-wider uppercase text-green mb-1">
            {d.badge}
          </div>
          <h2 className="font-syne text-base font-extrabold text-text mb-3">{d.title}</h2>
          <div className="grid grid-cols-1 gap-2">
            {cards.map((card, idx) => (
              <div
                key={`${card.title}-${idx}`}
                className="border border-[rgba(0,0,0,0.08)] rounded-lg p-3 bg-bg/40"
              >
                <Icon name={card.icon} className="w-5 h-5 text-green mb-1" />
                <div className="text-xs font-semibold text-text">{card.title}</div>
                <p className="text-[10px] text-muted mt-1 leading-relaxed">{card.desc}</p>
                <div className="mt-2 inline-block text-[10px] bg-green text-white px-2 py-1 rounded">
                  {card.cta || "Learn more"}
                </div>
                {card.href && (
                  <div className="text-[9px] text-muted-high mt-1 font-mono">{card.href}</div>
                )}
              </div>
            ))}
            {cards.length === 0 && (
              <p className="text-[10px] text-muted">No cards yet — add some in the editor.</p>
            )}
          </div>
        </section>
      );
    }

    case "home_ai":
      return (
        <section className="bg-bg border border-[rgba(20,30,48,0.08)] rounded-xl p-4">
          <div className="text-[9px] font-medium tracking-wider uppercase text-green mb-1">
            {d.badge}
          </div>
          <h2 className="font-syne text-base font-extrabold text-text mb-3">{d.title}</h2>
          <div className="grid grid-cols-1 gap-2 mb-3">
            {AI_FEATURE_CARDS.map((f) => (
              <div key={f.title} className="bg-white border border-[rgba(0,0,0,0.08)] rounded-lg p-2.5">
                <Icon name={f.icon} className="w-4 h-4 text-green mb-0.5" />
                <div className="text-[11px] font-semibold text-text">{f.title}</div>
                <p className="text-[10px] text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
          <span className="inline-block text-[10px] bg-green text-white px-2.5 py-1 rounded-md">
            {d.cta}
          </span>
        </section>
      );

    case "home_featured":
      return (
        <section className="bg-white border border-[rgba(20,30,48,0.08)] rounded-xl p-4">
          <div className="flex justify-between items-baseline gap-2 mb-2">
            <div>
              <div className="text-[9px] font-medium tracking-wider uppercase text-green mb-1">
                {d.badge}
              </div>
              <h2 className="font-syne text-base font-extrabold text-text">{d.title}</h2>
            </div>
            <span className="text-[10px] text-green font-medium">{d.cta}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["MR", "JK", "SP"].map((initials) => (
              <div
                key={initials}
                className="bg-bg border border-[rgba(0,0,0,0.06)] rounded-lg p-2 text-center"
              >
                <div className="w-8 h-8 mx-auto rounded-full bg-green-light text-green-dark text-[10px] font-bold flex items-center justify-center mb-1">
                  {initials}
                </div>
                <div className="text-[9px] text-muted">Attorney card</div>
              </div>
            ))}
          </div>
        </section>
      );

    case "home_pricing":
      return (
        <section className="bg-bg border border-[rgba(20,30,48,0.08)] rounded-xl p-4 text-center">
          <div className="text-[9px] font-medium tracking-wider uppercase text-green mb-1">
            {d.badge}
          </div>
          <h2 className="font-syne text-base font-extrabold text-text mb-1">{d.title}</h2>
          <p className="text-[11px] text-muted">{d.subtitle}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-white rounded-lg border p-2 text-[10px] text-muted">Free plan</div>
            <div className="bg-white rounded-lg border border-green/30 p-2 text-[10px] text-green font-semibold">
              Pro plan
            </div>
          </div>
        </section>
      );

    case "home_join":
      return (
        <section className="bg-green-dark rounded-xl p-5 text-white text-center">
          <h2 className="font-syne text-base font-extrabold mb-1">{d.title}</h2>
          <p className="text-[11px] text-white/70 mb-3">{d.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-2 text-[10px]">
            <span className="bg-white text-green-dark px-2.5 py-1 rounded-md font-semibold">
              {d.cta}
            </span>
            {d.cta_secondary && (
              <span className="border border-white/40 px-2.5 py-1 rounded-md">{d.cta_secondary}</span>
            )}
          </div>
        </section>
      );

    case "heading":
      return (
        <h2
          className={`font-syne font-bold text-text ${
            Number(d.level) === 3 ? "text-sm" : "text-base"
          }`}
        >
          {d.text}
        </h2>
      );

    case "paragraph":
      return (
        <p className="text-[11px] text-muted leading-relaxed whitespace-pre-wrap">{d.text}</p>
      );

    case "cards":
      return (
        <div className="grid grid-cols-1 gap-2">
          {(d.items || []).map((item, idx) => (
            <div key={idx} className="bg-white border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
              <Icon name={item.icon} className="w-5 h-5 text-green mb-1" />
              <div className="text-xs font-semibold">{item.title}</div>
              <p className="text-[10px] text-muted">{item.body}</p>
              {item.href && (
                <div className="text-[9px] text-green mt-1 font-mono">{item.href}</div>
              )}
            </div>
          ))}
        </div>
      );

    case "cta":
      return (
        <section className="rounded-xl bg-green-dark text-white p-4">
          <h3 className="font-syne text-sm font-bold mb-1">{d.title}</h3>
          <p className="text-[11px] text-white/75 mb-2">{d.text}</p>
          {d.buttonLabel && (
            <span className="inline-block text-[10px] bg-white text-green-dark px-2.5 py-1 rounded font-semibold">
              {d.buttonLabel}
            </span>
          )}
        </section>
      );

    case "html":
      return (
        <div
          className="text-[11px] border border-dashed border-[rgba(0,0,0,0.15)] rounded-lg p-3 bg-white prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: d.html || "<p class='text-muted'>Empty HTML block</p>",
          }}
        />
      );

    case "divider":
      return <hr className="border-0 border-t border-[rgba(0,0,0,0.12)] my-1" />;

    default: {
      const meta = HOME_BLOCK_TYPES.find((t) => t.type === block.type);
      return (
        <div className="border border-dashed border-[rgba(0,0,0,0.15)] rounded-lg p-3 text-[10px] text-muted">
          <Icon name={meta?.icon || "spark"} className="w-3.5 h-3.5" /> {meta?.label || block.type}
        </div>
      );
    }
  }
}

/** Full-page homepage preview for the CMS editor (scrollable, updates live). */
export default function CmsFullPreview({ values, activeSection }) {
  const scrollRef = useRef(null);
  const get = (key, fallback = "") =>
    values?.[key] != null && values[key] !== "" ? values[key] : fallback;

  const homeLayout = useMemo(
    () => resolveHomepageDocument(values?.["home.layout"], get),
    // Recompute whenever form values change (especially home.layout JSON).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values?.["home.layout"], values]
  );

  useEffect(() => {
    if (!activeSection || !scrollRef.current) return;
    const el = scrollRef.current.querySelector(`[data-cms-section="${activeSection}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeSection]);

  return (
    <div className="flex flex-col h-full min-h-0 border border-[rgba(20,30,48,0.12)] rounded-xl overflow-hidden bg-bg shadow-sm">
      <div className="shrink-0 px-4 py-2.5 border-b border-[rgba(20,30,48,0.10)] bg-surface flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Live preview — Homepage
        </span>
        <span className="text-[10px] text-muted-high">Updates as you edit</span>
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3 max-h-[calc(100vh-12rem)]"
      >
        <div
          data-cms-section="navigation"
          className={`rounded-lg transition-all ${
            activeSection === "navigation" ? "ring-2 ring-green ring-offset-2" : ""
          }`}
        >
          <div className="bg-surface border border-[rgba(20,30,48,0.10)] rounded-lg px-4 py-3 flex justify-between items-center">
            <span className="font-syne font-extrabold text-text text-sm">
              {get("nav.logo_text", "ImmFlow")}
            </span>
            <div className="flex gap-2 text-[10px]">
              <span className="text-muted">{get("nav.btn_login", "Log in")}</span>
              <span className="bg-green text-white px-2 py-1 rounded">
                {get("nav.btn_signup", "Sign up")}
              </span>
            </div>
          </div>
        </div>

        <div
          data-cms-section="home.layout"
          className={`space-y-3 rounded-xl transition-all ${
            activeSection === "home.layout" ? "ring-2 ring-green ring-offset-2 p-1" : ""
          }`}
        >
          {(homeLayout.blocks || []).map((block) => (
            <div key={block.id} data-home-block={block.type}>
              <PreviewBlock block={block} />
            </div>
          ))}
          {(!homeLayout.blocks || homeLayout.blocks.length === 0) && (
            <p className="text-xs text-muted p-4 text-center border border-dashed rounded-xl">
              No homepage sections yet. Add blocks in the editor.
            </p>
          )}
        </div>

        <div
          data-cms-section="help"
          className={`rounded-lg p-3 bg-white border border-[rgba(20,30,48,0.08)] ${
            activeSection === "help" ? "ring-2 ring-green ring-offset-2" : ""
          }`}
        >
          <div className="text-[9px] uppercase text-muted font-semibold mb-1">Help preview</div>
          <div className="text-xs font-semibold text-text">
            {get("help.title", "Help & FAQ")}
          </div>
          <p className="text-[10px] text-muted mt-1 line-clamp-2">
            {get("help.intro", "Marketplace help content…")}
          </p>
        </div>

        <div
          data-cms-section="footer"
          className={`bg-green-dark bg-hero-gradient rounded-lg p-4 text-white ${
            activeSection === "footer" ? "ring-2 ring-green-medium ring-offset-2" : ""
          }`}
        >
          <div className="font-syne font-bold text-sm">
            {get("footer.logo_text", "ImmFlow")}
          </div>
          <p className="text-[10px] text-white/60 mt-2 leading-relaxed">
            {get("footer.description", "The immigration attorney network…")}
          </p>
          <div className="text-[9px] text-white/40 mt-3">
            {get("footer.copyright", "© 2026 ImmFlow")}
          </div>
        </div>
      </div>
    </div>
  );
}
