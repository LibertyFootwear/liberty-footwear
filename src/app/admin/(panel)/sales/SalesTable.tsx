"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface SaleRow {
  id: string;
  sale_date: string;
  stock_no: string;
  size: string | null;
  width: string | null;
  paid: boolean;
  total: number | null;
  payment: string | null;
  customer_name: string | null;
  phone: string | null;
  notes: string | null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PAYMENTS = ["Card", "Debit card", "Cash", "Check", "Wear trial", "Free", "Other"];

const WIDTHS = ["M", "EW", "EEE", "EEEE", "EEEEE", "3E", "4E", "5E", "M/EW", "EW/M"];

// 5–11.5 in half sizes, then whole sizes 12–17
const SIZES = [
  ...Array.from({ length: 14 }, (_, i) => String(5 + i * 0.5)),
  "12", "13", "14", "15", "16", "17",
];

// Non-boot line items sold at the counter
const SERVICES = [
  "Repair",
  "Resole",
  "Arch pads",
  "Green footbeds",
  "Blue footbeds",
  "Mink oil",
  "KG's bootguard Blk",
  "Adhesive heel wedge",
];

function parts(dateStr: string) {
  if (!dateStr) return { year: "", month: "", day: "" };
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return { year: "", month: "", day: "" };
  return { year: String(d.getFullYear()), month: MONTHS[d.getMonth()], day: DAYS[d.getDay()] };
}

const emptyRow = {
  saleDate: new Date().toISOString().slice(0, 10),
  stockNo: "", size: "", width: "", paid: true,
  total: "", payment: "Card", customerName: "", phone: "", notes: "",
};

export default function SalesTable({ rows, stockOptions }: { rows: SaleRow[]; stockOptions: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...emptyRow });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const isService = SERVICES.includes(form.stockNo);

  async function add() {
    setError("");
    if (!form.saleDate || !form.stockNo.trim()) { setError("Date and Stock # are required."); return; }
    setSaving(true);
    const res = await fetch("/api/admin/sales", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, total: form.total === "" ? null : parseFloat(form.total) }),
    });
    setSaving(false);
    if (res.ok) {
      // keep date & payment so consecutive entries are fast
      setForm({ ...emptyRow, saleDate: form.saleDate, payment: form.payment });
      router.refresh();
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save.");
    }
  }

  async function remove(id: string) {
    setBusy(id);
    await fetch(`/api/admin/sales?id=${id}`, { method: "DELETE" });
    setBusy(null);
    router.refresh();
  }

  const filtered = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.stock_no ?? "").toLowerCase().includes(q)
      || (r.customer_name ?? "").toLowerCase().includes(q)
      || (r.phone ?? "").toLowerCase().includes(q)
      || (r.notes ?? "").toLowerCase().includes(q);
  });

  const totalSum = filtered.reduce((s, r) => s + (r.total ?? 0), 0);
  const cls = "w-full border-2 border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-navy";

  return (
    <div>
      {/* Entry row */}
      <div className="bg-white rounded-xl border-2 border-navy/20 shadow-sm p-4 mb-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">New sale</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
            <input type="date" value={form.saleDate} onChange={(e) => set("saleDate", e.target.value)} className={cls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Stock # / Item</label>
            <select value={form.stockNo} onChange={(e) => set("stockNo", e.target.value)} className={cls}>
              <option value="">Select…</option>
              <optgroup label="Boots & Apparel">
                {stockOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="Services & Accessories">
                {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Size</label>
            <select value={form.size} onChange={(e) => set("size", e.target.value)} disabled={isService} className={`${cls} disabled:bg-gray-50`}>
              <option value="">—</option>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Width</label>
            <select value={form.width} onChange={(e) => set("width", e.target.value)} disabled={isService} className={`${cls} disabled:bg-gray-50`}>
              <option value="">—</option>
              {WIDTHS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Paid</label>
            <select value={form.paid ? "Yes" : "No"} onChange={(e) => set("paid", e.target.value === "Yes")} className={cls}>
              <option>Yes</option><option>No</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total $</label>
            <input type="number" step="0.01" min="0" value={form.total} onChange={(e) => set("total", e.target.value)} placeholder="167.48" className={cls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment</label>
            <select value={form.payment} onChange={(e) => set("payment", e.target.value)} className={cls}>
              {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer</label>
            <input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="Name" className={cls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="616-…" className={cls} />
          </div>
        </div>

        <div className="mt-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Notes</label>
          <input value={form.notes} onChange={(e) => set("notes", e.target.value)}
            placeholder="Anything worth remembering about this sale…" className={cls} />
        </div>

        <div className="flex items-center gap-3 mt-3">
          <button onClick={add} disabled={saving}
            className="px-6 py-2 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50">
            {saving ? "Adding…" : "+ Add Sale"}
          </button>
          {error && <p className="text-xs text-red font-semibold">{error}</p>}
          <p className="text-xs text-gray-400 ml-auto">Date &amp; payment stay filled in for the next entry.</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stock #, customer, phone, notes…"
          className="w-full max-w-sm border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-navy" />
        <p className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} sales · ${totalSum.toFixed(2)}</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Date", "Year", "Month", "Day", "Stock # / Item", "Size", "Width", "Paid", "Total $", "Payment", "Customer", "Phone", "Notes", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={14} className="px-3 py-10 text-center text-gray-400">No sales recorded yet.</td></tr>
            )}
            {filtered.map((r) => {
              const p = parts(r.sale_date);
              return (
                <tr key={r.id} className="hover:bg-gray-50 transition">
                  <td className="px-3 py-2 text-gray-600">{r.sale_date}</td>
                  <td className="px-3 py-2 text-gray-400">{p.year}</td>
                  <td className="px-3 py-2 text-gray-400">{p.month}</td>
                  <td className="px-3 py-2 text-gray-400">{p.day}</td>
                  <td className="px-3 py-2 font-mono font-bold text-navy">{r.stock_no}</td>
                  <td className="px-3 py-2 text-gray-600">{r.size || "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{r.width || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`font-bold px-1.5 py-0.5 rounded ${r.paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {r.paid ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-black text-gray-900">{r.total != null ? `$${r.total.toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{r.payment || "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{r.customer_name || "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{r.phone || "—"}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-[220px] truncate" title={r.notes ?? ""}>{r.notes || "—"}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => remove(r.id)} disabled={busy === r.id}
                      className="text-red hover:underline font-bold disabled:opacity-40">
                      {busy === r.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
