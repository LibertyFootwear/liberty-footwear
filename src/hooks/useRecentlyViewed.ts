"use client";
import { useEffect, useState } from "react";

const KEY = "lf_recently_viewed";
const MAX = 8;

export function useRecentlyViewed() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      setSlugs(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {
      setSlugs([]);
    }
  }, []);

  return slugs;
}

export function trackProduct(slug: string) {
  try {
    const current: string[] = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    const updated = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}
