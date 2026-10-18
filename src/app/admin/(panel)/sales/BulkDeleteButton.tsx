"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin: delete retail_sales rows in a date range (sale_date). Confirms exact count first. */
export default function BulkDeleteButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState<"" | "count" | "delete">("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function run(action: "count" | "delete") {
    setErr(""); setMsg(null); setBusy(action);
    try {
      const res = await fetch("/api/admin/sales/bulk-delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, confirm: action === "delete" }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      if (action === "count") {
        if (d.count === 0) { setMsg("No rows match this range."); return; }
        if (window.confirm(`Delete ${d.count} retail sale${d.count === 1 ? "" : "s"} between ${from || "the beginning"} and ${to || "today"}? This cannot be undone.`)) run("delete");
      } else {
        setMsg(`Deleted ${d.deleted} row${d.deleted === 1 ? "" : "s"}. Stock has been restored for sales (and removed for returns).`);
        router.refresh();
      }
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed."); }
    finally { setBusy(""); }
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 border-2 border-red text-red font-bold text-sm px-4 py-2 rounded-lg hover:bg-red hover:text-white transition">
      🗑 Delete by date
    </button>
  );

  const inp = "border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy";
  return (
    <div className="flex flex-wrap items-center gap-2 bg-red/5 border-2 border-red/30 rounded-lg px-3 py-2">
      <span className="text-xs font-bold text-red uppercase tracking-wide">Delete sales from</span>
      <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inp} />
      <span className="text-xs text-gray-500">to</span>
      <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inp} />
      <button onClick={() => run("count")} disabled={!!busy}
        className="px-4 py-2 bg-red text-white text-sm font-bold rounded-lg hover:bg-red-dark transition disabled:opacity-50">
        {busy ? "…" : "Preview & delete"}
      </button>
      <button onClick={() => { setOpen(false); setMsg(null); setErr(""); }} className="text-xs font-bold text-gray-400 hover:text-navy transition">Cancel</button>
      {msg && <span className="text-sm font-semibold text-green-700">✓ {msg}</span>}
      {err && <span className="text-sm font-semibold text-red">{err}</span>}
    </div>
  );
}
