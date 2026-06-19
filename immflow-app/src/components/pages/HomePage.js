import React, { useState, useEffect } from "react";
import Avatar from "../Avatar";
import AttorneyCard from "../AttorneyCard";
import { useContent } from "../SiteContentContext";

const AI_PREVIEW_SCORES = [97, 91, 88];
const AI_PREVIEW_FALLBACK = [
  { id: "p1", initials: "MR", bg: "#E1F5EE", fg: "#085041", name: "Maria Reyes, Esq.", location: "Los Angeles, CA" },
  { id: "p2", initials: "JK", bg: "#E6F1FB", fg: "#0C447C", name: "James Kim, Esq.", location: "New York, NY" },
  { id: "p3", initials: "SP", bg: "#EEEDFE", fg: "#3C3489", name: "Sunita Patel, Esq.", location: "Chicago, IL" },
];

export default function HomePage({ setPage, setShowAuth }) {
  const { get } = useContent();
  const [attorneys, setAttorneys] = useState([]);
  const [featuredAttorneys, setFeaturedAttorneys] = useState([]);
  const [liveStats, setLiveStats] = useState(null);

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
  }, []);

  const heroBadge = get("home.hero.badge", "Immigration only · Verified attorneys");
  const heroTitle = get("home.hero.title", "The network built for\nimmigration attorneys");
  const heroSubtitle = get(
    "home.hero.subtitle",
    "Find hearing coverage, outsource cases, post jobs, and connect with fellow immigration practitioners — all in one verified network."
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
      const matchWord = "immigration attorneys";
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
      {/* Hero */}
      <section className="relative bg-hero-light border-b border-[rgba(20,30,48,0.10)] py-16 md:py-20 px-6 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "var(--gradient-glow)" }}
          aria-hidden
        />
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_400px] gap-12 md:gap-16 items-center relative">
          <div>
            <div className="text-[11px] font-medium tracking-[1.5px] uppercase text-green mb-4">
              {heroBadge}
            </div>
            <h1 className="font-syne text-[42px] md:text-[50px] font-extrabold leading-[1.1] tracking-tight mb-5 text-text">
              {formatHeroTitle(heroTitle)}
            </h1>
            <p className="text-base md:text-[17px] text-muted leading-relaxed mb-8 max-w-lg">
              {heroSubtitle}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setPage("attorneys")}
                className="bg-green text-white py-3 px-[26px] rounded-lg text-[15px] font-medium border-none cursor-pointer hover:bg-green-dark transition-all duration-200"
              >
                {ctaPrimary}
              </button>
              <button
                onClick={() => setPage("jobs")}
                className="bg-transparent text-text py-3 px-[26px] rounded-lg text-[15px] font-medium border border-[rgba(0,0,0,0.15)] cursor-pointer hover:bg-bg transition-all duration-200"
              >
                {ctaSecondary}
              </button>
              <button
                onClick={() => setShowAuth(true)}
                className="bg-transparent text-green py-3 px-[26px] rounded-lg text-[15px] font-medium border border-green cursor-pointer hover:bg-green-light transition-all duration-200"
              >
                {ctaTertiary}
              </button>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-[rgba(0,0,0,0.09)] p-6 mt-8 md:mt-0">
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
                  <div className="text-[13px] font-medium text-green">
                    {AI_PREVIEW_SCORES[i]}%
                  </div>
                  <div className="text-[10px] text-muted-high">fit score</div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setPage("matcher")}
              className="bg-green text-white w-full mt-4 py-2.5 rounded-lg border-none cursor-pointer text-[13px] font-medium hover:bg-green-dark transition-all duration-200"
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
