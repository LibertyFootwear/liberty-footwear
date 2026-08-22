"use client";

import { useState } from "react";

export default function NewsletterSender({ recipientCount }: { recipientCount: number }) {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function send() {
    setError("");
    setResult(null);
    if (!subject.trim() || !html.trim()) { setError("Fill in both the subject and the HTML body."); return; }
    if (!window.confirm(`Send this newsletter to ${recipientCount} subscriber${recipientCount === 1 ? "" : "s"}? This cannot be undone.`)) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || `Send failed (${res.status})`);
      setResult(`Sent to ${d.sent} of ${d.total}${d.failed ? ` · ${d.failed} failed` : ""}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Compose & send</p>

      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject line"
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-navy transition"
      />
      <textarea
        value={html}
        onChange={(e) => setHtml(e.target.value)}
        placeholder="Paste the email HTML here…"
        rows={8}
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-xs font-mono text-gray-600 mb-3 focus:outline-none focus:border-navy transition resize-y"
      />

      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={send}
          disabled={sending}
          className="px-6 py-2.5 bg-red hover:bg-red/90 text-white font-bold rounded-lg transition disabled:opacity-50"
        >
          {sending ? "Sending…" : `Send to ${recipientCount}`}
        </button>
        {result && <span className="text-sm font-semibold text-green-700">✓ {result}</span>}
        {error && <span className="text-sm font-semibold text-red">{error}</span>}
      </div>
      <p className="text-xs text-gray-400 mt-3">Sends individually to each subscriber. Include an unsubscribe link (e.g. the newsletter template already has one).</p>
    </div>
  );
}
