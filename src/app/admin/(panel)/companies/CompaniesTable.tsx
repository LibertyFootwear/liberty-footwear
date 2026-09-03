"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";

export interface Company {
  key: string;
  name: string;
  contactCount: number;
  revenue: number;
  newsletter: number;
  contacts: { id: string; name: string; email: string | null; phone: string | null; lastPurchaseAt: string | null }[];
}

const money = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export default function CompaniesTable({ companies }: { companies: Company[] }) {
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(query) ||
      c.contacts.some((p) => (p.name ?? "").toLowerCase().includes(query))
    );
  }, [companies, q]);

  const totalRevenue = companies.reduce((s, c) => s + c.revenue, 0);

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

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search company or person…"
        className="w-full mb-4 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
      />

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
              return (
                <Fragment key={c.key}>
                  <tr className={`hover:bg-gray-50 cursor-pointer ${open ? "bg-navy/5" : ""}`} onClick={() => setOpenKey(open ? null : c.key)}>
                    <td className={td}><span className="font-semibold text-navy">{c.name}</span></td>
                    <td className={td}>{c.contactCount}</td>
                    <td className={td}>{c.newsletter > 0 ? <span className="text-green-700 font-semibold">{c.newsletter}</span> : <span className="text-gray-300">0</span>}</td>
                    <td className={`${td} tabular-nums font-semibold`}>{c.revenue > 0 ? money(c.revenue) : "—"}</td>
                    <td className={`${td} text-right text-gray-400`}>{open ? "▲" : "▼"}</td>
                  </tr>
                  {open && (
                    <tr>
                      <td colSpan={5} className="px-3 py-3 bg-navy/5">
                        {c.contacts.length === 0
                          ? <p className="text-xs text-gray-400 px-1">No linked contacts (revenue only).</p>
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
