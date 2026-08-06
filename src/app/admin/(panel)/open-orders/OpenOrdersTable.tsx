"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface OpenOrderRow {
  id: string;
  ordered_date: string | null;
  promised: string | null;
  complete_date: string | null;
  picked_up_date: string | null;
  price_quote: number | null;
  paid: boolean;
  stock_no: string | null;
  size: string | null;
  width: string | null;
  first_name: string | null;
  last_name: string | null;
  contact: string | null;
  details: string | null;
  contact_notes: string | null;
}

type Form = {
  orderedDate: string; promised: string; completeDate: string; pickedUpDate: string;
  priceQuote: string; paid: boolean; stockNo: string; size: string; width: string;
  firstName: string; lastName: string; contact: string; details: string; contactNotes: string;
};

const EMPTY: Form = {
  orderedDate: "", promised: "", completeDate: "", pickedUpDate: "",
  priceQuote: "", paid: false, stockNo: "", size: "", width: "",
  firstName: "", lastName: "", contact: "", details: "", contactNotes: "",
};

function rowToForm(r: OpenOrderRow): Form {
  return {
    orderedDate: r.ordered_date ?? "", promised: r.promised ?? "",
    completeDate: r.complete_date ?? "", pickedUpDate: r.picked_up_date ?? "",
    priceQuote: r.price_quote != null ? String(r.price_quote) : "", paid: r.paid,
    stockNo: r.stock_no ?? "", size: r.size ?? "", width: r.width ?? "",
    firstName: r.first_name ?? "", lastName: r.last_name ?? "", contact: r.contact ?? "",
    details: r.details ?? "", contactNotes: r.contact_notes ?? "",
  };
}

function status(r: OpenOrderRow): "picked" | "made" | "open" {
  if (r.picked_up_date) return "picked";
  if (r.complete_date) return "made";
  return "open";
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  made: "bg-blue-100 text-blue-700",
  picked: "bg-green-100 text-green-700",
};
const STATUS_LABEL: Record<string, string> = { open: "Open", made: "Made", picked: "Picked up" };

function fmtDate(s: string | null): string {
  if (!s) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return s; // e.g. "online"
  return `${m[3]}/${m[2]}/${m[1].slice(2)}`;
}

/** A promised date in the past on an order that isn't made yet = overdue. */
function isOverdue(r: OpenOrderRow): boolean {
  if (r.complete_date || r.picked_up_date) return false;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(r.promised ?? "");
  if (!m) return false;
  return m[1] < new Date().toISOString().slice(0, 10);
}

export default function OpenOrdersTable({ rows }: { rows: OpenOrderRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"open" | "all">("open");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "open" && status(r) === "picked") return false;
      if (!query) return true;
      const hay = [r.first_name, r.last_name, r.stock_no, r.details, r.contact, r.contact_notes]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [rows, tab, q]);

  const openCount = rows.filter((r) => status(r) !== "picked").length;

  async function save(form: Form, id: string | null) {
    setBusy(true); setError("");
    const res = await fetch("/api/admin/open-orders", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: id ?? undefined }),
    });
    setBusy(false);
    if (res.ok) { setAdding(false); setEditId(null); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Something went wrong"); }
  }

  async function patch(id: string, partial: Partial<Form>, base: OpenOrderRow) {
    setBusy(true);
    await fetch("/api/admin/open-orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rowToForm(base), ...partial, id }),
    });
    setBusy(false); router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this order?")) return;
    setBusy(true);
    await fetch(`/api/admin/open-orders?id=${id}`, { method: "DELETE" });
    setBusy(false); router.refresh();
  }

  const th = "px-3 py-2 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap";
  const td = "px-3 py-2 text-sm text-gray-700 align-top";

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(["open", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${tab === t ? "bg-white shadow text-navy" : "text-gray-500"}`}
            >
              {t === "open" ? `Open (${openCount})` : `All (${rows.length})`}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, stock #, details…"
          className="flex-1 min-w-48 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
        />
        <button
          onClick={() => { setAdding((v) => !v); setEditId(null); }}
          className="px-4 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 transition whitespace-nowrap"
        >
          {adding ? "Cancel" : "+ New order"}
        </button>
      </div>

      {error && <p className="text-red text-sm mb-3">{error}</p>}

      {adding && (
        <div className="mb-6 bg-cream border border-cream-dark rounded-xl p-5">
          <OrderForm initial={EMPTY} busy={busy} onCancel={() => setAdding(false)} onSave={(f) => save(f, null)} />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Status</th>
              <th className={th}>Ordered</th>
              <th className={th}>Promised</th>
              <th className={th}>Customer</th>
              <th className={th}>Contact</th>
              <th className={th}>Stock / Details</th>
              <th className={th}>Size · Width</th>
              <th className={th}>Quote</th>
              <th className={th}>Paid</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 && (
              <tr><td className={td} colSpan={10}><span className="text-gray-400">No orders.</span></td></tr>
            )}
            {visible.map((r) => {
              const st = status(r);
              const editing = editId === r.id;
              return (
                <Fragment key={r.id}>
                  <tr className={editing ? "bg-navy/5" : "hover:bg-gray-50"}>
                    <td className={td}>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${STATUS_STYLE[st]}`}>
                        {STATUS_LABEL[st]}
                      </span>
                      {isOverdue(r) && <span className="block mt-1 text-[10px] font-bold text-red uppercase">Overdue</span>}
                    </td>
                    <td className={td}>{fmtDate(r.ordered_date)}</td>
                    <td className={`${td} ${isOverdue(r) ? "text-red font-semibold" : ""}`}>{fmtDate(r.promised)}</td>
                    <td className={td}><span className="font-semibold text-navy">{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</span></td>
                    <td className={td}>{r.contact || "—"}</td>
                    <td className={`${td} max-w-xs`}>
                      {r.stock_no && <span className="font-mono text-xs font-bold text-gray-900">{r.stock_no}</span>}
                      {r.details && <span className="block text-xs text-gray-500 mt-0.5">{r.details}</span>}
                    </td>
                    <td className={td}>{[r.size, r.width].filter(Boolean).join(" · ") || "—"}</td>
                    <td className={td}>{r.price_quote != null ? `$${r.price_quote}` : "—"}</td>
                    <td className={td}>
                      <button
                        onClick={() => patch(r.id, { paid: !r.paid }, r)}
                        disabled={busy}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${r.paid ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {r.paid ? "Paid" : "Unpaid"}
                      </button>
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      <div className="flex gap-1.5">
                        {st === "open" && (
                          <button onClick={() => patch(r.id, { completeDate: new Date().toISOString().slice(0, 10) }, r)} disabled={busy}
                            className="text-[11px] font-bold text-blue-600 hover:underline">Made</button>
                        )}
                        {st !== "picked" && (
                          <button onClick={() => patch(r.id, { pickedUpDate: new Date().toISOString().slice(0, 10) }, r)} disabled={busy}
                            className="text-[11px] font-bold text-green-600 hover:underline">Picked up</button>
                        )}
                        <button onClick={() => { setEditId(editing ? null : r.id); setAdding(false); }}
                          className="text-[11px] font-bold text-gray-500 hover:underline">{editing ? "Close" : "Edit"}</button>
                        <button onClick={() => remove(r.id)} disabled={busy}
                          className="text-[11px] font-bold text-red hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                  {editing && (
                    <tr>
                      <td colSpan={10} className="px-3 py-4 bg-navy/5">
                        <OrderForm initial={rowToForm(r)} busy={busy} onCancel={() => setEditId(null)} onSave={(f) => save(f, r.id)} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrderForm({ initial, busy, onCancel, onSave }: {
  initial: Form; busy: boolean; onCancel: () => void; onSave: (f: Form) => void;
}) {
  const [f, setF] = useState<Form>(initial);
  const set = (k: keyof Form, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const inp = "w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy";
  const lbl = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className={lbl}>First name</label><input className={inp} value={f.firstName} onChange={(e) => set("firstName", e.target.value)} /></div>
        <div><label className={lbl}>Last name</label><input className={inp} value={f.lastName} onChange={(e) => set("lastName", e.target.value)} /></div>
        <div><label className={lbl}>Contact (phone)</label><input className={inp} value={f.contact} onChange={(e) => set("contact", e.target.value)} /></div>
        <div><label className={lbl}>Price quote</label><input className={inp} inputMode="decimal" value={f.priceQuote} onChange={(e) => set("priceQuote", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className={lbl}>Stock #</label><input className={inp} value={f.stockNo} onChange={(e) => set("stockNo", e.target.value)} placeholder="e.g. KS0252C+" /></div>
        <div><label className={lbl}>Size L/R</label><input className={inp} value={f.size} onChange={(e) => set("size", e.target.value)} placeholder="9.5 or 13.5/14" /></div>
        <div><label className={lbl}>Width L/R</label><input className={inp} value={f.width} onChange={(e) => set("width", e.target.value)} placeholder="EW, EEEE+…" /></div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy cursor-pointer pb-2">
            <input type="checkbox" className="w-4 h-4 accent-navy" checked={f.paid} onChange={(e) => set("paid", e.target.checked)} /> Paid
          </label>
        </div>
      </div>
      <div>
        <label className={lbl}>Details</label>
        <textarea className={`${inp} min-h-16`} value={f.details} onChange={(e) => set("details", e.target.value)} placeholder="Custom build notes — leather, outsole, footbeds…" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className={lbl}>Ordered</label><input type="date" className={inp} value={f.orderedDate} onChange={(e) => set("orderedDate", e.target.value)} /></div>
        <div><label className={lbl}>Promised</label><input className={inp} value={f.promised} onChange={(e) => set("promised", e.target.value)} placeholder="YYYY-MM-DD or 'online'" /></div>
        <div><label className={lbl}>Made</label><input type="date" className={inp} value={f.completeDate} onChange={(e) => set("completeDate", e.target.value)} /></div>
        <div><label className={lbl}>Picked up</label><input type="date" className={inp} value={f.pickedUpDate} onChange={(e) => set("pickedUpDate", e.target.value)} /></div>
      </div>
      <div>
        <label className={lbl}>Contact notes</label>
        <input className={inp} value={f.contactNotes} onChange={(e) => set("contactNotes", e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(f)} disabled={busy} className="px-5 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 disabled:opacity-50 transition">
          {busy ? "Saving…" : "Save order"}
        </button>
        <button onClick={onCancel} className="px-5 py-2 border border-gray-200 text-gray-500 text-sm font-bold rounded-lg hover:text-navy transition">Cancel</button>
      </div>
    </div>
  );
}
