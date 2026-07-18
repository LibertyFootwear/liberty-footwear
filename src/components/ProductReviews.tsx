"use client";
import { useState, useEffect } from "react";
import { useLang } from "@/context/LanguageContext";

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

function Stars({ value, interactive, onChange }: { value: number; interactive?: boolean; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={interactive ? "button" : undefined}
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer" : "cursor-default pointer-events-none"}
          aria-label={interactive ? `${n} stars` : undefined}
        >
          <svg className={`w-5 h-5 ${(hover || value) >= n ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ProductReviews({ stockNo }: { stockNo: string }) {
  const { t } = useLang();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ author: "", rating: 0, text: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/reviews?stockNo=${stockNo}`)
      .then((r) => r.json())
      .then((data) => { setReviews(data); setLoading(false); });
  }, [stockNo]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.rating === 0) { setError("Please select a star rating."); return; }
    setSubmitting(true);
    setError("");
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockNo, ...form }),
    });
    if (res.ok) {
      const newReview = await res.json();
      setReviews((prev) => [...prev, newReview]);
      setDone(true);
      setShowForm(false);
      setForm({ author: "", rating: 0, text: "" });
    } else {
      const data = await res.json();
      setError(data.error || "Failed to submit review.");
    }
    setSubmitting(false);
  }

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="mt-20 border-t border-gray-100 pt-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-2xl font-black text-navy">{t.product.reviews}</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-3 mt-2">
              <Stars value={Math.round(avg)} />
              <span className="text-gray-500 text-sm">{avg.toFixed(1)} {t.product.outOf} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
        {!showForm && !done && (
          <button onClick={() => setShowForm(true)} className="bg-navy hover:bg-navy/80 text-white font-bold px-5 py-2.5 rounded-lg transition text-sm">
            {t.product.writeReview}
          </button>
        )}
        {done && <p className="text-green-600 font-semibold text-sm">{t.product.reviewThanks}</p>}
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-cream rounded-2xl p-6 mb-10">
          <h3 className="font-black text-navy text-lg mb-5">Your Review</h3>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.product.reviewRating}</label>
            <Stars value={form.rating} interactive onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.product.reviewName}</label>
            <input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              required maxLength={100}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
              placeholder="Your name"
            />
          </div>
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t.product.reviewText}</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              required minLength={5} maxLength={2000} rows={4}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy resize-none"
              placeholder={t.product.reviewPlaceholder}
            />
          </div>
          {error && <p className="text-red text-sm mb-4">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="bg-red hover:bg-red/80 text-white font-bold px-6 py-2.5 rounded-lg transition text-sm disabled:opacity-50">
              {submitting ? "…" : t.product.reviewSubmit}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-500 hover:text-navy font-semibold text-sm px-4 py-2.5 transition">
              {t.product.reviewCancel}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">{t.product.noReviews}</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-gray-100 pb-6">
              <div className="flex items-center gap-3 mb-2">
                <Stars value={r.rating} />
                <span className="font-bold text-navy text-sm">{r.author}</span>
                <span className="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
