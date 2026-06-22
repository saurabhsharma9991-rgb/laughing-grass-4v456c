import React, { useState } from "react";
import { authFetch } from "@/lib/client/auth-storage";
import { toastError } from "@/lib/client/alerts";
import { LISTING_TYPES } from "@/lib/constants/listing-types";
import TagInput from "../TagInput";

export default function PostPage({ user, setShowAuth, setPage }) {
  const [type, setType] = useState(LISTING_TYPES[0].value);
  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  const [location, setLocation] = useState("");
  const [pay, setPay] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState([]);
  const [badge, setBadge] = useState("New");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpgradeRequired, setIsUpgradeRequired] = useState(false);

  const submit = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    
    setLoading(true);
    setIsUpgradeRequired(false);
    try {
      const response = await authFetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          org,
          location,
          pay,
          description: desc,
          type,
          badge,
          tags,
        }),
      });
      const res = await response.json();
      
      if (res.error) {
        if (res.error.code === "PRO_UPGRADE_REQUIRED") {
          setIsUpgradeRequired(true);
        } else {
          toastError(res.error.message || "Failed to create listing.");
        }
      } else {
        setSuccess(true);
      }
    } catch (err) {
      console.error(err);
      toastError("Failed to create listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success)
    return (
      <div className="max-w-[680px] mx-auto my-16 px-6 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="font-syne text-2xl md:text-[28px] font-extrabold mb-3 text-text">
          Listing posted!
        </h2>
        <p className="text-base text-muted mb-8">
          Your listing is now live on the job board. Manage applicants from your dashboard.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem("immflow_dashboard_tab", "listings");
              setPage("dashboard");
            }}
            className="bg-green hover:bg-green-dark text-white py-3 px-6 rounded-lg border-none cursor-pointer text-[15px] font-medium transition-all duration-200"
          >
            Manage my listing
          </button>
          <button
            onClick={() => {
              setSuccess(false);
              setTitle("");
              setOrg("");
              setLocation("");
              setPay("");
              setDesc("");
            }}
            className="bg-white text-text py-3 px-6 rounded-lg border border-[rgba(0,0,0,0.15)] cursor-pointer text-[15px] font-medium"
          >
            Post another
          </button>
        </div>
      </div>
    );

  return (
    <div>
      <div className="bg-white border-b border-[rgba(0,0,0,0.09)] py-10 px-6">
        <div className="max-w-[680px] mx-auto">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-green mb-3">
            Post a listing
          </div>
          <h1 className="font-syne text-3xl md:text-4xl font-extrabold mb-5 text-text">
            What are you posting?
          </h1>
          <div className="flex flex-wrap gap-2">
            {LISTING_TYPES.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={`py-2 px-[18px] rounded-lg border text-xs font-medium cursor-pointer transition-all duration-200 ${
                  type === value
                    ? "border-green bg-green text-white"
                    : "border-[rgba(0,0,0,0.09)] bg-transparent text-muted hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-[680px] mx-auto my-8 px-6">
        {!user && (
          <div className="bg-amber-light border border-amber rounded-lg py-3 px-4 mb-6 text-[13px] text-[#633806] flex justify-between items-center gap-3 flex-wrap sm:flex-nowrap">
            <span>⚠️ You need an account to post a listing.</span>
            <button
              onClick={() => setShowAuth(true)}
              className="bg-amber hover:bg-[#a06010] text-white py-1.5 px-3.5 rounded-lg border-none cursor-pointer text-xs font-medium transition-all duration-200 shrink-0"
            >
              Sign up free
            </button>
          </div>
        )}
        {isUpgradeRequired && (
          <div className="bg-amber-light border border-amber rounded-xl p-5 mb-6 shadow-sm flex flex-col gap-3">
            <div className="text-sm font-bold text-[#633806] flex items-center gap-2">
              <span>🔒 ImmFlow Pro Upgrade Required</span>
            </div>
            <p className="text-xs text-[#633806]/85 leading-relaxed">
              You have reached the limit of 1 active listing for Free accounts. Upgrade to ImmFlow Pro to enjoy unlimited listings, access to our AI Matcher, and direct messaging with other attorneys.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setPage("dashboard")}
                className="bg-green hover:bg-green-dark text-white py-2 px-4 rounded-lg border-none cursor-pointer text-xs font-semibold transition-all"
              >
                Go to Billing & Subscriptions
              </button>
            </div>
          </div>
        )}
        <div className="bg-white border border-[rgba(0,0,0,0.09)] rounded-[14px] p-6 shadow-sm">
          {[
            [
              "Listing title",
              title,
              setTitle,
              "e.g. Hearing coverage — removal defense, June 10",
            ],
            ["Organization / firm", org, setOrg, "Your firm name"],
            ["Location", location, setLocation, "City, State"],
            ["Compensation", pay, setPay, "e.g. $500 flat, $175/hr"],
          ].map(([label, val, setter, ph]) => (
            <div key={label} className="mb-5">
              <div className="text-[13px] font-semibold text-text mb-1">
                {label}
              </div>
              <input
                value={val}
                onChange={(e) => setter(e.target.value)}
                placeholder={ph}
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
              />
            </div>
          ))}
          <div className="mb-5">
            <div className="text-[13px] font-semibold text-text mb-1">Badge</div>
            <div className="flex flex-wrap gap-2">
              {["New", "Urgent", "Open", "Featured"].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setBadge(b)}
                  className={`py-1.5 px-3 rounded-lg border text-xs font-medium cursor-pointer ${
                    badge === b ? "border-green bg-green text-white" : "border-[rgba(0,0,0,0.09)] text-muted"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-5">
            <TagInput
              label="Tags"
              value={tags}
              onChange={setTags}
              placeholder="EOIR, Spanish required, Remote…"
              hint="Add skills, case types, or requirements — shown on job board cards"
            />
          </div>
          <div className="mb-6">
            <div className="text-[13px] font-semibold text-text mb-1">
              Description
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the role, case, or hearing in detail…"
              className="w-full text-[13px] py-2.5 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent min-h-[100px] focus:outline-none focus:border-green"
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            className="bg-green hover:bg-green-dark text-white w-full py-3 rounded-lg border-none cursor-pointer text-[15px] font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Publishing…" : "Publish listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
