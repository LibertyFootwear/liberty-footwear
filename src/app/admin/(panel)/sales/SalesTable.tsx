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
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PAYMENTS = ["Card", "Cash", "Check", "Other"];

function parts(dateStr: string) {
  if (!dateStr) return { year: "", month: "", day: "" };
  const d = new Date(dateStr + "T12:00:00");
  if (isNaN(d.getTime())) return { year: "", month: "", day: "" };
  return { year: String(d.getFullYear()), month: MONTHS[d.getMonth()], day: DAYS[d.getDay()] };
}

const emptyRow = {
  saleDate: new Date().toISOString().slice(0, 10),
  stockNo: "", size: "", width: "M", paid: true,
  total: "", payment: "Card", customerName: "", phone: "",
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
      // keep the date & payment for fast consecutive entry
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
      || (r.phone ?? "").toLowerCase().includes(q);
  });

  const totalSum = filtered.reduce((s, r) => s + (r.total ?? 0), 0);
  const inputCls = "w-full border-2 border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-navy";

  return (
    <div>
      {/* Entry row */}
      <div className="bg-white rounded-xl border-2 border-navy/20 shadow-sm p-4 mb-6">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">New sale</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-2 items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label>
            <input type="date" value={form.saleDate} onChange={(e) => set("saleDate", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Stock #</label>
            <input list="stock-list" value={form.stockNo} onChange={(e) => set("stockNo", e.target.value)} placeholder="KS0122" className={inputCls} />
            <datalist id="stock-list">
              {stockOptions.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Size</label>
            <input value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="9.5" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Width</label>
            <input list="width-list" value={form.width} onChange={(e) => set("width", e.target.value)} placeholder="M" className={inputCls} />
            <datalist id="width-list">
              {["M", "EW", "EEE", "EEEE", "M/EW"].map((w) => <option key={w} value={w} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Paid</label>
            <select value={form.paid ? "Yes" : "No"} onChange={(e) => set("paid", e.target.value === "Yes")} className={inputCls}>
              <option>Yes</option><option>No</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total $</label>
            <input type="number" step="0.01" min="0" value={form.total} onChange={(e) => set("total", e.target.value)} placeholder="167.48" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Payment</label>
            <select value={form.payment} onChange={(e) => set("payment", e.target.value)} className={inputCls}>
              {PAYMENTS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Customer</label>
            <input value={form.customerName} onChange={(e) => set("customerName", e.target.value)} placeholder="Name" className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="616-…" className={inputCls} />
          </div>
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
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stock #, customer, phone…"
          className="w-full max-w-sm border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-navy" />
        <p className="text-sm text-gray-400 whitespace-nowrap">{filtered.length} sales · ${totalSum.toFixed(2)}</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {["Date", "Year", "Month", "Day", "Stock #", "Size", "Width", "Paid", "Total $", "Payment", "Customer", "Phone", ""].map((h) => (
                <th key={h} className="text-left px-3 py-2 font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <tr><td colSpan={13} className="px-3 py-10 text-center text-gray-400">No sales recorded yet.</td></tr>
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
                  <td className="px-3 py-2 text-gray-600">{r.size ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{r.width ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`font-bold px-1.5 py-0.5 rounded ${r.paid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {r.paid ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-black text-gray-900">{r.total != null ? `$${r.total.toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{r.payment ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-600">{r.customer_name ?? "—"}</td>
                  <td className="px-3 py-2 text-gray-500">{r.phone ?? "—"}</td>
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
