import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Avatar from "../Avatar";
import AttorneyCard from "../AttorneyCard";
import ProviderCard from "../ProviderCard";
import { useContent } from "../SiteContentContext";
import { useI18n } from "../I18nProvider";
import { usePlatform } from "../PlatformContext";
import { resolveHomepageDocument, followHomeHref } from "@/lib/utils/homepage-document";
import { sanitizeBasicHtml } from "@/lib/utils/cms-page-document";

const AI_PREVIEW_SCORES = [97, 91, 88];
const AI_PREVIEW_FALLBACK = [
  { id: "p1", initials: "MR", bg: "#E1F5EE", fg: "#085041", name: "Maria Reyes, Esq.", location: "Los Angeles, CA" },
  { id: "p2", initials: "JK", bg: "#E6F1FB", fg: "#0C447C", name: "James Kim, Esq.", location: "New York, NY" },
  { id: "p3", initials: "SP", bg: "#EEEDFE", fg: "#3C3489", name: "Sunita Patel, Esq.", location: "Chicago, IL" },
];

const CATEGORY_ICONS = {
  attorney: "⚖️",
  translation: "📄",
  interpreter: "🎙️",
  psychological: "🧠",
};

const AI_FEATURE_CARDS = [
  {
    icon: "✦",
    title: "AI attorney matcher",
    desc: "Describe your need. AI returns ranked matches with fit scores and plain-English reasoning.",
  },
  {
    icon: "🔍",
    title: "Natural language search",
    desc: "Type what you need instead of filling out 10 dropdowns. The search understands intent.",
  },
  {
    icon: "💬",
    title: "Client intake chatbot",
    desc: "Visitors answer 4–5 questions and get routed to the right attorney automatically.",
  },
];

function formatHeroTitle(text) {
  const parts = String(text || "").split("\n");
  return parts.map((part, index) => {
    const lowerPart = part.toLowerCase();
    const highlights = ["immigration help", "immigration attorneys", "immigration services"];
    for (const matchWord of highlights) {
      if (lowerPart.includes(matchWord)) {
        const start = lowerPart.indexOf(matchWord);
        const before = part.substring(0, start);
        const matched = part.substring(start, start + matchWord.length);
        const after = part.substring(start + matchWord.length);
        return (
          <span key={index}>
            {index > 0 && <br />}
            {before}
            <span className="text-green">{matched}</span>
            {after}
          </span>
        );
      }
    }
    return (
      <span key={index}>
        {index > 0 && <br />}
        {part}
      </span>
    );
  });
}

function HomeActionButton({ href, className, children, setPage, setShowAuth }) {
  if (/^https?:\/\//i.test(href || "")) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={() => followHomeHref(href, { setPage, setShowAuth })}
      className={className}
    >
      {children}
    </button>
  );
}

export default function HomePage({ setPage, setShowAuth }) {
  const { get } = useContent();
  const { t } = useI18n();
  const {
    subscriptionPriceLabel,
    subscriptionPriceCadence,
    subscriptionBillingPeriod,
    loading: platformLoading,
  } = usePlatform();
  const [attorneys, setAttorneys] = useState([]);
  const [featuredAttorneys, setFeaturedAttorneys] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [serviceQuery, setServiceQuery] = useState("");
  const [finding, setFinding] = useState(false);
  const [finderResult, setFinderResult] = useState(null);

  const layout = useMemo(
    () => resolveHomepageDocument(get("home.layout", null), get),
    [get]
  );

  const nav = { setPage, setShowAuth };

  useEffect(() => {
    fetch("/api/attorneys")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAttorneys(data.slice(0, 3));
          const sorted = [...data].sort(
            (a, b) => Number(b.stars || 0) - Number(a.stars || 0)
          );
          setFeaturedAttorneys(sorted.slice(0, 3));
        }
      })
      .catch((err) => console.error("Error loading attorneys:", err));

    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setLiveStats(data);
      })
      .catch(() => {});

    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {});
  }, []);

  const runServiceFinder = async (e) => {
    e?.preventDefault();
    if (!serviceQuery.trim()) {
      setPage("services");
      return;
    }
    setFinding(true);
    setFinderResult(null);
    try {
      const res = await fetch("/api/service-finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: serviceQuery }),
      });
      const data = await res.json();
      if (data.error) {
        setPage("services");
        return;
      }

      setFinderResult(data);

      if (!data.matches?.length && data.categorySlug) {
        const params = new URLSearchParams({ q: serviceQuery });
        if (data.filters?.sourceLanguage) params.set("source", data.filters.sourceLanguage);
        if (data.filters?.targetLanguage) params.set("target", data.filters.targetLanguage);
        if (data.filters?.language) params.set("language", data.filters.language);
        window.location.href = `/services/${data.categorySlug}?${params}`;
      }
    } catch {
      setPage("services");
    } finally {
      setFinding(false);
    }
  };

  const previewAttorneys = attorneys.length > 0 ? attorneys : AI_PREVIEW_FALLBACK;
  const displayFeatured =
    featuredAttorneys.length > 0 ? featuredAttorneys : previewAttorneys;

  const statFallback = (key, liveVal, cmsKey, cmsFallback) =>
    liveVal != null ? String(liveVal) : get(cmsKey, cmsFallback);

  const renderBlock = (block) => {
    const d = block.data || {};

    switch (block.type) {
      case "home_hero":
        return (
          <section
            key={block.id}
            className="relative bg-hero-light border-b border-[rgba(20,30,48,0.10)] py-14 md:py-16 px-6 overflow-hidden"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{ background: "var(--gradient-glow)" }}
              aria-hidden
            />
            <div className="max-w-[1100px] mx-auto relative">
              <div className="text-center max-w-2xl mx-auto mb-10">
                <div className="font-syne text-[28px] md:text-[34px] font-extrabold text-text mb-2">
                  Imm<span className="text-green">Flow</span>
                </div>
                <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
                  {d.badge}
                </div>
                <h1 className="font-syne text-[36px] md:text-[46px] font-extrabold leading-[1.12] tracking-tight mb-4 text-text">
                  {formatHeroTitle(d.title)}
                </h1>
                <p className="text-base text-muted leading-relaxed">{d.subtitle}</p>
              </div>

              <h2 className="font-syne text-xl font-bold text-text text-center mb-5">
                {t("home.whatDoYouNeed", "What do you need help with?")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {(categories.length
                  ? categories
                  : [
                      { slug: "attorney", name: "Immigration Attorneys" },
                      { slug: "translation", name: "Certified Translation" },
                      { slug: "interpreter", name: "Interpreters" },
                      { slug: "psychological", name: "Psychological Services" },
                    ]
                ).map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => {
                      window.location.href = `/services/${c.slug}`;
                    }}
                    className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 text-left cursor-pointer hover:border-green/50 shadow-sm transition-all"
                  >
                    <div className="text-xl mb-2">{CATEGORY_ICONS[c.slug] || "✦"}</div>
                    <div className="font-semibold text-sm text-text">{c.name}</div>
                  </button>
                ))}
              </div>

              <form onSubmit={runServiceFinder} className="max-w-2xl mx-auto">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-green block mb-2 text-center">
                  {t("home.tellUs", "Tell us what you need...")}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    placeholder={t(
                      "home.aiSearchPlaceholder",
                      'e.g., "I want to know about the immigration process" or "Hindi to English certified translation"'
                    )}
                    className="flex-1 text-sm py-3.5 px-4 border border-[rgba(0,0,0,0.12)] rounded-xl bg-white focus:outline-none focus:border-green shadow-sm"
                  />
                  <button
                    type="submit"
                    disabled={finding}
                    className="bg-green hover:bg-green-dark text-white font-semibold text-sm py-3.5 px-6 rounded-xl border-none cursor-pointer disabled:opacity-50 whitespace-nowrap"
                  >
                    {finding ? "…" : "Find help"}
                  </button>
                </div>
              </form>

              {finderResult && (
                <div className="max-w-3xl mx-auto mt-8 bg-white/90 border border-[rgba(0,0,0,0.09)] rounded-2xl p-5 shadow-sm text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-green">
                        AI Service Finder
                        {finderResult.source === "openai" ? " · AI" : " · smart search"}
                      </div>
                      <p className="text-sm font-semibold text-text mt-1">
                        {finderResult.summary || "Matching providers…"}
                      </p>
                    </div>
                    {finderResult.categorySlug && (
                      <Link
                        href={`/services/${finderResult.categorySlug}?q=${encodeURIComponent(serviceQuery)}`}
                        className="text-xs font-semibold text-green hover:underline"
                      >
                        Browse all {finderResult.categorySlug.replace(/_/g, " ")} →
                      </Link>
                    )}
                  </div>
                  {(finderResult.matches || []).length === 0 ? (
                    <p className="text-xs text-muted">
                      No verified matches yet in that category. Browse the directory or try another search.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {finderResult.matches.slice(0, 4).map((p) => (
                        <div key={p.id} className="relative">
                          {p.matchScore != null && (
                            <span className="absolute top-2 right-2 z-10 text-[10px] font-bold bg-green-light text-green-dark px-2 py-0.5 rounded">
                              {p.matchScore}% match
                            </span>
                          )}
                          <ProviderCard provider={p} />
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted mt-3 leading-relaxed">
                    ImmFlow helps you find professionals. It does not provide legal advice, clinical assessments, or translation certification.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap justify-center gap-4 mt-8 text-sm">
                <button
                  type="button"
                  onClick={() => setPage("jobs")}
                  className="text-muted hover:text-green bg-transparent border-none cursor-pointer"
                >
                  Job board / hearing coverage
                </button>
                <button
                  type="button"
                  onClick={() => setPage("matcher")}
                  className="text-muted hover:text-green bg-transparent border-none cursor-pointer"
                >
                  AI attorney matcher
                </button>
                <HomeActionButton
                  href={d.cta_tertiary_href || "#signup"}
                  className="text-green font-semibold bg-transparent border-none cursor-pointer"
                  {...nav}
                >
                  {d.cta_tertiary}
                </HomeActionButton>
              </div>
            </div>
          </section>
        );

      case "home_network":
        return (
          <section
            key={block.id}
            className="bg-white border-b border-[rgba(20,30,48,0.10)] py-12 px-6"
          >
            <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10 items-center">
              <div>
                <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
                  {d.badge}
                </div>
                <h2 className="font-syne text-2xl md:text-[28px] font-extrabold text-text mb-3 leading-tight">
                  {d.title}
                </h2>
                <p className="text-sm text-muted leading-relaxed mb-5 max-w-lg">{d.body}</p>
                <div className="flex flex-wrap gap-3">
                  <HomeActionButton
                    href={d.primaryHref}
                    className="bg-green text-white py-2.5 px-5 rounded-lg text-sm font-medium border-none cursor-pointer hover:bg-green-dark"
                    {...nav}
                  >
                    {d.primaryLabel}
                  </HomeActionButton>
                  <HomeActionButton
                    href={d.secondaryHref}
                    className="bg-transparent text-text py-2.5 px-5 rounded-lg text-sm font-medium border border-[rgba(0,0,0,0.15)] cursor-pointer hover:bg-bg"
                    {...nav}
                  >
                    {d.secondaryLabel}
                  </HomeActionButton>
                </div>
              </div>
              <div className="bg-bg rounded-2xl border border-[rgba(0,0,0,0.09)] p-5">
                <div className="text-[11px] font-medium tracking-wider uppercase text-green mb-3">
                  {d.aiPanelTitle}
                </div>
                {previewAttorneys.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex gap-2.5 items-center py-2.5 border-b border-[rgba(0,0,0,0.09)] last:border-b-0"
                  >
                    <Avatar initials={a.initials} bg={a.bg} fg={a.fg} />
                    <div className="flex-1">
                      <div className="text-[13px] font-medium text-text">{a.name}</div>
                      <div className="text-[11px] text-muted">{a.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-medium text-green">{AI_PREVIEW_SCORES[i]}%</div>
                      <div className="text-[10px] text-muted-high">fit score</div>
                    </div>
                  </div>
                ))}
                <HomeActionButton
                  href={d.aiPanelHref}
                  className="bg-green text-white w-full mt-4 py-2.5 rounded-lg border-none cursor-pointer text-[13px] font-medium hover:bg-green-dark"
                  {...nav}
                >
                  {d.aiPanelCta}
                </HomeActionButton>
              </div>
            </div>
          </section>
        );

      case "home_stats": {
        const stat1Num = statFallback(
          "attorneys",
          liveStats?.attorneys,
          "home.stats.attorneys_count",
          "1,800+"
        );
        const stat2Num = d.states_count || get("home.stats.states_count", "50 states");
        const stat3Num = statFallback(
          "listings",
          liveStats?.listings,
          "home.stats.listings_count",
          "340+"
        );
        const stat4Num = statFallback(
          "languages",
          liveStats?.languages,
          "home.stats.languages_count",
          "28"
        );
        return (
          <div key={block.id} className="bg-green-dark bg-hero-gradient py-6 px-6">
            <div className="max-w-[1100px] mx-auto flex flex-wrap gap-12 justify-center">
              {[
                [stat1Num, d.attorneys_label],
                [stat2Num, d.states_label],
                [stat3Num, d.listings_label],
                [stat4Num, d.languages_label],
              ].map(([n, l]) => (
                <div key={l} className="text-center">
                  <div className="font-syne text-[28px] font-extrabold text-white">{n}</div>
                  <div className="text-xs text-white/60 mt-0.5">{l}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "home_ways": {
        const cards = Array.isArray(d.cards) ? d.cards : [];
        return (
          <section key={block.id} className="bg-white py-16 px-6">
            <div className="max-w-[1100px] mx-auto">
              <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
                {d.badge}
              </div>
              <h2 className="font-syne text-3xl md:text-4xl font-extrabold mb-8 text-text">
                {d.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {cards.map((f, idx) => (
                  <div
                    key={`${f.title}-${idx}`}
                    className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-6"
                  >
                    <div className="text-[32px] mb-3">{f.icon}</div>
                    <div className="text-[17px] font-medium text-text mb-2">{f.title}</div>
                    <p className="text-sm text-muted leading-relaxed mb-5">{f.desc}</p>
                    <HomeActionButton
                      href={f.href}
                      className="bg-green text-white py-2 px-[18px] rounded-lg text-[13px] border-none cursor-pointer hover:bg-green-dark transition-all duration-200"
                      {...nav}
                    >
                      {f.cta}
                    </HomeActionButton>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "home_ai":
        return (
          <section
            key={block.id}
            className="bg-bg py-16 px-6 border-y border-[rgba(0,0,0,0.09)]"
          >
            <div className="max-w-[1100px] mx-auto">
              <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
                {d.badge}
              </div>
              <h2 className="font-syne text-3xl md:text-4xl font-extrabold mb-8 text-text">
                {d.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
                {AI_FEATURE_CARDS.map((f) => (
                  <div
                    key={f.title}
                    className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-6"
                  >
                    <div className="text-[28px] mb-3">{f.icon}</div>
                    <div className="text-base font-medium text-text mb-2">{f.title}</div>
                    <p className="text-[13px] text-muted leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
              <HomeActionButton
                href={d.href}
                className="bg-green text-white py-3 px-6 rounded-lg border-none cursor-pointer text-sm font-medium hover:bg-green-dark transition-all duration-200"
                {...nav}
              >
                {d.cta}
              </HomeActionButton>
            </div>
          </section>
        );

      case "home_featured":
        return (
          <section key={block.id} className="bg-white py-16 px-6">
            <div className="max-w-[1100px] mx-auto">
              <div className="flex justify-between items-baseline mb-8 gap-4 flex-wrap">
                <div>
                  <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
                    {d.badge}
                  </div>
                  <h2 className="font-syne text-3xl md:text-4xl font-extrabold text-text">
                    {d.title}
                  </h2>
                </div>
                <HomeActionButton
                  href={d.href}
                  className="text-sm text-green font-medium cursor-pointer bg-transparent border-none hover:underline"
                  {...nav}
                >
                  {d.cta}
                </HomeActionButton>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {displayFeatured.map((a) => (
                  <div key={a.id} onClick={() => setPage("attorneys")}>
                    <AttorneyCard a={a} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "home_pricing":
        return (
          <section
            key={block.id}
            className="bg-bg py-16 px-6 border-y border-[rgba(0,0,0,0.09)]"
          >
            <div className="max-w-[1100px] mx-auto text-center">
              <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
                {d.badge}
              </div>
              <h2 className="font-syne text-3xl md:text-4xl font-extrabold mb-3 text-text">
                {d.title}
              </h2>
              <p className="text-base text-muted mb-10">{d.subtitle}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[720px] mx-auto text-left">
                <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-6">
                  <div className="text-lg font-semibold text-text mb-1">Free</div>
                  <div className="font-syne text-3xl font-extrabold text-text mb-1">$0</div>
                  <div className="text-xs text-muted mb-5">Forever free</div>
                  <ul className="text-[13px] text-muted space-y-2 mb-6">
                    <li>✓ Browse attorneys</li>
                    <li>✓ Apply to listings</li>
                    <li>✓ Basic profile</li>
                    <li>✓ 1 active listing</li>
                  </ul>
                  <button
                    onClick={() => setShowAuth(true)}
                    className="bg-transparent text-text w-full py-2.5 px-4 rounded-lg border border-[rgba(0,0,0,0.15)] cursor-pointer text-sm font-medium hover:bg-bg transition-all"
                  >
                    Get started free
                  </button>
                </div>
                <div className="bg-white border-2 border-green rounded-[14px] p-6 relative">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green text-white text-[11px] font-medium px-3 py-1 rounded-full">
                    Most popular
                  </span>
                  <div className="text-lg font-semibold text-text mb-1">Pro</div>
                  <div className="font-syne text-3xl font-extrabold text-text mb-1">
                    {subscriptionPriceLabel || "—"}
                    {subscriptionPriceLabel && (
                      <span className="text-base font-normal text-muted">
                        {subscriptionPriceCadence}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted mb-5">
                    {subscriptionBillingPeriod ||
                      (platformLoading ? "Loading current price…" : "Price unavailable")}
                  </div>
                  <ul className="text-[13px] text-muted space-y-2 mb-6">
                    <li>✓ AI attorney matcher</li>
                    <li>✓ Priority client contact</li>
                    <li>✓ Unlimited attorney listings</li>
                    <li>✓ Professional peer messaging</li>
                    <li>✓ Priority profile &amp; analytics</li>
                  </ul>
                  <button
                    onClick={() => setShowAuth(true)}
                    className="bg-transparent text-text w-full py-2.5 px-4 rounded-lg border border-[rgba(0,0,0,0.15)] cursor-pointer text-sm font-medium hover:bg-bg transition-all"
                  >
                    Contact us to upgrade
                  </button>
                </div>
              </div>
            </div>
          </section>
        );

      case "home_join":
        return (
          <section
            key={block.id}
            className="bg-green-dark bg-hero-gradient py-16 px-6 text-center"
          >
            <div className="max-w-[600px] mx-auto">
              <h2 className="font-syne text-3xl md:text-[36px] font-extrabold text-white mb-4">
                {d.title}
              </h2>
              <p className="text-base text-white/65 mb-8 leading-relaxed">{d.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <HomeActionButton
                  href={d.href || "#signup"}
                  className="bg-white text-green-dark py-3.5 px-8 rounded-lg border-none cursor-pointer text-base font-semibold hover:bg-bg transition-all duration-200"
                  {...nav}
                >
                  {d.cta}
                </HomeActionButton>
                <HomeActionButton
                  href={d.secondary_href}
                  className="bg-transparent text-white py-3.5 px-8 rounded-lg border border-white/40 cursor-pointer text-base font-medium hover:bg-white/10 transition-all duration-200"
                  {...nav}
                >
                  {d.cta_secondary}
                </HomeActionButton>
              </div>
            </div>
          </section>
        );

      case "heading": {
        const Tag = Number(d.level) === 3 ? "h3" : "h2";
        const size =
          Number(d.level) === 3
            ? "font-syne text-lg font-bold"
            : "font-syne text-2xl md:text-3xl font-extrabold";
        return (
          <section key={block.id} className="bg-white py-8 px-6">
            <div className="max-w-[1100px] mx-auto">
              <Tag className={`${size} text-text`}>{d.text}</Tag>
            </div>
          </section>
        );
      }

      case "paragraph":
        return (
          <section key={block.id} className="bg-white py-6 px-6">
            <div className="max-w-[1100px] mx-auto text-sm text-muted leading-relaxed whitespace-pre-line">
              {d.text}
            </div>
          </section>
        );

      case "cards": {
        const items = Array.isArray(d.items) ? d.items : [];
        return (
          <section key={block.id} className="bg-white py-10 px-6">
            <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-6"
                >
                  <div className="text-[28px] mb-3">{item.icon}</div>
                  <div className="text-base font-medium text-text mb-2">{item.title}</div>
                  <p className="text-[13px] text-muted leading-relaxed mb-4">{item.body}</p>
                  {item.href && (
                    <HomeActionButton
                      href={item.href}
                      className="text-sm text-green font-semibold bg-transparent border-none cursor-pointer hover:underline"
                      {...nav}
                    >
                      Learn more →
                    </HomeActionButton>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      }

      case "cta":
        return (
          <section key={block.id} className="py-10 px-6">
            <div className="max-w-[1100px] mx-auto rounded-2xl bg-green-dark text-white px-6 py-8">
              <h3 className="font-syne text-xl font-bold mb-2">{d.title}</h3>
              {d.text && <p className="text-sm text-white/75 leading-relaxed max-w-xl">{d.text}</p>}
              {d.buttonLabel && (
                <HomeActionButton
                  href={d.buttonHref}
                  className="inline-block mt-4 bg-white text-green-dark py-2.5 px-5 rounded-lg text-sm font-semibold border-none cursor-pointer"
                  {...nav}
                >
                  {d.buttonLabel}
                </HomeActionButton>
              )}
            </div>
          </section>
        );

      case "html":
        return (
          <section key={block.id} className="py-8 px-6">
            <div
              className="max-w-[1100px] mx-auto text-sm cms-html"
              dangerouslySetInnerHTML={{ __html: sanitizeBasicHtml(d.html || "") }}
            />
          </section>
        );

      case "divider":
        return (
          <div key={block.id} className="max-w-[1100px] mx-auto px-6">
            <hr className="border-0 border-t border-[rgba(0,0,0,0.1)]" />
          </div>
        );

      default:
        return null;
    }
  };

  return <div>{layout.blocks.map(renderBlock)}</div>;
}
