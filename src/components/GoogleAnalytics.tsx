"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { publicEnv } from "@/lib/publicEnv";

const GA_ID = publicEnv.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Sends a GA4 page_view on every route change. Next.js is a client-side SPA,
 * so only the first load would otherwise be counted reliably. We disable gtag's
 * automatic page_view (send_page_view:false below) and fire it here instead —
 * once on mount and again on each pathname/query change — so there's no double
 * counting and every navigation is tracked.
 */
function PageViews() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window.gtag !== "function") return;
    const query = searchParams?.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Google Analytics 4. Renders nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is
 * set, so builds and local/dev without the key are unaffected.
 */
export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}
