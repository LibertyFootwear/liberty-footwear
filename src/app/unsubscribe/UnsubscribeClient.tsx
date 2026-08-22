"use client";

import { useState } from "react";
import Link from "next/link";

const CATEGORIES: { key: string; label: string; desc: string }[] = [
  { key: "newsletter",    label: "Newsletter",     desc: "Stories, tips, and news from the workshop" },
  { key: "specialOffers", label: "Special Offers", desc: "Promotions, discounts, and sales" },
  { key: "newProducts",   label: "New Products",   desc: "New boots and gear as they launch" },
  { key: "blog",          label: "Blog",           desc: "New articles from our blog" },
];

export default function UnsubscribeClient({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");
  const [account, setAccount] = useState(false);

  function toggle(key: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function submit(types: string[]) {
    setError("");
    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (types.length === 0) { setError("Please choose what to unsubscribe from — or use “Unsubscribe from all”."); return; }
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, types }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Failed to update.");
      setAccount(!!d.accountFound);
      setStatus("ok");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update.");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-black text-navy mb-2">Preferences updated</h1>
        <p className="text-gray-500 mb-2">
          You&apos;ve been unsubscribed from the selected emails. Sorry to see you go.
        </p>
        {account && (
          <p className="text-gray-400 text-sm mb-8">You can fine-tune all your email preferences anytime in your <Link href="/account" className="text-navy font-semibold hover:underline">account settings</Link>.</p>
        )}
        <div className="mt-6">
          <Link href="/shop" className="inline-block bg-navy hover:bg-red text-white font-bold px-7 py-3 rounded-lg transition">Back to the shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-2">Unsubscribe</h1>
      <p className="text-gray-500 mb-6">Choose which emails you&apos;d like to stop receiving. Have an account? This updates your preferences too.</p>

      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Your email</label>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 mb-5 focus:outline-none focus:border-navy transition"
      />

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Stop receiving</p>
      <div className="space-y-2 mb-5">
        {CATEGORIES.map((c) => (
          <label key={c.key} className="flex items-start gap-3 border-2 border-gray-100 rounded-lg p-3 cursor-pointer hover:border-navy/40 transition">
            <input type="checkbox" checked={selected.has(c.key)} onChange={() => toggle(c.key)} className="mt-0.5 w-4 h-4 accent-navy" />
            <span>
              <span className="block font-bold text-navy text-sm">{c.label}</span>
              <span className="block text-xs text-gray-500">{c.desc}</span>
            </span>
          </label>
        ))}
      </div>

      {error && <p className="text-red text-sm mb-3">{error}</p>}

      <button
        onClick={() => submit([...selected])}
        disabled={status === "loading"}
        className="w-full py-3.5 font-black bg-navy hover:bg-navy/90 text-white rounded-lg transition disabled:opacity-60 uppercase tracking-wide mb-3"
      >
        {status === "loading" ? "Updating…" : "Update preferences"}
      </button>
      <button
        onClick={() => submit(["all"])}
        disabled={status === "loading"}
        className="w-full py-3 font-bold text-red hover:underline disabled:opacity-60"
      >
        Unsubscribe from all emails
      </button>
    </div>
  );
}
