"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Minimal RFC-4180-ish CSV parser (handles quotes, commas, and newlines in quotes). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c === "\r") { /* ignore */ }
    else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export default function RepairsImport() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setError(""); setMsg(null);
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setFileName(f.name);
    const text = await f.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) { setError("File has no data rows."); setRows([]); return; }
    setRows(parsed);
  }

  async function doImport() {
    setError(""); setMsg(null);
    if (rows.length === 0) { setError("Choose a CSV file first."); return; }
    if (!window.confirm(`Import ${rows.length - 1} repair rows? Tip: run this once — re-importing the same file creates duplicates.`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/repairs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      setMsg(`Imported ${d.imported} repairs${d.skipped ? ` · ${d.skipped} blank rows skipped` : ""}.`);
      setRows([]); setFileName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-700 font-bold text-sm px-4 py-2 rounded-lg hover:border-navy transition whitespace-nowrap">
        Import CSV
      </button>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-100 rounded-xl p-4 w-full max-w-md">
      <div className="flex items-center justify-between mb-2">
        <p className="font-bold text-navy text-sm">Import Repairs &amp; Resoles (CSV)</p>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-navy text-xl leading-none">&times;</button>
      </div>
      <p className="text-xs text-gray-500 mb-3">In Google Sheets: File → Download → Comma-separated values (.csv). Columns are matched by name (Ordered, Promised, Complete, Picked Up, Price Quoted, Paid, Job description, Tag No., First/Last Name, Contact, Details).</p>

      <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-pointer hover:border-navy transition mb-3">
        {fileName || "Choose CSV file"}
        <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
      </label>

      {rows.length > 0 && <p className="text-xs text-gray-600 mb-3">{rows.length} rows loaded (incl. header).</p>}
      {error && <p className="text-red text-xs mb-2">{error}</p>}
      {msg && <p className="text-green-700 text-xs font-semibold mb-2">✓ {msg}</p>}

      <button onClick={doImport} disabled={busy || rows.length === 0} className="w-full py-2.5 bg-navy hover:bg-navy/90 text-white font-bold rounded-lg transition disabled:opacity-50">
        {busy ? "Importing…" : `Import ${rows.length ? rows.length - 1 : ""} repairs`}
      </button>
    </div>
  );
}
