"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Passcode prompt shown in place of Dashboard/Analytics until the code is entered. */
export default function AnalyticsGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/analytics-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError("Wrong code — try again.");
      setCode("");
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-8">
      <form onSubmit={submit} className="w-full max-w-xs bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="text-3xl mb-3">🔒</div>
        <h1 className="text-lg font-black text-navy mb-1">Locked</h1>
        <p className="text-sm text-gray-400 mb-6">Enter the code to view analytics.</p>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code"
          className="w-full text-center tracking-[0.4em] text-lg border-2 border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-navy"
        />
        {error && <p className="text-xs text-red font-semibold mt-3">{error}</p>}
        <button
          type="submit"
          disabled={busy || !code}
          className="mt-5 w-full px-5 py-2.5 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </div>
  );
}
