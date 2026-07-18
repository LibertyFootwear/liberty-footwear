"use client";

import { useState } from "react";

export default function NewsletterForm({ dark = false, onSuccess }: { dark?: boolean; onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) { setStatus("ok"); setTimeout(() => onSuccess?.(), 1500); }
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "ok") return (
    <p className={`text-sm ${dark ? "text-white/70" : "text-gray-600"}`}>
      Thanks for subscribing!
    </p>
  );

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="your@email.com"
        className={`flex-1 px-3 py-2 text-sm rounded border ${
          dark
            ? "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-tan"
            : "bg-white border-gray-300 text-gray-900 focus:border-navy"
        } focus:outline-none transition`}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-4 py-2 bg-red text-white text-sm font-semibold rounded hover:bg-red-dark transition disabled:opacity-50"
      >
        {status === "loading" ? "…" : "Join"}
      </button>
      {status === "error" && <p className="text-red text-xs mt-1">Error – try again.</p>}
    </form>
  );
}
