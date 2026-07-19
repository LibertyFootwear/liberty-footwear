"use client";
import { useEffect, useState } from "react";

// Shared across all ProductCards so we only hit /api/popular once per page load.
let cache: Set<string> | null = null;
let inflight: Promise<Set<string>> | null = null;

function loadPopular(): Promise<Set<string>> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetch("/api/popular")
      .then((r) => r.json())
      .then((d) => (cache = new Set<string>(d.stockNos ?? [])))
      .catch(() => (cache = new Set<string>()));
  }
  return inflight;
}

/** Set of stockNos that should show the "Popular" badge, driven by real sales. */
export function usePopular(): Set<string> {
  const [set, setSet] = useState<Set<string>>(cache ?? new Set());
  useEffect(() => {
    let alive = true;
    loadPopular().then((s) => {
      if (alive) setSet(s);
    });
    return () => {
      alive = false;
    };
  }, []);
  return set;
}
