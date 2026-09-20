import React from "react";
import Link from "next/link";
import { useContent } from "./SiteContentContext";
import { pathForPage } from "@/lib/constants/routes";
import { useI18n } from "@/components/I18nProvider";

export default function Footer({ navigate, setPage }) {
  const go = navigate || setPage;
  const { get } = useContent();
  const { t } = useI18n();

  const logoText = get("footer.logo_text", "ImmFlow");
  const description = get("footer.description", "Find verified immigration service professionals.");
  const copyright = get("footer.copyright", "© 2026 ImmFlow. All rights reserved.");
  const notes = get("footer.notes", "Verified providers · Discovery and connection only");

  const link = (label, pageKey) => (
    <Link
      key={label}
      href={pageKey === "help" ? "/help" : pathForPage(pageKey)}
      onClick={() => pageKey !== "help" && go(pageKey)}
      className="text-[13px] text-white/65 hover:text-white block mb-2 cursor-pointer transition-all duration-250 no-underline"
    >
      {label}
    </Link>
  );

  return (
    <footer className="bg-green-dark bg-hero-gradient py-12 px-6 mt-auto">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-12">
        <div className="sm:col-span-2">
          <div className="font-syne text-[20px] font-extrabold text-white mb-3">
            {logoText === "ImmFlow" ? (
              <>
                Imm<span className="text-green-medium">Flow</span>
              </>
            ) : (
              logoText
            )}
          </div>
          <p className="text-[13px] text-white/55 leading-relaxed max-w-sm">{description}</p>
        </div>
        {[
          [
            "Platform",
            [
              ["Find attorneys", "attorneys"],
              ["Job board", "jobs"],
              ["Network", "network"],
              ["AI matcher", "matcher"],
            ],
          ],
          [
            "Attorneys",
            [
              ["Create profile", "home"],
              ["Post listing", "post"],
              ["Pricing", "dashboard"],
            ],
          ],
          [
            "Company",
            [
              ["About", "home"],
              ["Contact", "home"],
              [t("help.title", "Help & FAQ"), "help"],
              ["Terms", "home"],
            ],
          ],
        ].map(([heading, links]) => (
          <div key={heading} className="col-span-1">
            <div className="text-[11px] font-medium tracking-wider uppercase text-white/40 mb-4">
              {heading}
            </div>
            {links.map(([label, key]) => link(label, key))}
          </div>
        ))}
      </div>
      <div className="max-w-[1100px] mx-auto mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between flex-wrap gap-3">
        <span className="text-xs text-white/35">{copyright}</span>
        <span className="text-xs text-white/35">{notes}</span>
      </div>
    </footer>
  );
}
