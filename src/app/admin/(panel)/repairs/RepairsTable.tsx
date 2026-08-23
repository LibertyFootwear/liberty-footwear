"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usDate } from "@/lib/formatDate";
import { parseDue, todayKey } from "@/lib/queue";
import RepairsImport from "./RepairsImport";

export interface RepairRow {
  id: string;
  ordered_date: string | null;
  promised: string | null;
  complete_date: string | null;
  picked_up_date: string | null;
  price_quote: number | null;
  paid: boolean;
  job: string | null;
  tag_no: string | null;
  first_name: string | null;
  last_name: string | null;
  contact: string | null;
  details: string | null;
  contact_notes: string | null;
}

type Form = {
  orderedDate: string; promised: string; completeDate: string; pickedUpDate: string;
  priceQuote: string; paid: boolean; job: string; tagNo: string;
  firstName: string; lastName: string; contact: string; details: string; contactNotes: string;
};

const EMPTY: Form = {
  orderedDate: "", promised: "", completeDate: "", pickedUpDate: "",
  priceQuote: "", paid: false, job: "Repair", tagNo: "",
  firstName: "", lastName: "", contact: "", details: "", contactNotes: "",
};

const JOB_TYPES = ["Repair", "Resole", "Stretched Shoes", "Other"];

function rowToForm(r: RepairRow): Form {
  return {
    orderedDate: r.ordered_date ?? "", promised: r.promised ?? "",
    completeDate: r.complete_date ?? "", pickedUpDate: r.picked_up_date ?? "",
    priceQuote: r.price_quote != null ? String(r.price_quote) : "", paid: r.paid,
    job: r.job ?? "", tagNo: r.tag_no ?? "",
    firstName: r.first_name ?? "", lastName: r.last_name ?? "", contact: r.contact ?? "",
    details: r.details ?? "", contactNotes: r.contact_notes ?? "",
  };
}

function status(r: RepairRow): "picked" | "done" | "open" {
  if (r.picked_up_date) return "picked";
  if (r.complete_date) return "done";
  return "open";
}

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  done: "bg-blue-100 text-blue-700",
  picked: "bg-green-100 text-green-700",
};
const STATUS_LABEL: Record<string, string> = { open: "In shop", done: "Done", picked: "Picked up" };

const fmtDate = usDate;

/** A promised date in the past on a repair that isn't done yet = overdue. */
function isOverdue(r: RepairRow): boolean {
  if (r.complete_date || r.picked_up_date) return false;
  const { date } = parseDue(r.promised);
  if (!date) return false;
  return date < todayKey();
}

export default function RepairsTable({ rows }: { rows: RepairRow[] }) {
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
      const hay = [r.first_name, r.last_name, r.tag_no, r.job, r.details, r.contact, r.contact_notes]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(query);
    });
  }, [rows, tab, q]);

  const openCount = rows.filter((r) => status(r) !== "picked").length;

  async function save(form: Form, id: string | null) {
    setBusy(true); setError("");
    const res = await fetch("/api/admin/repairs", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, id: id ?? undefined }),
    });
    setBusy(false);
    if (res.ok) { setAdding(false); setEditId(null); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Something went wrong"); }
  }

  async function patch(id: string, partial: Partial<Form>, base: RepairRow) {
    setBusy(true);
    await fetch("/api/admin/repairs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...rowToForm(base), ...partial, id }),
    });
    setBusy(false); router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this repair?")) return;
    setBusy(true);
    await fetch(`/api/admin/repairs?id=${id}`, { method: "DELETE" });
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
              {t === "open" ? `In shop (${openCount})` : `All (${rows.length})`}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, tag #, job, details…"
          className="flex-1 min-w-48 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
        />
        <RepairsImport />
        <button
          onClick={() => { setAdding((v) => !v); setEditId(null); }}
          className="px-4 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 transition whitespace-nowrap"
        >
          {adding ? "Cancel" : "+ New repair"}
        </button>
      </div>

      {error && <p className="text-red text-sm mb-3">{error}</p>}

      {adding && (
        <div className="mb-6 bg-cream border border-cream-dark rounded-xl p-5">
          <RepairForm initial={EMPTY} busy={busy} onCancel={() => setAdding(false)} onSave={(f) => save(f, null)} />
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
              <th className={th}>Job</th>
              <th className={th}>Customer</th>
              <th className={th}>Contact</th>
              <th className={th}>Tag / Details</th>
              <th className={th}>Quote</th>
              <th className={th}>Paid</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 && (
              <tr><td className={td} colSpan={10}><span className="text-gray-400">No repairs.</span></td></tr>
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
                    <td className={td}>{r.job || "—"}</td>
                    <td className={td}><span className="font-semibold text-navy">{[r.first_name, r.last_name].filter(Boolean).join(" ") || "—"}</span></td>
                    <td className={td}>{r.contact || "—"}</td>
                    <td className={`${td} max-w-xs`}>
                      {r.tag_no && <span className="font-mono text-xs font-bold text-gray-900">#{r.tag_no}</span>}
                      {r.details && <span className="block text-xs text-gray-500 mt-0.5">{r.details}</span>}
                    </td>
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
                            className="text-[11px] font-bold text-blue-600 hover:underline">Done</button>
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
                        <RepairForm initial={rowToForm(r)} busy={busy} onCancel={() => setEditId(null)} onSave={(f) => save(f, r.id)} />
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

function RepairForm({ initial, busy, onCancel, onSave }: {
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
        <div>
          <label className={lbl}>Job type</label>
          <select className={inp} value={JOB_TYPES.includes(f.job) ? f.job : "Other"} onChange={(e) => set("job", e.target.value)}>
            {JOB_TYPES.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </div>
        <div><label className={lbl}>Tag #</label><input className={inp} value={f.tagNo} onChange={(e) => set("tagNo", e.target.value)} placeholder="e.g. 61042" /></div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm font-semibold text-navy cursor-pointer pb-2">
            <input type="checkbox" className="w-4 h-4 accent-navy" checked={f.paid} onChange={(e) => set("paid", e.target.checked)} /> Paid
          </label>
        </div>
      </div>
      <div>
        <label className={lbl}>Details</label>
        <textarea className={`${inp} min-h-16`} value={f.details} onChange={(e) => set("details", e.target.value)} placeholder="What's the shoe & the job — size, soles, footbeds, notes…" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><label className={lbl}>Ordered</label><input type="date" className={inp} value={f.orderedDate} onChange={(e) => set("orderedDate", e.target.value)} /></div>
        <div><label className={lbl}>Promised</label><input className={inp} value={f.promised} onChange={(e) => set("promised", e.target.value)} placeholder="YYYY-MM-DD or note" /></div>
        <div><label className={lbl}>Done</label><input type="date" className={inp} value={f.completeDate} onChange={(e) => set("completeDate", e.target.value)} /></div>
        <div><label className={lbl}>Picked up</label><input type="date" className={inp} value={f.pickedUpDate} onChange={(e) => set("pickedUpDate", e.target.value)} /></div>
      </div>
      <div>
        <label className={lbl}>Contact notes</label>
        <input className={inp} value={f.contactNotes} onChange={(e) => set("contactNotes", e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave(f)} disabled={busy} className="px-5 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 disabled:opacity-50 transition">
          {busy ? "Saving…" : "Save repair"}
        </button>
        <button onClick={onCancel} className="px-5 py-2 border border-gray-200 text-gray-500 text-sm font-bold rounded-lg hover:text-navy transition">Cancel</button>
      </div>
    </div>
  );
}
