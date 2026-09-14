"use client";

import { useEffect, useRef } from "react";

/**
 * Hero background loop. Mobile browsers (esp. iOS Safari / Chrome) only autoplay
 * a video that is genuinely muted + inline — and React doesn't reliably set the
 * `muted` attribute on first render, so we force it on the element and kick off
 * play() ourselves. If autoplay is still blocked (e.g. iOS Low Power Mode), the
 * poster image shows instead.
 */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.defaultMuted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  return (
    <video
      ref={ref}
      className="absolute inset-0 w-full h-full object-cover"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/video/hero-poster.jpg"
      aria-hidden="true"
    >
      <source src="/video/hero-loop.mp4" type="video/mp4" />
    </video>
  );
}
