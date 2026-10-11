"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const today = () => new Date().toISOString().slice(0, 10);
function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASONS = [
  { label: "Christmas (Nov–Dec)", m1: "11", m2: "12" },
  { label: "Oct–Dec", m1: "10", m2: "12" },
  { label: "Spring (Mar–May)", m1: "3", m2: "5" },
  { label: "Summer (Jun–Aug)", m1: "6", m2: "8" },
  { label: "Fall (Sep–Nov)", m1: "9", m2: "11" },
  { label: "Winter (Dec–Feb)", m1: "12", m2: "2" },
];

export default function ProductSalesFilter({ from, to, q, m1, m2, year, years }: {
  from: string; to: string; q: string; m1: string; m2: string; year: string; years: string[];
}) {
  const router = useRouter();
  const [f, setF] = useState(from);
  const [t, setT] = useState(to);
  const [query, setQuery] = useState(q);
  const [sm1, setSm1] = useState(m1);
  const [sm2, setSm2] = useState(m2);
  const [sy, setSy] = useState(year);

  function apply(next?: { from?: string; to?: string; q?: string; m1?: string; m2?: string; year?: string }) {
    const p = new URLSearchParams();
    const nf = next?.from ?? f, nt = next?.to ?? t, nq = next?.q ?? query;
    const n1 = next?.m1 ?? sm1, n2 = next?.m2 ?? sm2, ny = next?.year ?? sy;
    if (nf) p.set("from", nf);
    if (nt) p.set("to", nt);
    if (nq.trim()) p.set("q", nq.trim());
    if (n1 || n2) { p.set("m1", n1 || n2); p.set("m2", n2 || n1); }
    if (ny) p.set("year", ny);
    router.push(`/admin/analytics/products${p.toString() ? `?${p}` : ""}`);
  }

  function preset(pf: string) {
    setF(pf); setT(today());
    apply({ from: pf, to: today() });
  }

  function season(a: string, b: string) {
    setSm1(a); setSm2(b);
    apply({ m1: a, m2: b });
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
        {(from || to || q || m1 || year) && (
          <button onClick={() => { setF(""); setT(""); setQuery(""); setSm1(""); setSm2(""); setSy(""); router.push("/admin/analytics/products"); }} className="px-3 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Clear</button>
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
        <button onClick={() => { setF(""); setT(""); setSm1(""); setSm2(""); setSy(""); apply({ from: "", to: "", m1: "", m2: "", year: "" }); }}
          className="px-3 py-1 rounded-full bg-gray-100 hover:bg-navy hover:text-white text-xs font-semibold text-gray-600 transition">All time</button>
      </div>

      {/* Season: a month range, across all years or one year — what sells when */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Season from</label>
            <select value={sm1} onChange={(e) => setSm1(e.target.value)} className={inp}>
              <option value="">—</option>
              {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">to</label>
            <select value={sm2} onChange={(e) => setSm2(e.target.value)} className={inp}>
              <option value="">—</option>
              {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1">Year</label>
            <select value={sy} onChange={(e) => setSy(e.target.value)} className={inp}>
              <option value="">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button onClick={() => apply()} className="px-5 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 transition">Apply season</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide self-center">Seasons:</span>
          {SEASONS.map((s) => (
            <button key={s.label} onClick={() => season(s.m1, s.m2)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${m1 === s.m1 && m2 === s.m2 ? "bg-navy text-white" : "bg-gray-100 hover:bg-navy hover:text-white text-gray-600"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
