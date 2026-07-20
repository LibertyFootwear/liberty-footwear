"use client";

import { useState } from "react";
import Image from "next/image";
import { Product } from "@/data/products";

interface Row { product: Product; sizes: { size: string; qty: number }[] }

export default function InventoryEditor({ rows }: { rows: Row[] }) {
  const [editing, setEditing] = useState<{ stockNo: string; size: string } | null>(null);
  const [qtys, setQtys] = useState<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const r of rows) for (const s of r.sizes) m[`${r.product.stockNo}::${s.size}`] = s.qty;
    return m;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = rows.filter((r) =>
    !search || r.product.name.toLowerCase().includes(search.toLowerCase()) ||
    r.product.stockNo.toLowerCase().includes(search.toLowerCase()) ||
    r.product.colorLeather.toLowerCase().includes(search.toLowerCase())
  );

  async function save(stockNo: string, size: string, qty: number) {
    const key = `${stockNo}::${size}`;
    setSaving(key);
    await fetch("/api/admin/inventory", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stockNo, size, qty }),
    });
    setSaving(null);
    setEditing(null);
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Search by name, stock no, color…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 w-full max-w-sm border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-navy transition"
      />

      <div className="space-y-4">
        {filtered.map(({ product: p, sizes }) => {
          const lowStock = sizes.some((s) => qtys[`${p.stockNo}::${s.size}`] > 0 && qtys[`${p.stockNo}::${s.size}`] <= 2);
          const totalQty = sizes.reduce((sum, s) => sum + (qtys[`${p.stockNo}::${s.size}`] ?? 0), 0);
          return (
            <div key={p.stockNo} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-12 h-12 rounded-lg bg-cream flex-shrink-0 overflow-hidden">
                  {p.image && <Image src={p.image} alt={p.name} fill className="object-contain p-1 mix-blend-multiply" sizes="48px" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-navy">{p.name} <span className="font-normal text-gray-400">— {p.colorLeather}</span></p>
                  <p className="text-xs text-gray-400">{p.stockNo} · {p.outsoleType} · {p.colorOutsole}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Total stock</p>
                  <p className={`font-black text-lg ${totalQty === 0 ? "text-red" : lowStock ? "text-amber-500" : "text-green-600"}`}>{totalQty}</p>
                </div>
                {lowStock && <span className="text-xs bg-amber-100 text-amber-700 font-bold px-2 py-1 rounded-full">Low Stock</span>}
                {totalQty === 0 && <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-1 rounded-full">Out of Stock</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {sizes.map(({ size }) => {
                  const key = `${p.stockNo}::${size}`;
                  const qty = qtys[key] ?? 0;
                  const isEditing = editing?.stockNo === p.stockNo && editing?.size === size;
                  return (
                    <div key={size} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-400">{size}</span>
                      {isEditing ? (
                        <input
                          type="number"
                          min={0}
                          value={qty}
                          autoFocus
                          onChange={(e) => setQtys((q) => ({ ...q, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          onBlur={() => save(p.stockNo, size, qtys[key] ?? 0)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") save(p.stockNo, size, qtys[key] ?? 0);
                            if (e.key === "Escape") setEditing(null);
                          }}
                          className="w-14 text-center border-2 border-navy rounded-lg px-1 py-1.5 text-sm font-bold focus:outline-none"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing({ stockNo: p.stockNo, size })}
                          className={`w-14 py-1.5 rounded-lg text-sm font-bold border-2 transition hover:border-navy ${
                            saving === key ? "opacity-50" :
                            qty === 0 ? "bg-red-50 border-red-200 text-red-500" :
                            qty <= 2 ? "bg-amber-50 border-amber-200 text-amber-600" :
                            "bg-green-50 border-green-200 text-green-700"
                          }`}
                        >
                          {saving === key ? "…" : qty}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
