"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface Row { stockNo: string; size: string; qty: number }
interface Parsed { rows: Row[]; models: number; pairs: number; known: number; unknown: string[] }

/** Format a size header cell ("6" / "8.5" / "13") from its numeric value. */
function fmtSize(v: unknown): string {
  if (typeof v === "number") return String(v); // 6 → "6", 8.5 → "8.5"
  return String(v ?? "").trim();
}

/** Guess the count date from a filename like "... 072426.xls" → 2026-07-24. */
function dateFromName(name: string): string {
  const m = name.match(/(\d{2})(\d{2})(\d{2})/);
  if (!m) return "";
  const [, mm, dd, yy] = m;
  return `20${yy}-${mm}-${dd}`;
}

/**
 * Parse the standard "Finished Boots Inventory" sheet: row 0 is a size header
 * (cols 2+), each model has a row whose col A is "<stock#> <name>" plus M/EW
 * width rows with a quantity under each size.
 */
function parseWorkbook(data: ArrayBuffer, knownStocks: Set<string>): Parsed {
  const wb = XLSX.read(data, { type: "array" });
  const sh = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sh, { header: 1, raw: true, defval: "" });
  const header = (aoa[0] ?? []) as unknown[];
  const sizes = header.slice(2).map(fmtSize);

  const rows: Row[] = [];
  let cur = "";
  for (let r = 1; r < aoa.length; r++) {
    const row = (aoa[r] ?? []) as unknown[];
    const c0 = String(row[0] ?? "").trim();
    const c1 = String(row[1] ?? "").trim();
    if (c0.toUpperCase().startsWith("KS")) cur = c0.split(/\s+/)[0];
    if (cur && (c1 === "M" || c1 === "EW")) {
      for (let i = 0; i < sizes.length; i++) {
        const v = row[2 + i];
        if (typeof v === "number" && v !== 0 && sizes[i]) {
          rows.push({ stockNo: cur, size: `${c1} ${sizes[i]}`, qty: Math.round(v) });
        }
      }
    }
  }

  const stocks = new Set(rows.map((r) => r.stockNo));
  const unknown = [...stocks].filter((s) => !knownStocks.has(s)).sort();
  return {
    rows,
    models: stocks.size,
    pairs: rows.reduce((n, r) => n + r.qty, 0),
    known: stocks.size - unknown.length,
    unknown,
  };
}

export default function InventoryImport({ knownStocks }: { knownStocks: string[] }) {
  const router = useRouter();
  const knownSet = new Set(knownStocks);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [fileName, setFileName] = useState("");
  const [date, setDate] = useState("");
  const [by, setBy] = useState("Don");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(""); setDone("");
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setDate((d) => d || dateFromName(f.name));
    try {
      const buf = await f.arrayBuffer();
      const p = parseWorkbook(buf, knownSet);
      if (p.rows.length === 0) { setError("No inventory rows found in that file."); setParsed(null); return; }
      setParsed(p);
    } catch {
      setError("Couldn't read that file. Make sure it's the standard .xls inventory sheet.");
      setParsed(null);
    }
  }

  async function doImport() {
    if (!parsed) return;
    setBusy(true); setError(""); setDone("");
    try {
      const res = await fetch("/api/admin/inventory/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsed.rows, inventoryDate: date || undefined, responsibleBy: by }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Import failed (${res.status})`);
      setDone(`Imported ${d.imported} size counts.`);
      setParsed(null); setFileName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const cls = "border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy";

  return (
    <details className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <summary className="cursor-pointer px-5 py-4 font-bold text-navy select-none">↥ Import counted inventory (.xls)</summary>
      <div className="px-5 pb-5 pt-1 space-y-4">
        <p className="text-sm text-gray-500">
          Upload the standard <span className="font-mono">Finished Boots Inventory</span> sheet. Only the sizes listed
          in the file are overwritten; sizes not in the file are left as they are.
        </p>

        <input type="file" accept=".xls,.xlsx" onChange={onFile}
          className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-4 file:py-2 file:text-white file:font-bold" />

        {parsed && (
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm space-y-2">
            <p className="text-gray-700"><span className="font-bold">{fileName}</span></p>
            <p className="text-gray-600">
              {parsed.models} models · {parsed.rows.length} size counts · {parsed.pairs} pairs
              {" · "}<span className="text-green-700 font-semibold">{parsed.known} on the website</span>
              {parsed.unknown.length > 0 && <>{" · "}<span className="text-amber-700 font-semibold">{parsed.unknown.length} not on the website</span></>}
            </p>
            {parsed.unknown.length > 0 && (
              <p className="text-xs text-gray-400">
                Not shown in the grid below (not in the catalog), but their counts are still saved: {parsed.unknown.join(", ")}
              </p>
            )}
            <div className="flex flex-wrap items-end gap-4 pt-1">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Inventory date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cls} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Counted by</span>
                <input value={by} onChange={(e) => setBy(e.target.value)} placeholder="Name" className={cls} />
              </label>
              <button onClick={doImport} disabled={busy}
                className="px-6 py-2 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50">
                {busy ? "Importing…" : "Import"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red font-semibold">{error}</p>}
        {done && <p className="text-sm text-green-700 font-semibold">{done}</p>}
      </div>
    </details>
  );
}
