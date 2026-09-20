"use client";

import React from "react";
import Link from "next/link";
import Tag from "@/components/Tag";

const STATUS_COLORS = {
  verified: "bg-green-light text-green-dark",
  pending: "bg-amber-light text-amber",
};

export default function ProviderCard({ provider }) {
  if (!provider) return null;
  const href = `/providers/${provider.id}`;
  const stars = Number(provider.stars || 0).toFixed(1);

  return (
    <Link
      href={href}
      className="block bg-white border border-[rgba(0,0,0,0.09)] rounded-xl p-5 shadow-sm hover:border-green/40 transition-all no-underline text-inherit"
    >
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-full bg-green-light text-green-dark flex items-center justify-center text-sm font-bold shrink-0">
          {provider.initials || "P"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-text text-sm truncate">{provider.displayName}</h3>
            {provider.badge && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS.verified}`}>
                {provider.badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted mt-0.5">
            {provider.categoryName}
            {provider.location ? ` · ${provider.location}` : ""}
            {provider.rate ? ` · ${provider.rate}` : ""}
          </p>
          <p className="text-[11px] text-muted-high mt-1">
            ★ {stars} ({provider.reviewsCount || 0})
            {provider.remoteAvailable ? " · Remote" : ""}
            {provider.inPersonAvailable ? " · In person" : ""}
          </p>
          {(provider.languages || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.languages.slice(0, 4).map((lang) => (
                <Tag key={lang}>{lang}</Tag>
              ))}
            </div>
          )}
          {(provider.languagePairs || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {provider.languagePairs.slice(0, 3).map((lp) => (
                <Tag key={`${lp.source}-${lp.target}`}>
                  {lp.source} → {lp.target}
                </Tag>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
