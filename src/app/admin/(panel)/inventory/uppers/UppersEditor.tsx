"use client";

import { useState } from "react";

interface Upper {
  sku: string;
  name: string;
  m: Record<string, string>;
  ew: Record<string, string>;
}

export default function UppersEditor({ sizes, products }: { sizes: string[]; products: Upper[] }) {
  // Local editable state: key `${sku}::${width}::${size}` -> value
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const p of products) {
      for (const s of sizes) {
        m[`${p.sku}::M::${s}`] = p.m[s] ?? "";
        m[`${p.sku}::EW::${s}`] = p.ew[s] ?? "";
      }
    }
    return m;
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = products.filter(
    (p) => !search || p.sku.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())
  );

  async function save(sku: string, width: string, size: string) {
    const key = `${sku}::${width}::${size}`;
    setSaving(key);
    await fetch("/api/admin/uppers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sku, width, size, val: vals[key] ?? "" }),
    });
    setSaving(null);
    setEditing(null);
  }

  function cellClass(v: string) {
    if (!v) return "text-gray-200";
    if (v.includes("+")) return "text-amber-600 font-semibold";
    return "text-navy font-semibold";
  }

  function renderRow(p: Upper, width: "M" | "EW") {
    return sizes.map((s) => {
      const key = `${p.sku}::${width}::${s}`;
      const v = vals[key] ?? "";
      const isEditing = editing === key;
      return (
        <td key={s} className="px-1 py-1 text-center">
          {isEditing ? (
            <input
              type="text"
              value={v}
              autoFocus
              onChange={(e) => setVals((q) => ({ ...q, [key]: e.target.value }))}
              onBlur={() => save(p.sku, width, s)}
              onKeyDown={(e) => {
                if (e.key === "Enter") save(p.sku, width, s);
                if (e.key === "Escape") setEditing(null);
              }}
              className="w-14 text-center border-2 border-navy rounded px-1 py-0.5 text-xs font-bold focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={() => setEditing(key)}
              className={`w-14 py-1 rounded text-xs hover:bg-navy/5 hover:ring-1 hover:ring-navy/30 transition ${saving === key ? "opacity-40" : cellClass(v)}`}
            >
              {saving === key ? "…" : v || "·"}
            </button>
          )}
        </td>
      );
    });
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search by SKU or name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full max-w-sm border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-navy transition"
      />

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="text-xs whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 font-bold text-gray-500 sticky left-0 bg-gray-50 z-10">SKU / Name</th>
              <th className="px-2 py-2 font-bold text-gray-500">W</th>
              {sizes.map((s) => (
                <th key={s} className="px-1 py-2 font-bold text-gray-500 text-center w-14">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => [
              <tr key={`${p.sku}-m`} className={i % 2 ? "bg-gray-50/40" : ""}>
                <td className="px-3 py-1.5 sticky left-0 bg-inherit z-10 border-r border-gray-100" rowSpan={2}>
                  <p className="font-mono font-bold text-navy">{p.sku}</p>
                  <p className="text-gray-400">{p.name}</p>
                </td>
                <td className="px-2 py-1.5 text-center font-bold text-gray-400">M</td>
                {renderRow(p, "M")}
              </tr>,
              <tr key={`${p.sku}-ew`} className={`${i % 2 ? "bg-gray-50/40" : ""} border-b border-gray-100`}>
                <td className="px-2 py-1.5 text-center font-bold text-gray-400">EW</td>
                {renderRow(p, "EW")}
              </tr>,
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}
