"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useI18n } from "@/components/I18nProvider";
import { useRestoredSession } from "@/lib/client/use-session";

export default function CmsPublicPage() {
  const params = useParams();
  const slug = params?.slug;
  const { locale } = useI18n();
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { user, sessionReady, logout } = useRestoredSession();

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(`/api/pages/${encodeURIComponent(slug)}?locale=${encodeURIComponent(locale)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setError(data.error.message || "Page not found.");
          setPage(null);
        } else {
          setPage(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load page.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, locale]);

  const navigate = (next) => {
    const map = {
      home: "/",
      services: "/services",
      attorneys: "/attorneys",
      jobs: "/jobs",
      network: "/network",
      matcher: "/matcher",
      post: "/post",
      dashboard: "/dashboard",
    };
    window.location.assign(map[next] || "/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg font-dm-sans">
      <Nav
        page=""
        navigate={navigate}
        user={user}
        sessionReady={sessionReady}
        onLogout={logout}
        setShowAuth={(value) => {
          const mode = value?.mode === "login" ? "login" : "signup";
          window.location.href = `/?auth=${mode}`;
        }}
      />
      <main className="flex-1 w-full mx-auto px-6 py-12 max-w-4xl">
        <Link href="/" className="text-xs text-green font-semibold no-underline">
          ← Back home
        </Link>
        {loading && <p className="text-sm text-muted mt-8">Loading…</p>}
        {!loading && error && (
          <div className="mt-8">
            <h1 className="font-syne text-3xl font-extrabold text-text">Page not found</h1>
            <p className="text-sm text-muted mt-3">{error}</p>
          </div>
        )}
        {!loading && page && (
          <article className="mt-6">
            <h1 className="font-syne text-3xl md:text-4xl font-extrabold text-text">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="text-base text-muted mt-3 leading-relaxed">{page.excerpt}</p>
            )}
            <div
              className="mt-8 text-sm text-text leading-relaxed [&_a]:text-green [&_a]:underline [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: page.bodyHtml || "" }}
            />
          </article>
        )}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}
