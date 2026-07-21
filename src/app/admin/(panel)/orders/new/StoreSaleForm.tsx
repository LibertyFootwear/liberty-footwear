"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface CatalogItem { stockNo: string; name: string; color: string; price: number; sizes: string[] }
interface Line { stockNo: string; size: string; qty: number; price: number }

export default function StoreSaleForm({ catalog }: { catalog: CatalogItem[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([{ stockNo: "", size: "", qty: 1, price: 0 }]);
  const [paymentMethod, setPaymentMethod] = useState("Card");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function byStock(sn: string) { return catalog.find((c) => c.stockNo === sn); }

  function setLine(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function pickProduct(i: number, stockNo: string) {
    const p = byStock(stockNo);
    setLine(i, { stockNo, price: p?.price ?? 0, size: "" });
  }

  const total = lines.reduce((s, l) => s + (l.price || 0) * (l.qty || 0), 0);

  async function submit() {
    setError("");
    const valid = lines.filter((l) => l.stockNo && l.size && l.qty > 0);
    if (valid.length === 0) { setError("Add at least one product with a size."); return; }
    setSaving(true);
    const res = await fetch("/api/admin/store-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: valid, paymentMethod, customerName, customerPhone }),
    });
    if (res.ok) {
      router.push("/admin/orders");
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/orders" className="text-sm text-gray-400 hover:text-navy transition">← Orders</Link>
        <h1 className="text-2xl font-black text-navy">Record In-Store Sale</h1>
      </div>

      {/* Line items */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Items</p>
        <div className="space-y-3">
          {lines.map((l, i) => {
            const p = byStock(l.stockNo);
            return (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[180px]">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Product</label>
                  <select value={l.stockNo} onChange={(e) => pickProduct(i, e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy">
                    <option value="">Select…</option>
                    {catalog.map((c) => (
                      <option key={c.stockNo} value={c.stockNo}>{c.stockNo} — {c.name} ({c.color})</option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Size</label>
                  <select value={l.size} onChange={(e) => setLine(i, { size: e.target.value })} disabled={!p}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy disabled:bg-gray-50">
                    <option value="">—</option>
                    {p?.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="w-16">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Qty</label>
                  <input type="number" min={1} value={l.qty} onChange={(e) => setLine(i, { qty: parseInt(e.target.value) || 1 })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy" />
                </div>
                <div className="w-24">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Price $</label>
                  <input type="number" min={0} step="0.01" value={l.price} onChange={(e) => setLine(i, { price: parseFloat(e.target.value) || 0 })}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy" />
                </div>
                {lines.length > 1 && (
                  <button type="button" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                    className="h-9 px-3 text-red text-sm font-bold hover:bg-red/5 rounded-lg">✕</button>
                )}
              </div>
            );
          })}
        </div>
        <button type="button" onClick={() => setLines((ls) => [...ls, { stockNo: "", size: "", qty: 1, price: 0 }])}
          className="mt-4 text-sm font-bold text-navy hover:text-red transition">+ Add another item</button>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Payment</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy">
            {["Card", "Cash", "Check", "Other"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Customer name (optional)</label>
          <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Phone (optional)</label>
          <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy" />
        </div>
      </div>

      {error && <p className="text-sm text-red font-semibold mb-4">{error}</p>}

      <div className="flex items-center justify-between">
        <p className="text-lg font-black text-navy">Total: ${total.toFixed(2)}</p>
        <button type="button" onClick={submit} disabled={saving}
          className="px-8 py-3 bg-navy text-white font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50">
          {saving ? "Saving…" : "Record Sale"}
        </button>
      </div>
    </div>
  );
}
