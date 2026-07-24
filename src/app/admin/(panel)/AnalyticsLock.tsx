"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsLock({ title = "Protected" }: { title?: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/analytics-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      setError("Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-sm mx-auto mt-16 bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-5 text-2xl">🔒</div>
        <h1 className="text-lg font-black text-navy mb-1">{title}</h1>
        <p className="text-sm text-gray-500 mb-6">This section shows revenue data and needs a separate password.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="Analytics password"
            className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy transition text-center"
          />
          {error && <p className="text-xs text-red font-semibold">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 bg-navy text-white font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50"
          >
            {loading ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
