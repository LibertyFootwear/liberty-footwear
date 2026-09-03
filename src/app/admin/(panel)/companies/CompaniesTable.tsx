"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface Company {
  key: string;
  name: string;
  contactCount: number;
  revenue: number;
  newsletter: number;
  contacts: { id: string; name: string; email: string | null; phone: string | null; lastPurchaseAt: string | null }[];
  // Editable record (companies table) — null/false when only aggregated.
  id: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  stored: boolean;
}

type Form = { name: string; contactPerson: string; phone: string; email: string; address: string; notes: string };
const EMPTY: Form = { name: "", contactPerson: "", phone: "", email: "", address: "", notes: "" };

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function CompaniesTable({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(query) ||
      c.contacts.some((p) => (p.name ?? "").toLowerCase().includes(query))
    );
  }, [companies, q]);

  const totalRevenue = companies.reduce((s, c) => s + c.revenue, 0);

  async function save(form: Form) {
    setError("");
    if (!form.name.trim()) { setError("Company name is required."); return; }
    setBusy(true);
    const res = await fetch("/api/admin/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) { setAdding(false); setEditKey(null); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Couldn't save."); }
  }

  async function remove(c: Company) {
    if (!c.id) return;
    if (!confirm(`Delete the saved details for "${c.name}"? (Its sales history stays.)`)) return;
    setBusy(true);
    await fetch(`/api/admin/companies?id=${c.id}`, { method: "DELETE" });
    setBusy(false); setEditKey(null); router.refresh();
  }

  const th = "px-3 py-2 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap";
  const td = "px-3 py-2 text-sm text-gray-700 align-middle";

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Companies</p>
          <p className="text-2xl font-black text-navy tabular-nums">{companies.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Contacts</p>
          <p className="text-2xl font-black text-navy tabular-nums">{companies.reduce((s, c) => s + c.contactCount, 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Revenue (in-store)</p>
          <p className="text-2xl font-black text-navy tabular-nums">{money(totalRevenue)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search company or person…"
          className="flex-1 min-w-48 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
        />
        <button
          onClick={() => { setAdding((v) => !v); setEditKey(null); setError(""); }}
          className="px-4 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 transition whitespace-nowrap"
        >
          {adding ? "Cancel" : "+ New company"}
        </button>
      </div>

      {adding && (
        <div className="mb-6 bg-cream border border-cream-dark rounded-xl p-5">
          <CompanyForm initial={EMPTY} busy={busy} error={error} nameEditable onCancel={() => setAdding(false)} onSave={save} />
        </div>
      )}

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Company</th>
              <th className={th}>Contacts</th>
              <th className={th}>Newsletter</th>
              <th className={th}>In-store revenue</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 && (
              <tr><td className={td} colSpan={5}><span className="text-gray-400">No companies.</span></td></tr>
            )}
            {visible.map((c) => {
              const open = openKey === c.key;
              const editing = editKey === c.key;
              return (
                <Fragment key={c.key}>
                  <tr className={`hover:bg-gray-50 cursor-pointer ${open ? "bg-navy/5" : ""}`} onClick={() => { setOpenKey(open ? null : c.key); setEditKey(null); }}>
                    <td className={td}>
                      <span className="font-semibold text-navy">{c.name}</span>
                      {c.stored && <span className="ml-2 text-[10px] font-bold text-green-700 uppercase">saved</span>}
                    </td>
                    <td className={td}>{c.contactCount}</td>
                    <td className={td}>{c.newsletter > 0 ? <span className="text-green-700 font-semibold">{c.newsletter}</span> : <span className="text-gray-300">0</span>}</td>
                    <td className={`${td} tabular-nums font-semibold`}>{c.revenue > 0 ? money(c.revenue) : "—"}</td>
                    <td className={`${td} text-right text-gray-400`}>{open ? "▲" : "▼"}</td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={5} className="px-3 py-3 bg-navy/5">
                        {editing ? (
                          <CompanyForm
                            initial={{
                              name: c.name, contactPerson: c.contactPerson ?? "", phone: c.phone ?? "",
                              email: c.email ?? "", address: c.address ?? "", notes: c.notes ?? "",
                            }}
                            busy={busy} error={error} nameEditable={false}
                            onCancel={() => setEditKey(null)} onSave={save}
                          />
                        ) : (
                          <>
                            {/* Company details */}
                            {(c.contactPerson || c.phone || c.email || c.address || c.notes) ? (
                              <div className="bg-white border border-gray-100 rounded-lg p-3 mb-3 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                                {c.contactPerson && <p><span className="text-gray-400">Contact:</span> {c.contactPerson}</p>}
                                {c.phone && <p><span className="text-gray-400">Phone:</span> {c.phone}</p>}
                                {c.email && <p><span className="text-gray-400">Email:</span> {c.email}</p>}
                                {c.address && <p><span className="text-gray-400">Address:</span> {c.address}</p>}
                                {c.notes && <p className="sm:col-span-2 whitespace-pre-wrap"><span className="text-gray-400">Notes:</span> {c.notes}</p>}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mb-3">No saved details yet.</p>
                            )}

                            <div className="flex gap-2 mb-3">
                              <button onClick={() => { setEditKey(c.key); setError(""); }} className="px-3 py-1.5 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/80 transition">
                                {c.stored ? "Edit details" : "Add details"}
                              </button>
                              {c.stored && c.id && (
                                <button onClick={() => remove(c)} disabled={busy} className="px-3 py-1.5 text-red text-xs font-bold rounded-lg hover:underline">Delete details</button>
                              )}
                            </div>

                            {/* People at this company */}
                            {c.contacts.length === 0
                              ? <p className="text-xs text-gray-400 px-1">No linked contacts{c.revenue > 0 ? " (revenue only)" : ""}.</p>
                              : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                  {c.contacts.map((p) => (
                                    <Link key={p.id} href={`/admin/customers/view/${p.id}`}
                                      className="block bg-white border border-gray-100 rounded-lg px-3 py-2 hover:border-navy transition">
                                      <p className="text-sm font-semibold text-navy truncate">{p.name}</p>
                                      <p className="text-xs text-gray-400 truncate">{p.email || p.phone || "—"}</p>
                                    </Link>
                                  ))}
                                </div>
                              )}
                          </>
                        )}
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

function CompanyForm({ initial, busy, error, nameEditable, onCancel, onSave }: {
  initial: Form; busy: boolean; error: string; nameEditable: boolean; onCancel: () => void; onSave: (f: Form) => void;
}) {
  const [f, setF] = useState<Form>(initial);
  const set = (k: keyof Form, v: string) => setF((p) => ({ ...p, [k]: v }));
  const inp = "w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy";
  const lbl = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Company name</label>
          <input className={`${inp} ${!nameEditable ? "bg-gray-100 text-gray-500" : ""}`} value={f.name} readOnly={!nameEditable}
            onChange={(e) => set("name", e.target.value)} placeholder="e.g. Gill Industries" />
        </div>
        <div><label className={lbl}>Contact person</label><input className={inp} value={f.contactPerson} onChange={(e) => set("contactPerson", e.target.value)} /></div>
        <div><label className={lbl}>Phone</label><input className={inp} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></div>
        <div><label className={lbl}>Email</label><input className={inp} value={f.email} onChange={(e) => set("email", e.target.value)} /></div>
        <div className="lg:col-span-2"><label className={lbl}>Address</label><input className={inp} value={f.address} onChange={(e) => set("address", e.target.value)} /></div>
      </div>
      <div>
        <label className={lbl}>Notes</label>
        <textarea className={`${inp} min-h-16`} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Account terms, who to call, bulk pricing…" />
      </div>
      {error && <p className="text-red text-sm">{error}</p>}
      <div className="flex gap-2">
        <button onClick={() => onSave(f)} disabled={busy} className="px-5 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 disabled:opacity-50 transition">
          {busy ? "Saving…" : "Save company"}
        </button>
        <button onClick={onCancel} className="px-5 py-2 border border-gray-200 text-gray-500 text-sm font-bold rounded-lg hover:text-navy transition">Cancel</button>
      </div>
    </div>
  );
}
