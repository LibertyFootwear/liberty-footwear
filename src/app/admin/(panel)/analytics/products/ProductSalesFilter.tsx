"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const today = () => new Date().toISOString().slice(0, 10);
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

export default function ProductSalesFilter({ from, to, q }: { from: string; to: string; q: string }) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [query, setQuery] = useState(q);

  function apply(next?: { from?: string; to?: string; q?: string }) {
    const p = new URLSearchParams();
    const nf = next?.from ?? f, nt = next?.to ?? t, nq = next?.q ?? query;
    if (nf) p.set("from", nf);
    if (nt) p.set("to", nt);
    if (nq.trim()) p.set("q", nq.trim());
    router.push(`/admin/analytics/products${p.toString() ? `?${p}` : ""}`);
  }

  function preset(pf: string) {
    setF(pf); setT(today());
    apply({ from: pf, to: today() });
  }

  const inp = "border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">From</label>
          <input type="date" value={f} onChange={(e) => setF(e.target.value)} className={inp} />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">To</label>
          <input type="date" value={t} onChange={(e) => setT(e.target.value)} className={inp} />
        </div>
        <div className="flex-1 min-w-48">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Boot / stock #</label>
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="e.g. gary russet, KS0123…" className={`${inp} w-full`} />
        </div>
        <button onClick={() => apply()} className="px-5 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 transition">Apply</button>
        {(from || to || q) && (
          <button onClick={() => router.push("/admin/analytics/products")} className="px-3 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Clear</button>
        )}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide self-center">Quick:</span>
        {[
          { label: "Since Dec 2024", from: "2024-12-01" },
          { label: "Last 12 months", from: monthsAgo(12) },
          { label: "This year", from: `${new Date().getFullYear()}-01-01` },
        ].map((p) => (
          <button key={p.label} onClick={() => preset(p.from)}
            className="px-3 py-1 rounded-full bg-gray-100 hover:bg-navy hover:text-white text-xs font-semibold text-gray-600 transition">
            {p.label}
          </button>
        ))}
        <button onClick={() => { setF(""); setT(""); apply({ from: "", to: "" }); }}
          className="px-3 py-1 rounded-full bg-gray-100 hover:bg-navy hover:text-white text-xs font-semibold text-gray-600 transition">All time</button>
      </div>
    </div>
  );
}
