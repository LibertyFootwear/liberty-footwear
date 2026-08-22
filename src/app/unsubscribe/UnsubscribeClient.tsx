"use client";

import { useState } from "react";
import Link from "next/link";

export default function UnsubscribeClient({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Failed to unsubscribe.");
      }
      setStatus("ok");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unsubscribe.");
      setStatus("error");
    }
  }

  if (status === "ok") {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-2xl font-black text-navy mb-2">You&apos;ve been unsubscribed</h1>
        <p className="text-gray-500 mb-8">You won&apos;t receive any more marketing emails from Liberty Footwear. Sorry to see you go.</p>
        <Link href="/shop" className="inline-block bg-navy hover:bg-red text-white font-bold px-7 py-3 rounded-lg transition">Back to the shop</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-2">Unsubscribe</h1>
      <p className="text-gray-500 mb-6">Enter your email to stop receiving Liberty Footwear emails.</p>
      <form onSubmit={submit} className="space-y-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-navy transition"
        />
        {error && <p className="text-red text-sm">{error}</p>}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full py-3.5 font-black bg-red hover:bg-red/90 text-white rounded-lg transition disabled:opacity-60 uppercase tracking-wide"
        >
          {status === "loading" ? "Unsubscribing…" : "Unsubscribe"}
        </button>
      </form>
      <p className="text-xs text-gray-400 mt-6 text-center">
        Changed your mind? <Link href="/" className="text-navy font-semibold hover:underline">Return to Liberty Footwear</Link>
      </p>
    </div>
  );
}
