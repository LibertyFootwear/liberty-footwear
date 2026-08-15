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
    const target = saved ? parseInt(saved, 10) : NaN;
    let restoring = false;

    if (!Number.isNaN(target) && target > 0) {
      restoring = true;
      // The list (and its images) may still be laying out when we mount, which
      // shrinks the scrollable height and clamps our target. Keep re-applying
      // the position for a short window until it actually sticks.
      const start = performance.now();
      let raf = 0;
      const apply = () => {
        window.scrollTo(0, target);
        if (Math.abs(window.scrollY - target) > 2 && performance.now() - start < 1500) {
          raf = requestAnimationFrame(apply);
        } else {
          restoring = false;
        }
      };
      raf = requestAnimationFrame(apply);
      // Stop forcing the position once the user takes over by scrolling.
      const stop = () => { cancelAnimationFrame(raf); restoring = false; };
      window.addEventListener("wheel", stop, { passive: true, once: true });
      window.addEventListener("touchmove", stop, { passive: true, once: true });
    }

    // Don't record the position while we're programmatically restoring it —
    // our own scrollTo() fires scroll events whose (clamped) values would
    // otherwise clobber the saved target.
    const save = () => { if (!restoring) sessionStorage.setItem(KEY, String(window.scrollY)); };
    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, []);

  return null;
}
