import React, { useState, useEffect } from "react";
import Avatar from "../Avatar";
import Tag from "../Tag";
import { rankAttorneysForMatch } from "@/lib/utils/matcher";
import { startChatWithAttorney } from "@/lib/client/start-chat";
import { toastError } from "@/lib/client/alerts";
import { usePlatform } from "@/components/PlatformContext";

export default function MatcherPage({ user, setPage, setShowAuth }) {
  const { canAccess } = usePlatform();
  const hasMatcher = canAccess("ai_matcher", user?.isPro);
  const hasMessaging = canAccess("direct_messaging", user?.isPro);
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const [query, setQuery] = useState("");
  const [needType, setNeedType] = useState("Hearing coverage");
  const [caseType, setCaseType] = useState("Removal defense");
  const [attorneys, setAttorneys] = useState([]);
  const [matches, setMatches] = useState([]);
  const [attorneyCount, setAttorneyCount] = useState(0);

  useEffect(() => {
    fetch("/api/attorneys")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAttorneys(data);
          setAttorneyCount(data.length);
        }
      })
      .catch(console.error);
  }, []);

  const checkLabels = [
    "Filtering by jurisdiction & court",
    "Matching visa & case specialty",
    "Checking language requirements",
    "Verifying availability",
    "Scoring & ranking matches",
  ];

  const runMatch = () => {
    if (!hasMatcher) {
      toastError(
        "The AI Matcher is not available on your plan. Upgrade from Dashboard → Billing & Subscriptions."
      );
      setPage("dashboard");
      return;
    }

    setStep(1);
    setProgress(0);
    setChecks([false, false, false, false, false]);
    let i = 0;
    const pcts = [20, 42, 60, 78, 95];
    const tick = () => {
      if (i >= 5) {
        const ranked = rankAttorneysForMatch(attorneys, { query, needType, caseType });
        setMatches(ranked);
        setTimeout(() => setStep(2), 600);
        return;
      }
      setProgress(pcts[i]);
      setChecks((c) => c.map((v, idx) => (idx <= i ? true : v)));
      i++;
      setTimeout(tick, 700);
    };
    setTimeout(tick, 400);
  };

  const handleContactRedirect = (m) => {
    startChatWithAttorney(
      { userId: m.userId, name: m.name, initials: m.initials },
      { user, setShowAuth, setPage, canAccessMessaging: hasMessaging }
    );
  };

  if (!hasMatcher) {
    return (
      <div className="max-w-[680px] mx-auto my-16 px-6 text-center">
        <div className="text-4xl mb-4">✦</div>
        <h2 className="font-syne text-2xl font-extrabold mb-3 text-text">
          AI Matcher — ImmFlow Pro
        </h2>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          Smart attorney matching requires a plan upgrade. Free accounts can browse the attorney
          directory and job board.
        </p>
        <button
          onClick={() => (user ? setPage("dashboard") : setShowAuth(true))}
          className="bg-green hover:bg-green-dark text-white py-3 px-6 rounded-lg border-none cursor-pointer text-sm font-medium"
        >
          {user ? "Upgrade in Dashboard" : "Sign up to get started"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white border-b border-[rgba(0,0,0,0.09)] py-8 px-6">
        <div className="max-w-[680px] mx-auto">
          <div className="flex flex-wrap items-center gap-4">
            {["Describe need", "AI matching", "Your matches"].map((label, i) => (
              <div key={label} className="flex items-center gap-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium border ${
                    step > i
                      ? "bg-green border-green text-white"
                      : step === i
                      ? "bg-green-light border-green text-green"
                      : "bg-[#f1efe8] border-[rgba(0,0,0,0.09)] text-muted"
                  }`}
                >
                  {step > i ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[13px] ${
                    step === i ? "text-text font-medium" : "text-muted"
                  }`}
                >
                  {label}
                </span>
                {i < 2 && (
                  <span className="text-[rgba(0,0,0,0.09)] mx-1">—</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-[680px] mx-auto my-8 px-6">
        {step === 0 && (
          <div>
            <h2 className="font-syne text-xl md:text-[26px] font-extrabold mb-2 text-text">
              What do you need?
            </h2>
            <p className="text-sm text-muted mb-6">
              Describe it in plain language or use the options below.
            </p>
            <div className="flex gap-2 bg-green-light border border-green-medium rounded-lg p-2 pl-3.5 items-center mb-5">
              <span className="text-green">✦</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="border-none bg-transparent text-sm outline-none flex-1 text-text placeholder-muted-high"
                placeholder='e.g. "Spanish removal attorney in Texas for June hearing"'
              />
            </div>
            {[
              [
                "Type of need",
                [
                  "Hearing coverage",
                  "Case outsourcing",
                  "Co-counsel",
                  "Full-time hire",
                  "Contract",
                ],
                needType,
                setNeedType,
              ],
              [
                "Case / visa type",
                [
                  "Removal defense",
                  "Asylum",
                  "H-1B",
                  "Family petition",
                  "DACA",
                  "Naturalization",
                  "BIA appeals",
                ],
                caseType,
                setCaseType,
              ],
            ].map(([label, options, val, setter]) => (
              <div key={label} className="mb-5">
                <div className="text-xs font-medium text-muted mb-2">{label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((o) => (
                    <button
                      key={o}
                      onClick={() => setter(o)}
                      className={`text-xs py-1.5 px-3.5 rounded-full border cursor-pointer transition-all duration-200 ${
                        val === o
                          ? "border-green bg-green text-white"
                          : "border-[rgba(0,0,0,0.09)] bg-transparent text-muted hover:text-text"
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={runMatch}
              className="bg-green hover:bg-green-dark text-white py-3 px-6 rounded-lg border-none cursor-pointer text-sm font-medium transition-all duration-200"
            >
              ✦ Find matches with AI
            </button>
          </div>
        )}
        {step === 1 && (
          <div className="text-center py-8">
            <div className="w-15 h-15 rounded-full bg-green-light flex items-center justify-center text-2xl mx-auto mb-5 text-green animate-pulse">
              ✦
            </div>
            <h2 className="font-syne text-[22px] font-extrabold mb-2 text-text">
              AI is finding your matches
            </h2>
            <p className="text-sm text-muted mb-6">
              Scanning {attorneyCount || "verified"} verified attorneys…
            </p>
            <div className="bg-[#f1efe8] rounded-full h-1.5 overflow-hidden mb-4">
              <div
                style={{ width: progress + "%" }}
                className="h-full bg-green rounded-full transition-all duration-400 ease"
              />
            </div>
            <div className="text-left">
              {checkLabels.map((label, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 py-1.5 border-b border-[rgba(0,0,0,0.09)] text-[13px] ${
                    checks[i] ? "text-text" : "text-muted"
                  }`}
                >
                  <span className={checks[i] ? "text-green" : "text-muted-high"}>
                    {checks[i] ? "✓" : "○"}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div className="flex justify-between items-baseline mb-5 gap-3">
              <h2 className="font-syne text-xl md:text-[22px] font-extrabold text-text">
                {matches.length} attorney{matches.length !== 1 ? "s" : ""} found
              </h2>
              <span className="text-xs text-muted">Ranked by fit score</span>
            </div>

            {matches.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">
                No matches found. Try broadening your search criteria.
              </p>
            ) : (
              matches.map((m, i) => (
                <div
                  key={m.userId ?? i}
                  className={`bg-white border rounded-[14px] p-5 mb-2.5 shadow-sm ${
                    m.best ? "border-2 border-green" : "border-[rgba(0,0,0,0.09)]"
                  }`}
                >
                  {m.best && (
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-green-light text-green-dark font-medium inline-block mb-2">
                      ✦ Best match
                    </span>
                  )}
                  <div className="flex gap-2.5 mb-2">
                    <Avatar initials={m.initials} bg={m.bg} fg={m.fg} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-text">{m.name}</div>
                      <div className="text-[11px] text-muted">{m.meta}</div>
                    </div>
                    <div className="text-center">
                      <div
                        style={{ color: m.scoreColor }}
                        className="font-syne text-[22px] font-extrabold leading-none"
                      >
                        {m.score}
                      </div>
                      <div className="text-[9px] text-muted-high uppercase">fit score</div>
                    </div>
                  </div>
                  <div className="bg-[#f1efe8] rounded-full h-1 mb-2">
                    <div
                      style={{ backgroundColor: m.scoreColor, width: m.score + "%" }}
                      className="h-full rounded-full"
                    />
                  </div>
                  <div className="text-xs text-muted bg-green-light rounded-r-lg rounded-bl-lg border-l-2 border-green p-2.5 mb-2 leading-relaxed">
                    ✦ {m.reason}
                  </div>
                  <div className="flex flex-wrap gap-[5px] mb-2.5">
                    {m.tags.map((t) => (
                      <Tag key={t} green>
                        {t}
                      </Tag>
                    ))}
                    <Tag>★ {m.reviews}</Tag>
                  </div>
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-xs text-muted">
                      {m.avail} · {m.rate}
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPage("attorneys")}
                        className="bg-transparent text-text py-1.5 px-3.5 rounded-lg border border-[rgba(0,0,0,0.15)] cursor-pointer text-xs transition-all duration-200 hover:bg-bg"
                      >
                        View profile
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContactRedirect(m)}
                        className="bg-green hover:bg-green-dark text-white py-1.5 px-3.5 rounded-lg border-none cursor-pointer text-xs transition-all duration-200"
                      >
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <button
              onClick={() => {
                setStep(0);
                setProgress(0);
                setChecks([false, false, false, false, false]);
                setMatches([]);
              }}
              className="bg-transparent text-text py-2.5 px-[22px] rounded-lg border border-[rgba(0,0,0,0.15)] cursor-pointer text-[13px] mt-2 transition-all duration-200 hover:bg-bg"
            >
              ↺ New search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
