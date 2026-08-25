/**
 * Thin site-wide promo bar above the header. Reinforces the two biggest
 * conversion levers up front: free shipping on boots + made-in-USA trust.
 * Server component (static) — hidden on /admin via PublicChrome.
 */
export default function AnnouncementBar() {
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
