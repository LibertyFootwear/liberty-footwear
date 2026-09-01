"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";
import { publicEnv } from "@/lib/publicEnv";

const SITE_KEY = publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

/**
 * Cloudflare Turnstile widget. Renders nothing unless NEXT_PUBLIC_TURNSTILE_SITE_KEY
 * is set — so the contact form still works before the keys are configured.
 * Calls onToken with the verification token (or null when it expires/errors).
 */
export default function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const cb = useRef(onToken);

  // Keep the latest callback without re-rendering the widget.
  useEffect(() => { cb.current = onToken; }, [onToken]);

  const doRender = () => {
    if (!SITE_KEY || !window.turnstile || !boxRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(boxRef.current, {
      sitekey: SITE_KEY,
      callback: (token: string) => cb.current(token),
      "expired-callback": () => cb.current(null),
      "error-callback": () => cb.current(null),
    });
  };

  // If the script was already loaded (e.g. client nav), render on mount.
  useEffect(() => { doRender(); }, []);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={doRender}
      />
      <div ref={boxRef} className="my-1" />
    </>
  );
}

export const TURNSTILE_ENABLED = !!SITE_KEY;
