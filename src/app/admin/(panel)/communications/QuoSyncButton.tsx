"use client";

import { useState } from "react";
import { BTN_GHOST } from "../ui";

/** Push customers into Quo Contacts (grouped as "Liberty Footwear"). Batched — click again if more remain. */
export default function QuoSyncButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/admin/quo-sync", { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setMsg(d.error ?? "Sync failed."); return; }
      setMsg(`Synced ${d.synced}${d.failed ? ` · ${d.failed} failed` : ""}${d.more ? " · more left — click again" : " · all done ✓"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={run} disabled={busy} className={`${BTN_GHOST} whitespace-nowrap`}>
        {busy ? "Syncing…" : "Sync customers → Quo"}
      </button>
      {msg && <span className="text-xs text-gray-500">{msg}</span>}
    </div>
  );
}
