import React, { useState } from "react";
import Link from "next/link";
import { useContent } from "./SiteContentContext";
import { pathForPage } from "@/lib/constants/routes";

export default function Nav({ page, navigate, setPage, user, setShowAuth }) {
  const go = navigate || setPage;
  const { get } = useContent();
  const [mobileOpen, setMobileOpen] = useState(false);

  const getInitials = (u) => {
    const name = u?.user_metadata?.full_name || u?.email || "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const logoText = get("nav.logo_text", "ImmFlow");
  const loginLabel = get("nav.btn_login", "Log in");
  const signupLabel = get("nav.btn_signup", "Sign up");

  const navLinks = [
    ["Find attorneys", "attorneys"],
    ["Job board", "jobs"],
    ["Network", "network"],
    ["AI matcher", "matcher"],
  ];

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

        <div className="hidden md:flex gap-6 items-center">
          {navLinks.map(([label, key]) => (
            <Link
              key={key}
              href={pathForPage(key)}
              onClick={() => go(key)}
              className={`text-sm cursor-pointer transition-all duration-200 no-underline ${
                page === key ? "text-green font-medium" : "text-muted hover:text-text"
              }`}
            >
              {label}
            </Link>
          ))}
          {user ? (
            <Link
              href={user.role === "admin" ? "/admin" : pathForPage("dashboard")}
              className="w-9 h-9 rounded-full bg-green-light text-green-dark flex items-center justify-center text-[13px] font-semibold cursor-pointer border-2 border-green transition-all hover:scale-105 no-underline"
            >
              {getInitials(user)}
            </Link>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="bg-transparent text-text py-2 px-4 rounded-lg text-sm border border-[rgba(0,0,0,0.15)] cursor-pointer transition-all duration-200 hover:bg-bg"
              >
                {loginLabel}
              </button>
              <button
                type="button"
                onClick={() => setShowAuth(true)}
                className="bg-green text-white py-2 px-[18px] rounded-lg text-sm border-none cursor-pointer transition-all duration-200 hover:bg-green-dark"
              >
                {signupLabel}
              </button>
            </div>
          )}
        </div>

        <div className="md:hidden flex items-center">
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
          {navLinks.map(([label, key]) => (
            <Link
              key={key}
              href={pathForPage(key)}
              onClick={() => {
                go(key);
                setMobileOpen(false);
              }}
              className={`text-sm cursor-pointer py-1 transition-all duration-200 no-underline ${
                page === key ? "text-green font-medium" : "text-muted hover:text-text"
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-[rgba(0,0,0,0.09)] pt-3 flex flex-col gap-3">
            {user ? (
              <Link
                href={user.role === "admin" ? "/admin" : pathForPage("dashboard")}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 cursor-pointer py-1 no-underline"
              >
                <div className="w-9 h-9 rounded-full bg-green-light text-green-dark flex items-center justify-center text-[13px] font-semibold border-2 border-green">
                  {getInitials(user)}
                </div>
                <span className="text-sm font-medium text-text">
                  {user.role === "admin" ? "Admin panel" : "Dashboard"}
                </span>
              </Link>
            ) : (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuth(true);
                    setMobileOpen(false);
                  }}
                  className="flex-1 bg-transparent text-text py-2 px-4 rounded-lg text-sm border border-[rgba(0,0,0,0.15)] hover:bg-bg cursor-pointer"
                >
                  {loginLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAuth(true);
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
