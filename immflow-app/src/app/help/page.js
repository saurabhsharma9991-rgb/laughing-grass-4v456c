"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { useContent } from "@/components/SiteContentContext";
import { useI18n } from "@/components/I18nProvider";
import { useRestoredSession } from "@/lib/client/use-session";

export default function HelpPage() {
  const { get } = useContent();
  const { t } = useI18n();
  const { user, sessionReady, logout } = useRestoredSession();

  const faq = get("help.faq", "")
    .split("\n")
    .map((line) => {
      const [question, ...answer] = line.split("|");
      return { question: question?.trim(), answer: answer.join("|").trim() };
    })
    .filter((item) => item.question && item.answer);

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
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12">
        <Link href="/" className="text-xs text-green font-semibold no-underline">
          ← {t("common.backHome", "Back home")}
        </Link>
        <h1 className="font-syne text-3xl font-extrabold mt-4">
          {t("help.title", "Help & frequently asked questions")}
        </h1>
        <p className="text-sm text-muted leading-relaxed mt-3">
          {get(
            "help.intro",
            "ImmFlow helps you discover independent immigration service professionals."
          )}
        </p>
        <div className="mt-8 space-y-3">
          {faq.map((item) => (
            <details
              key={item.question}
              className="bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-4"
            >
              <summary className="font-semibold text-sm cursor-pointer">
                {item.question}
              </summary>
              <p className="text-sm text-muted mt-3 leading-relaxed">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
        <p className="text-sm text-muted mt-8">
          {t("help.contact", "Need more help?")}{" "}
          <a
            href="mailto:support@myimmflow.com"
            className="text-green font-semibold"
          >
            support@myimmflow.com
          </a>
        </p>
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}
