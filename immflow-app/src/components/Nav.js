import React, { useState } from "react";
import Link from "next/link";
import { useContent } from "./SiteContentContext";
import { useI18n } from "./I18nProvider";
import { pathForPage } from "@/lib/constants/routes";
import { accountCapabilities } from "@/lib/constants/account-capabilities";

export default function Nav({ page, navigate, setPage, user, setShowAuth, sessionReady = true, onLogout }) {
  const go = navigate || setPage;
  const { get, menu } = useContent();
  const { t, locale, setLocale, locales } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const logoText = get("nav.logo_text", "ImmFlow");
  const loginLabel = get("nav.btn_login", t("nav.login", "Log in"));
  const signupLabel = get("nav.btn_signup", t("nav.signup", "Sign up"));

  const role = user?.role;
  const caps = accountCapabilities(user);
  const navLinks = (
    caps.isClient
      ? [
          [t("nav.services", "Services"), "services", pathForPage("services")],
          [t("nav.findAttorneys", "Find attorneys"), "attorneys", pathForPage("attorneys")],
          [t("nav.aiMatcher", "AI matcher"), "matcher", pathForPage("matcher")],
        ]
      : caps.isAttorney || caps.isServiceProvider
        ? [
            ...(caps.isServiceProvider
              ? [[t("nav.services", "Services"), "services", pathForPage("services")]]
              : []),
            ...(caps.isAttorney
              ? [
                  [t("nav.jobBoard", "Job board"), "jobs", pathForPage("jobs")],
                  [t("nav.network", "Network"), "network", pathForPage("network")],
                ]
              : []),
            [t("nav.findAttorneys", "Find attorneys"), "attorneys", pathForPage("attorneys")],
            [t("nav.aiMatcher", "AI matcher"), "matcher", pathForPage("matcher")],
          ]
        : [
            [t("nav.services", "Services"), "services", pathForPage("services")],
            [t("nav.findAttorneys", "Find attorneys"), "attorneys", pathForPage("attorneys")],
            [t("nav.jobBoard", "Job board"), "jobs", pathForPage("jobs")],
            [t("nav.network", "Network"), "network", pathForPage("network")],
            [t("nav.aiMatcher", "AI matcher"), "matcher", pathForPage("matcher")],
          ]
  ).concat((menu?.nav || []).map((item) => [item.title, `cms:${item.slug}`, item.href]));

  const accountHref = role === "admin" ? "/admin" : pathForPage("dashboard");
  const accountLabel = role === "admin" ? "Admin" : "Dashboard";

  const languageSelect = (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      aria-label={t("nav.language", "Language")}
      className="text-xs py-1.5 px-2 rounded-lg border border-[rgba(0,0,0,0.12)] bg-white text-text cursor-pointer max-w-[120px]"
    >
      {locales.map((l) => (
        <option key={l.code} value={l.code}>
          {l.nativeLabel}
        </option>
      ))}
    </select>
  );

  const renderLink = (label, key, href, onNavigate) => {
    const isCms = String(key).startsWith("cms:");
    return (
      <Link
        key={key}
        href={href}
        onClick={() => {
          if (!isCms && go) go(key);
          onNavigate?.();
        }}
        className={`text-sm cursor-pointer transition-all duration-200 no-underline ${
          page === key ? "text-green font-medium" : "text-muted hover:text-text"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="bg-nav border-b border-[rgba(20,30,48,0.12)] sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-[1100px] mx-auto px-6 h-15 flex items-center justify-between">
        <Link
          href={pathForPage("home")}
          onClick={() => go("home")}
          className="font-syne text-[22px] font-extrabold cursor-pointer text-text no-underline"
        >
          {logoText === "ImmFlow" ? (
            <>
              Imm<span className="text-green">Flow</span>
            </>
          ) : (
            logoText
          )}
        </Link>

        <div className="hidden md:flex gap-5 items-center">
          {navLinks.map(([label, key, href]) => renderLink(label, key, href))}
          {locales.length > 1 && languageSelect}
          {!sessionReady ? (
            <span className="text-xs text-muted">…</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href={accountHref}
                className="text-sm font-semibold text-green no-underline hover:underline"
              >
                {accountLabel}
              </Link>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-muted bg-transparent border-none cursor-pointer hover:text-text"
                >
                  Log out
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAuth({ mode: "login" })}
                className="bg-transparent text-text py-2 px-4 rounded-lg text-sm border border-[rgba(0,0,0,0.15)] cursor-pointer transition-all duration-200 hover:bg-bg"
              >
                {loginLabel}
              </button>
              <button
                type="button"
                onClick={() => setShowAuth({ mode: "signup" })}
                className="bg-green text-white py-2 px-[18px] rounded-lg text-sm border-none cursor-pointer transition-all duration-200 hover:bg-green-dark"
              >
                {signupLabel}
              </button>
            </div>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {locales.length > 1 && languageSelect}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-muted hover:text-text focus:outline-none cursor-pointer p-1"
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[rgba(20,30,48,0.12)] bg-surface px-6 py-4 flex flex-col gap-4 shadow-inner">
          {navLinks.map(([label, key, href]) =>
            renderLink(label, key, href, () => setMobileOpen(false))
          )}
          <div className="border-t border-[rgba(0,0,0,0.09)] pt-3 flex flex-col gap-3">
            {!sessionReady ? (
              <span className="text-xs text-muted">Checking session…</span>
            ) : user ? (
              <div className="flex flex-col gap-2">
                <Link
                  href={accountHref}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-semibold text-green no-underline"
                >
                  {accountLabel}
                </Link>
                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      onLogout();
                    }}
                    className="text-left text-sm text-muted bg-transparent border-none cursor-pointer"
                  >
                    Log out
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuth({ mode: "login" });
                    setMobileOpen(false);
                  }}
                  className="flex-1 bg-transparent text-text py-2 px-4 rounded-lg text-sm border border-[rgba(0,0,0,0.15)] hover:bg-bg cursor-pointer"
                >
                  {loginLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAuth({ mode: "signup" });
                    setMobileOpen(false);
                  }}
                  className="flex-1 bg-green text-white py-2 px-4 rounded-lg text-sm border-none hover:bg-green-dark cursor-pointer"
                >
                  {signupLabel}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
