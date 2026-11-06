import Link from "next/link";
import { isThanksgivingSeason } from "@/lib/season";

/**
 * Thin site-wide promo bar above the header. Reinforces the two biggest
 * conversion levers up front: free shipping on boots + made-in-USA trust.
 *
 * Seasonal override: through Thanksgiving weekend 2026 it swaps to a gift-card
 * push (the holiday with the highest gift-giving intent after Christmas).
 * The swap is fully automatic — flips back on 2026-11-30 with no edit needed.
 *
 * Server component (static) — hidden on /admin via PublicChrome.
 */
export default function AnnouncementBar() {
  if (isThanksgivingSeason()) {
    return (
      <div className="bg-[#7a1f1f] text-white text-center text-xs sm:text-sm font-semibold px-4 py-2">
        <span className="inline-flex flex-wrap justify-center items-center gap-2">
          <span aria-hidden>🦃</span>
          Give thanks, give boots —
          <Link href="/shop?category=Gift%20Cards" className="underline underline-offset-2 hover:text-white/80">
            Liberty Gift Cards delivered by email in minutes
          </Link>
          <span className="text-white/40 hidden sm:inline">·</span>
          <span className="hidden sm:inline">Order by Wed, Nov 25 for Thanksgiving</span>
        </span>
      </div>
    );
  }

  return (
    <div className="bg-navy text-white text-center text-xs sm:text-sm font-semibold px-4 py-2">
      <span className="inline-flex items-center gap-2">
        <span aria-hidden>🇺🇸</span>
        Free shipping on every boot order
        <span className="text-white/40">·</span>
        Handcrafted in Grand Rapids, MI
      </span>
    </div>
  );
}
