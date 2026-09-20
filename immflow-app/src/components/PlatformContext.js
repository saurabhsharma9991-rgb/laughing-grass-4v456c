"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { userCanAccess } from "@/lib/utils/feature-access";

const PlatformContext = createContext(null);

function formatPrice(price) {
  if (!price || !Number.isInteger(price.unitAmount) || !price.currency) return null;
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency.toUpperCase(),
  });
  const digits = formatter.resolvedOptions().maximumFractionDigits;
  return formatter.format(price.unitAmount / 10 ** digits);
}

function formatCadence(price) {
  if (!price?.interval) return "";
  const count = Number(price.intervalCount) || 1;
  if (count === 1) {
    return `/${{ day: "day", week: "week", month: "mo", year: "yr" }[price.interval] || price.interval}`;
  }
  return `/${count} ${price.interval}${count === 1 ? "" : "s"}`;
}

function formatBillingPeriod(price) {
  if (!price?.interval) return "";
  const count = Number(price.intervalCount) || 1;
  if (count > 1) return `Billed every ${count} ${price.interval}s`;
  return `Billed ${{ day: "daily", week: "weekly", month: "monthly", year: "yearly" }[price.interval] || price.interval}`;
}

export function PlatformProvider({ children }) {
  const [testMode, setTestMode] = useState(false);
  const [features, setFeatures] = useState({});
  const [freeListingLimit, setFreeListingLimit] = useState(1);
  const [subscriptionPrice, setSubscriptionPrice] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshPlatform = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/config");
      const data = await res.json();
      if (!data.error) {
        setTestMode(Boolean(data.testMode));
        setFeatures(data.features || {});
        setFreeListingLimit(data.freeListingLimit ?? 1);
        setSubscriptionPrice(data.subscriptionPrice || null);
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
        subscriptionPrice,
        subscriptionPriceLabel: formatPrice(subscriptionPrice),
        subscriptionPriceCadence: formatCadence(subscriptionPrice),
        subscriptionBillingPeriod: formatBillingPeriod(subscriptionPrice),
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
