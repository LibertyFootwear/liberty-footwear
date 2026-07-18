"use client";
import { useState, useEffect } from "react";
import NewsletterForm from "./NewsletterForm";

const STORAGE_KEY = "lf_newsletter_dismissed";

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const id = setTimeout(() => setOpen(true), 10000);
    return () => clearTimeout(id);
  }, []);

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={dismiss} />

      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        style={{ animation: "fadeInUp 0.3s ease" }}>
        <div className="h-1.5 bg-red w-full" />

        <button
          type="button"
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-8 py-8">
          <p className="text-red text-xs font-black tracking-widest uppercase mb-2">Stay in the loop</p>
          <h2 className="text-2xl font-black text-navy mb-2">Boot Tips & New Arrivals</h2>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            Join our list for boot care guides, new styles, and early access to promotions. No spam — unsubscribe anytime.
          </p>
          <NewsletterForm onSuccess={dismiss} />
          <button
            type="button"
            onClick={dismiss}
            className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition w-full text-center"
          >
            No thanks
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
