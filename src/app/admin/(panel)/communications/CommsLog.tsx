"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BTN, INPUT } from "../ui";

export interface CommRow {
  id: string;
  type: "sms" | "call" | "voicemail";
  direction: "incoming" | "outgoing" | null;
  status: string | null;
  customer_phone: string | null;
  our_number: string | null;
  content: string | null;
  duration: number | null;
  recording_url: string | null;
  customer_id: string | null;
  occurred_at: string | null;
  created_at: string;
}

function fmt(dt: string | null) {
  if (!dt) return "";
  return new Date(dt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
function dur(s: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60), r = s % 60;
  return m ? `${m}m ${r}s` : `${r}s`;
}

const KIND = (r: CommRow) => {
  if (r.type === "voicemail") return { icon: "🎙️", label: "Voicemail" };
  if (r.type === "call") return r.status === "missed" || r.status === "no-answer"
    ? { icon: "📵", label: "Missed call" }
    : { icon: r.direction === "outgoing" ? "📞→" : "📞", label: "Call" };
  return { icon: r.direction === "outgoing" ? "💬→" : "💬", label: "Text" };
};

export default function CommsLog({ rows, names, quoEnabled }: {
  rows: CommRow[]; names: Record<string, string>; quoEnabled: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "calls" | "sms" | "missed">("all");
  const [q, setQ] = useState("");
  const [composeTo, setComposeTo] = useState("");
  const [composeMsg, setComposeMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (tab === "calls" && r.type === "sms") return false;
      if (tab === "sms" && r.type !== "sms") return false;
      if (tab === "missed" && !(r.type === "call" && (r.status === "missed" || r.status === "no-answer"))) return false;
      if (!query) return true;
      const name = r.customer_id ? names[r.customer_id] ?? "" : "";
      return [name, r.customer_phone, r.content].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
  }, [rows, tab, q, names]);

  async function send() {
    setError(""); setNote("");
    if (!composeTo.trim() || !composeMsg.trim()) { setError("Enter a number and a message."); return; }
    setBusy(true);
    const res = await fetch("/api/admin/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: composeTo.trim(), content: composeMsg.trim() }),
    });
    setBusy(false);
    if (res.ok) { setNote("Sent."); setComposeMsg(""); router.refresh(); }
    else { const d = await res.json().catch(() => ({})); setError(d.error ?? "Send failed."); }
  }

  const th = "px-3 py-2 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap";
  const td = "px-3 py-2 text-sm text-gray-700 align-top";

  return (
    <div>
      {/* Compose */}
      {quoEnabled && (
        <div className="mb-6 bg-cream border border-cream-dark rounded-xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Send a text</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input className={`${INPUT} sm:max-w-48`} value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="+1 616 555 0100" />
            <input className={INPUT} value={composeMsg} onChange={(e) => setComposeMsg(e.target.value)} placeholder="Message…" onKeyDown={(e) => e.key === "Enter" && send()} />
            <button onClick={send} disabled={busy} className={`${BTN} whitespace-nowrap`}>{busy ? "Sending…" : "Send SMS"}</button>
          </div>
          {error && <p className="text-red text-xs mt-2">{error}</p>}
          {note && <p className="text-green-700 text-xs font-semibold mt-2">✓ {note}</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(["all", "calls", "sms", "missed"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition capitalize ${tab === t ? "bg-white shadow text-navy" : "text-gray-500"}`}>
              {t}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, number, text…"
          className="flex-1 min-w-48 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy" />
      </div>

      <div className="overflow-x-auto border border-gray-100 rounded-xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Type</th>
              <th className={th}>Who</th>
              <th className={th}>Details</th>
              <th className={th}>When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 && (
              <tr><td className={td} colSpan={4}><span className="text-gray-400">No calls or texts yet.</span></td></tr>
            )}
            {visible.map((r) => {
              const k = KIND(r);
              const name = r.customer_id ? names[r.customer_id] : null;
              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className={td}><span title={k.label}>{k.icon}</span></td>
                  <td className={td}>
                    {name
                      ? <Link href={`/admin/customers/view/${r.customer_id}`} className="font-semibold text-navy hover:text-red transition">{name}</Link>
                      : <span className="text-gray-500">{r.customer_phone || "—"}</span>}
                    {name && r.customer_phone && <span className="block text-xs text-gray-400">{r.customer_phone}</span>}
                  </td>
                  <td className={`${td} max-w-md`}>
                    {r.content && <span className="block text-gray-700">{r.content}</span>}
                    <span className="text-xs text-gray-400">
                      {r.status}{r.duration ? ` · ${dur(r.duration)}` : ""}
                      {r.recording_url && <> · <a href={r.recording_url} target="_blank" rel="noopener noreferrer" className="text-navy font-semibold hover:underline">recording</a></>}
                    </span>
                  </td>
                  <td className={`${td} whitespace-nowrap text-gray-500`}>{fmt(r.occurred_at || r.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
