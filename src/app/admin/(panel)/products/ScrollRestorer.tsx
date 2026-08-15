"use client";

import { useEffect } from "react";

const KEY = "admin-products-scroll";

/**
 * Persists the window scroll position for the products list so returning from a
 * product's edit page lands back where the user was, not at the top.
 */
export default function ScrollRestorer() {
  useEffect(() => {
    const saved = sessionStorage.getItem(KEY);
    if (saved) {
      const y = parseInt(saved, 10);
      if (!Number.isNaN(y)) {
        // Wait a frame so the list is laid out before we jump.
        requestAnimationFrame(() => window.scrollTo(0, y));
      }
    }

    const save = () => sessionStorage.setItem(KEY, String(window.scrollY));
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  return null;
}
