"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin: add one email, or paste a list (old-site exports, business cards, etc.). */
export default function AddContactForm() {
  const router = useRouter();
  const [bulk, setBulk] = useState("");
  const [source, setSource] = useState("imported");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState("");

  async function submit() {
    setErr(""); setMsg(null); setBusy(true);
    try {
      const res = await fetch("/api/admin/newsletter/contacts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: bulk, source }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
      setMsg(`Added ${d.added} address${d.added === 1 ? "" : "es"} to the newsletter list.`);
      setBulk("");
      router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Add failed."); }
    finally { setBusy(false); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Add contacts</p>
      <p className="text-xs text-gray-400 mb-3">
        Paste one or more addresses — commas, spaces or new lines all work. Added here they&apos;ll receive the newsletter alongside form signups.
      </p>
      <textarea
        value={bulk} onChange={(e) => setBulk(e.target.value)} rows={4}
        placeholder="jane@example.com, john@example.com&#10;mary@example.com"
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm font-mono text-gray-700 mb-3 focus:outline-none focus:border-navy resize-y"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Source</label>
        <select value={source} onChange={(e) => setSource(e.target.value)}
          className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="imported">Imported — old site</option>
          <option value="manual">Manual add</option>
          <option value="in-store">In store</option>
        </select>
        <button onClick={submit} disabled={busy || !bulk.trim()}
          className="px-5 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 transition disabled:opacity-50">
          {busy ? "Adding…" : "Add to list"}
        </button>
        {msg && <span className="text-sm font-semibold text-green-700">✓ {msg}</span>}
        {err && <span className="text-sm font-semibold text-red">{err}</span>}
      </div>
    </div>
  );
}
