"use client";

import React from "react";
import { usePlatform } from "./PlatformContext";

export default function TestModeBanner() {
  const { testMode } = usePlatform();
  if (!testMode) return null;

  return (
    <div className="bg-amber text-white text-center text-xs font-semibold py-2 px-4 tracking-wide">
      TEST MODE — Simulated billing and staging tools are enabled
    </div>
  );
}
