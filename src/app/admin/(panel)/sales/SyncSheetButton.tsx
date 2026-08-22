"use client";

import { useState } from "react";

export default function SyncSheetButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function sync() {
    setError(""); setMsg(null);
    if (!window.confirm("Push all retail sales into the connected Google Sheet? Safe to run anytime — existing rows update, none duplicate.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/sales/sync-all", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      setMsg(`Synced ${d.synced} rows to Google Sheet.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <button
        onClick={sync}
        disabled={busy}
        className="inline-flex items-center gap-2 border-2 border-navy text-navy font-bold text-sm px-4 py-2 rounded-lg hover:bg-navy hover:text-white transition disabled:opacity-50"
      >
        {busy ? "Syncing…" : "Sync all to Google Sheet"}
      </button>
      {msg && <span className="text-sm font-semibold text-green-700">✓ {msg}</span>}
      {error && <span className="text-sm font-semibold text-red">{error}</span>}
    </div>
  );
}
