"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface CodeRow {
  id: string;
  code: string;
  percent_off: number | null;
  amount_off: number | null;
  active: boolean;
  user_id: string | null;
  max_uses: number | null;
  used_count: number;
  note: string | null;
  created_at: string;
}
export interface AccountOption { id: string; name: string | null; email: string | null; }

function valueLabel(c: CodeRow): string {
  if (c.percent_off != null) return `${c.percent_off}% off`;
  if (c.amount_off != null) return `$${c.amount_off} off`;
  return "—";
}

export default function DiscountsTable({ codes, accounts }: { codes: CodeRow[]; accounts: AccountOption[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);

  const accountById = useMemo(() => {
    const m = new Map<string, AccountOption>();
    accounts.forEach((a) => m.set(a.id, a));
    return m;
  }, [accounts]);

  // New-code form
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"percent" | "amount">("percent");
  const [value, setValue] = useState("");
  const [userId, setUserId] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [note, setNote] = useState("");

  async function create() {
    setError("");
    if (!code.trim()) { setError("Enter a code."); return; }
    if (!value.trim()) { setError("Enter the discount value."); return; }
    setBusy("new");
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        percentOff: kind === "percent" ? value : "",
        amountOff: kind === "amount" ? value : "",
        userId: userId || undefined,
        maxUses: maxUses || undefined,
        note: note || undefined,
      }),
    });
    setBusy(null);
    if (res.ok) {
      setCode(""); setValue(""); setUserId(""); setMaxUses(""); setNote(""); setAdding(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Couldn't create the code.");
    }
  }

  async function toggle(c: CodeRow) {
    setBusy(c.id);
    await fetch("/api/admin/discounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, active: !c.active }),
    });
    setBusy(null); router.refresh();
  }

  async function remove(c: CodeRow) {
    if (!confirm(`Delete code ${c.code}? This can't be undone.`)) return;
    setBusy(c.id);
    await fetch(`/api/admin/discounts?id=${c.id}`, { method: "DELETE" });
    setBusy(null); router.refresh();
  }

  const th = "px-3 py-2 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap";
  const td = "px-3 py-2 text-sm text-gray-700 align-middle";
  const inp = "w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy";
  const lbl = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{codes.length} code{codes.length !== 1 ? "s" : ""}</p>
        <button
          onClick={() => { setAdding((v) => !v); setError(""); }}
          className="px-4 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 transition"
        >
          {adding ? "Cancel" : "+ New code"}
        </button>
      </div>

      {error && !adding && <p className="text-red text-sm mb-3">{error}</p>}

      {adding && (
        <div className="mb-6 bg-cream border border-cream-dark rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className={lbl}>Code</label>
              <input className={`${inp} font-mono uppercase`} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="LIBERTY25" />
            </div>
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} value={kind} onChange={(e) => setKind(e.target.value as "percent" | "amount")}>
                <option value="percent">% off</option>
                <option value="amount">$ off</option>
              </select>
            </div>
            <div>
              <label className={lbl}>{kind === "percent" ? "Percent (1–100)" : "Dollars off"}</label>
              <input className={inp} inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} placeholder={kind === "percent" ? "25" : "10"} />
            </div>
            <div>
              <label className={lbl}>Max uses (optional)</label>
              <input className={inp} inputMode="numeric" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="unlimited" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Assign to customer account (optional)</label>
              <select className={inp} value={userId} onChange={(e) => setUserId(e.target.value)}>
                <option value="">Anyone can use it</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name || "—"}{a.email ? ` · ${a.email}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Note (optional)</label>
              <input className={inp} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. loyalty reward" />
            </div>
          </div>
          {error && <p className="text-red text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={create} disabled={busy === "new"} className="px-5 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 disabled:opacity-50 transition">
              {busy === "new" ? "Saving…" : "Create code"}
            </button>
            <button onClick={() => setAdding(false)} className="px-5 py-2 border border-gray-200 text-gray-500 text-sm font-bold rounded-lg hover:text-navy transition">Cancel</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Code</th>
              <th className={th}>Value</th>
              <th className={th}>Assigned to</th>
              <th className={th}>Used</th>
              <th className={th}>Status</th>
              <th className={th}>Note</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {codes.length === 0 && (
              <tr><td className={td} colSpan={7}><span className="text-gray-400">No codes yet.</span></td></tr>
            )}
            {codes.map((c) => {
              const acct = c.user_id ? accountById.get(c.user_id) : null;
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className={td}><span className="font-mono font-bold text-navy">{c.code}</span></td>
                  <td className={td}>{valueLabel(c)}</td>
                  <td className={td}>
                    {c.user_id
                      ? (acct ? <span>{acct.name || "—"}{acct.email ? <span className="text-gray-400"> · {acct.email}</span> : null}</span> : <span className="text-gray-400">account #{c.user_id.slice(0, 8)}</span>)
                      : <span className="text-gray-400">Anyone</span>}
                  </td>
                  <td className={td}>
                    <span className="font-semibold tabular-nums">{c.used_count}</span>
                    {c.max_uses != null && <span className="text-gray-400"> / {c.max_uses}</span>}
                  </td>
                  <td className={td}>
                    <button
                      onClick={() => toggle(c)}
                      disabled={busy === c.id}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {c.active ? "Active" : "Off"}
                    </button>
                  </td>
                  <td className={`${td} max-w-xs`}><span className="text-xs text-gray-500">{c.note || "—"}</span></td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    <button onClick={() => remove(c)} disabled={busy === c.id} className="text-[11px] font-bold text-red hover:underline">Delete</button>
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
