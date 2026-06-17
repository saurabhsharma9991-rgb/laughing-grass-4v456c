"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { userCanAccess } from "@/lib/utils/feature-access";

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const [testMode, setTestMode] = useState(false);
  const [features, setFeatures] = useState({});
  const [freeListingLimit, setFreeListingLimit] = useState(1);
  const [loading, setLoading] = useState(true);

  const refreshPlatform = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/config");
      const data = await res.json();
      if (!data.error) {
        setTestMode(Boolean(data.testMode));
        setFeatures(data.features || {});
        setFreeListingLimit(data.freeListingLimit ?? 1);
      }
    } catch (e) {
      console.error("Failed to load platform config:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPlatform();
  }, [refreshPlatform]);

  const canAccess = useCallback(
    (featureKey, isPro = false) => userCanAccess(features, featureKey, isPro),
    [features]
  );

  return (
    <PlatformContext.Provider
      value={{
        testMode,
        features,
        freeListingLimit,
        loading,
        refreshPlatform,
        canAccess,
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return ctx;
}
