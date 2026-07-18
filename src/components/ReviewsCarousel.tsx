"use client";
import { useState, useEffect, useCallback } from "react";

const REVIEWS = [
  {
    text: "Petr made me two custom boots at this point, form fitting to EACH FOOT. When leather work boots are comfy enough to wear on a date in a pinch, you know you have good boots. If you are in the need of boots, this is the place to go.",
    author: "Donny Soules",
  },
  {
    text: "If you want some really really good work boots and hospitality, go and just talk to him. I promise you that you will not regret the decision!",
    author: "Thomas Brown",
  },
  {
    text: "WOW, I think Liberty Footwear has a customer for life. Petr was very kind, super helpful, and I am now wearing the most comfortable pair of work-boots I've ever owned. Thank you for a great product, made right here in Grand Rapids. You don't see too many places like this anymore. I'll be back.",
    author: "Steven R LaWarre",
  },
  {
    text: "Recently purchased my first pair after looking at the website for months. Stopped in just to check it out and was very impressed. I ended up purchasing a pair that day & have started using them. The boots are amazing & customer service was fantastic. Petr helped me through finding the right pair for me & making sure everything fit properly. Will continue to bring my business here from now on.",
    author: "Cole Emery",
  },
];

export default function ReviewsCarousel({ googleBtnLabel = "See all reviews on Google" }: { googleBtnLabel?: string }) {
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((idx: number) => {
    setVisible(false);
    setTimeout(() => {
      setActive(idx);
      setVisible(true);
    }, 300);
  }, []);

  const next = useCallback(() => goTo((active + 1) % REVIEWS.length), [active, goTo]);
  const prev = () => goTo((active - 1 + REVIEWS.length) % REVIEWS.length);

  useEffect(() => {
    if (paused || REVIEWS.length < 2) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [paused, next]);

  const r = REVIEWS[active];

  return (
    <div
      className="relative max-w-4xl mx-auto text-center px-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="transition-all duration-300"
        style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)" }}
      >
        <p className="text-navy text-xl lg:text-2xl font-bold leading-relaxed">
          {r.text}
        </p>
        <div className="mt-6 flex items-center justify-center">
          <p className="text-gray-500 font-semibold">{r.author}</p>
        </div>
      </div>

      <div className="mt-8">
        <a
          href="https://www.google.com/search?sca_esv=f9a143fe12cd4714&hl=cs-US&sxsrf=APpeQnuUaM9qh5pbIRPT6ZNlfzF6E74Rbw:1784413928468&si=APenkKm7iecQ4G6P-TsbSMFKIQtv3EFIqRAFw-i8uEbk55Z-_xZe46s5oqymSyFdtcoefDuNb1FMU2BCZrKGjLFFFbHtVA0Sl-hx4Ce-1YiemEbu3BEHUM0VaMSbsDDCtHt9i4DG07G5pHe4DpRXdj3gd_nOqYVUMg%3D%3D&q=Liberty+Footwear,+Inc.+Recenze&sa=X&ved=2ahUKEwiDqdryo92VAxVyrysGHUzIGcgQ0bkNegQIPxAH"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 border border-navy/30 hover:border-navy text-navy font-semibold px-6 py-2.5 rounded-lg transition text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {googleBtnLabel}
        </a>
      </div>

      {REVIEWS.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-navy/20 hover:border-navy flex items-center justify-center transition"
            aria-label="Previous review"
          >
            <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 border-navy/20 hover:border-navy flex items-center justify-center transition"
            aria-label="Next review"
          >
            <svg className="w-4 h-4 text-navy" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="flex justify-center gap-2 mt-6">
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${i === active ? "bg-navy w-6" : "bg-gray-300 hover:bg-gray-400 w-2"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
