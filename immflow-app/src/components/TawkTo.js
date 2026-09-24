"use client";

import Script from "next/script";

export default function TawkTo() {
  const propertyId =
    process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID?.trim() ||
    "6ab499d2519a0634452b8610";
  const widgetId =
    process.env.NEXT_PUBLIC_TAWK_WIDGET_ID?.trim() ||
    "1k38nhnqd";

  return (
    <Script
      id="tawk-to-widget"
      src={`https://embed.tawk.to/${encodeURIComponent(propertyId)}/${encodeURIComponent(widgetId)}`}
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  );
}
