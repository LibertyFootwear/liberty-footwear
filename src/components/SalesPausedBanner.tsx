"use client";

import { useEffect, useState } from "react";

export interface PublicSiteSettings {
  salesEnabled: boolean;
  pausedMessage: string;
  contactPhone: string;
}

/** Fetch public site settings once (client-side). Returns null while loading. */
export function useSiteSettings(): PublicSiteSettings | null {
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((d) => { if (alive) setSettings(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return settings;
}

/** Turn a phone string into a tel: href (digits only). */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

/** Prominent banner shown on the storefront when online ordering is paused. */
export default function SalesPausedBanner({ settings }: { settings?: PublicSiteSettings | null }) {
  const fetched = useSiteSettings();
  const s = settings ?? fetched;
  if (!s || s.salesEnabled) return null;

  return (
    <div className="rounded-xl border-2 border-red bg-red/5 p-5 text-center">
      <p className="text-red font-black text-sm uppercase tracking-widest mb-2">Online ordering paused</p>
      <p className="text-navy font-semibold mb-3">{s.pausedMessage}</p>
      {s.contactPhone && (
        <a
          href={telHref(s.contactPhone)}
          className="inline-flex items-center gap-2 bg-red text-white font-bold px-6 py-3 rounded-xl hover:bg-red/90 transition"
        >
          📞 {s.contactPhone}
        </a>
      )}
    </div>
  );
}
