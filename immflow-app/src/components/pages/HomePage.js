import React, { useState, useEffect } from "react";
import Link from "next/link";
import Avatar from "../Avatar";
import AttorneyCard from "../AttorneyCard";
import ProviderCard from "../ProviderCard";
import { useContent } from "../SiteContentContext";
import { useI18n } from "../I18nProvider";

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

export default function HomePage({ setPage, setShowAuth }) {
  const { get } = useContent();
  const { t } = useI18n();
  const [attorneys, setAttorneys] = useState([]);
  const [featuredAttorneys, setFeaturedAttorneys] = useState([]);
  const [liveStats, setLiveStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [serviceQuery, setServiceQuery] = useState("");
  const [finding, setFinding] = useState(false);
  const [finderResult, setFinderResult] = useState(null);

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

      // If no inline matches yet, still deep-link into the category directory
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

  const heroBadge = get("home.hero.badge", "Immigration services marketplace");
  const heroTitle = get("home.hero.title", "Find the right\nimmigration help");
  const heroSubtitle = get(
    "home.hero.subtitle",
    "Attorneys, certified translation, interpreters, and psychological evaluations — verified professionals in one place."
  );
  const ctaPrimary = get("home.hero.cta_primary", "Find an attorney");
  const ctaSecondary = get("home.hero.cta_secondary", "Browse job board");
  const ctaTertiary = get("home.hero.cta_tertiary", "Join free →");

  const stat1Num = liveStats
    ? String(liveStats.attorneys)
    : get("home.stats.attorneys_count", "1,800+");
  const stat1Label = get("home.stats.attorneys_label", "Verified attorneys");
  const stat2Num = get("home.stats.states_count", "50 states");
  const stat2Label = get("home.stats.states_label", "Coverage");
  const stat3Num = liveStats
    ? String(liveStats.listings)
    : get("home.stats.listings_count", "340+");
  const stat3Label = get("home.stats.listings_label", "Active listings");
  const stat4Num = liveStats
    ? String(liveStats.languages)
    : get("home.stats.languages_count", "28");
  const stat4Label = get("home.stats.languages_label", "Languages");

  const howItWorksBadge = get("home.how_it_works.badge", "How it works");
  const howItWorksTitle = get("home.how_it_works.title", "Three ways to use ImmFlow");

  const card1Icon = get("home.card1.icon", "⚖️");
  const card1Title = get("home.card1.title", "Find an attorney");
  const card1Desc = get("home.card1.desc", "Browse verified immigration attorneys by case type, language, and availability.");
  const card1Cta = get("home.card1.cta", "Browse attorneys");

  const card2Icon = get("home.card2.icon", "📋");
  const card2Title = get("home.card2.title", "Job board");
  const card2Desc = get("home.card2.desc", "Post and find full-time roles, hearing coverage, and outsource projects.");
  const card2Cta = get("home.card2.cta", "View listings");

  const card3Icon = get("home.card3.icon", "🤝");
  const card3Title = get("home.card3.title", "Attorney network");
  const card3Desc = get("home.card3.desc", "Attorney-to-attorney connections for coverage, co-counsel, and referrals.");
  const card3Cta = get("home.card3.cta", "Join network");

  const aiBadge = get("home.ai.badge", "AI-powered");
  const aiTitle = get("home.ai.title", "Smart matching, not just search");
  const aiCta = get("home.ai.cta", "Try the AI matcher ✦");

  const featuredBadge = get("home.featured.badge", "Featured");
  const featuredTitle = get("home.featured.title", "Top-rated attorneys");
  const featuredCta = get("home.featured.cta", "See all");

  const pricingBadge = get("home.pricing.badge", "Pricing");
  const pricingTitle = get("home.pricing.title", "Simple, transparent pricing");
  const pricingSubtitle = get("home.pricing.subtitle", "Free to start. Upgrade when you're ready to grow.");

  const joinTitle = get("home.join.title", "Ready to join ImmFlow?");
  const joinSubtitle = get("home.join.subtitle", "Free to join. Post listings, find coverage, build your reputation.");
  const joinCta = get("home.join.cta", "Create free attorney account →");
  const joinCtaSecondary = get("home.join.cta_secondary", "Browse listings");

  const formatHeroTitle = (text) => {
    const parts = text.split("\n");
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
  };

  const previewAttorneys = attorneys.length > 0 ? attorneys : AI_PREVIEW_FALLBACK;
  const displayFeatured =
    featuredAttorneys.length > 0 ? featuredAttorneys : previewAttorneys;

  return (
    <div>
      {/* Marketplace hero */}
      <section className="relative bg-hero-light border-b border-[rgba(20,30,48,0.10)] py-14 md:py-16 px-6 overflow-hidden">
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
              {heroBadge}
            </div>
            <h1 className="font-syne text-[36px] md:text-[46px] font-extrabold leading-[1.12] tracking-tight mb-4 text-text">
              {formatHeroTitle(heroTitle)}
            </h1>
            <p className="text-base text-muted leading-relaxed">{heroSubtitle}</p>
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
                  "e.g., I need a certified Hindi to English translation."
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
            <button
              type="button"
              onClick={() => setShowAuth(true)}
              className="text-green font-semibold bg-transparent border-none cursor-pointer"
            >
              {ctaTertiary}
            </button>
          </div>
        </div>
      </section>

      {/* Attorney network strip */}
      <section className="bg-white border-b border-[rgba(20,30,48,0.10)] py-12 px-6">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10 items-center">
          <div>
            <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
              Attorney network
            </div>
            <h2 className="font-syne text-2xl md:text-[28px] font-extrabold text-text mb-3 leading-tight">
              Hearing coverage, jobs &amp; referrals
            </h2>
            <p className="text-sm text-muted leading-relaxed mb-5 max-w-lg">
              Attorneys can still post listings, find coverage, and connect peer-to-peer — alongside the services marketplace.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPage("attorneys")}
                className="bg-green text-white py-2.5 px-5 rounded-lg text-sm font-medium border-none cursor-pointer hover:bg-green-dark"
              >
                {ctaPrimary}
              </button>
              <button
                onClick={() => setPage("jobs")}
                className="bg-transparent text-text py-2.5 px-5 rounded-lg text-sm font-medium border border-[rgba(0,0,0,0.15)] cursor-pointer hover:bg-bg"
              >
                {ctaSecondary}
              </button>
            </div>
          </div>
          <div className="bg-bg rounded-2xl border border-[rgba(0,0,0,0.09)] p-5">
            <div className="text-[11px] font-medium tracking-wider uppercase text-green mb-3">
              ✦ AI matched for you
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
            <button
              onClick={() => setPage("matcher")}
              className="bg-green text-white w-full mt-4 py-2.5 rounded-lg border-none cursor-pointer text-[13px] font-medium hover:bg-green-dark"
            >
              Run AI match ✦
            </button>
          </div>
        </div>
      </section>

      {/* Stats banner */}
      <div className="bg-green-dark bg-hero-gradient py-6 px-6">
        <div className="max-w-[1100px] mx-auto flex flex-wrap gap-12 justify-center">
          {[
            [stat1Num, stat1Label],
            [stat2Num, stat2Label],
            [stat3Num, stat3Label],
            [stat4Num, stat4Label],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="font-syne text-[28px] font-extrabold text-white">
                {n}
              </div>
              <div className="text-xs text-white/60 mt-0.5">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
            {howItWorksBadge}
          </div>
          <h2 className="font-syne text-3xl md:text-4xl font-extrabold mb-8 text-text">
            {howItWorksTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {[
              { icon: card1Icon, title: card1Title, desc: card1Desc, cta: card1Cta, page: "attorneys" },
              { icon: card2Icon, title: card2Title, desc: card2Desc, cta: card2Cta, page: "jobs" },
              { icon: card3Icon, title: card3Title, desc: card3Desc, cta: card3Cta, page: "network" },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-6"
              >
                <div className="text-[32px] mb-3">{f.icon}</div>
                <div className="text-[17px] font-medium text-text mb-2">{f.title}</div>
                <p className="text-sm text-muted leading-relaxed mb-5">{f.desc}</p>
                <button
                  onClick={() => setPage(f.page)}
                  className="bg-green text-white py-2 px-[18px] rounded-lg text-[13px] border-none cursor-pointer hover:bg-green-dark transition-all duration-200"
                >
                  {f.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI-powered */}
      <section className="bg-bg py-16 px-6 border-y border-[rgba(0,0,0,0.09)]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
            {aiBadge}
          </div>
          <h2 className="font-syne text-3xl md:text-4xl font-extrabold mb-8 text-text">
            {aiTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-8">
            {[
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
            ].map((f) => (
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
          <button
            onClick={() => setPage("matcher")}
            className="bg-green text-white py-3 px-6 rounded-lg border-none cursor-pointer text-sm font-medium hover:bg-green-dark transition-all duration-200"
          >
            {aiCta}
          </button>
        </div>
      </section>

      {/* Featured attorneys */}
      <section className="bg-white py-16 px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex justify-between items-baseline mb-8 gap-4 flex-wrap">
            <div>
              <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
                {featuredBadge}
              </div>
              <h2 className="font-syne text-3xl md:text-4xl font-extrabold text-text">
                {featuredTitle}
              </h2>
            </div>
            <button
              onClick={() => setPage("attorneys")}
              className="text-sm text-green font-medium cursor-pointer bg-transparent border-none hover:underline"
            >
              {featuredCta}
            </button>
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

      {/* Pricing */}
      <section className="bg-bg py-16 px-6 border-y border-[rgba(0,0,0,0.09)]">
        <div className="max-w-[1100px] mx-auto text-center">
          <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-3">
            {pricingBadge}
          </div>
          <h2 className="font-syne text-3xl md:text-4xl font-extrabold mb-3 text-text">
            {pricingTitle}
          </h2>
          <p className="text-base text-muted mb-10">{pricingSubtitle}</p>
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
              <div className="font-syne text-3xl font-extrabold text-text mb-1">$29<span className="text-base font-normal text-muted">/mo</span></div>
              <div className="text-xs text-muted mb-5">Billed monthly</div>
              <ul className="text-[13px] text-muted space-y-2 mb-6">
                <li>✓ Unlimited listings</li>
                <li>✓ AI matcher access</li>
                <li>✓ Priority profile</li>
                <li>✓ Direct messaging</li>
                <li>✓ Analytics dashboard</li>
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

      {/* Join CTA */}
      <section className="bg-green-dark bg-hero-gradient py-16 px-6 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-syne text-3xl md:text-[36px] font-extrabold text-white mb-4">
            {joinTitle}
          </h2>
          <p className="text-base text-white/65 mb-8 leading-relaxed">
            {joinSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setShowAuth(true)}
              className="bg-white text-green-dark py-3.5 px-8 rounded-lg border-none cursor-pointer text-base font-semibold hover:bg-bg transition-all duration-200"
            >
              {joinCta}
            </button>
            <button
              onClick={() => setPage("jobs")}
              className="bg-transparent text-white py-3.5 px-8 rounded-lg border border-white/40 cursor-pointer text-base font-medium hover:bg-white/10 transition-all duration-200"
            >
              {joinCtaSecondary}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
