"use client";

import { useState } from "react";

export default function NewsletterSender({ recipientCount }: { recipientCount: number }) {
  const [subject, setSubject] = useState("");
  const [webUrl, setWebUrl] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState<"" | "test" | "send">("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function post(extra: Record<string, string>) {
    const res = await fetch("/api/admin/newsletter/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, bodyHtml, webUrl, ...extra }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.error || `Failed (${res.status})`);
    return d;
  }

  async function sendTest() {
    setError(""); setResult(null);
    if (!subject.trim() || !bodyHtml.trim()) { setError("Fill in the subject and body first."); return; }
    if (!testTo.trim()) { setError("Enter a test email address."); return; }
    setBusy("test");
    try {
      await post({ testTo });
      setResult(`Test sent to ${testTo}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test send failed.");
    } finally { setBusy(""); }
  }

  async function sendAll() {
    setError(""); setResult(null);
    if (!subject.trim() || !bodyHtml.trim()) { setError("Fill in the subject and body first."); return; }
    if (!window.confirm(`Send this newsletter to ${recipientCount} subscriber${recipientCount === 1 ? "" : "s"}? This cannot be undone.`)) return;
    setBusy("send");
    try {
      const d = await post({});
      setResult(`Sent to ${d.sent} of ${d.total}${d.failed ? ` · ${d.failed} failed` : ""}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally { setBusy(""); }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Compose &amp; send</p>
      <p className="text-xs text-gray-400 mb-4">Paste only the article content — the logo, colors, footer and unsubscribe link are added automatically.</p>

      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder="Subject line"
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-navy transition"
      />
      <input
        value={webUrl}
        onChange={(e) => setWebUrl(e.target.value)}
        placeholder="Web version link (optional, e.g. https://www.libertyfootwear.com/blog/…)"
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-3 focus:outline-none focus:border-navy transition"
      />
      <textarea
        value={bodyHtml}
        onChange={(e) => setBodyHtml(e.target.value)}
        placeholder="Body HTML — headings, paragraphs, images, buttons…"
        rows={8}
        className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-xs font-mono text-gray-600 mb-3 focus:outline-none focus:border-navy transition resize-y"
      />

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <input
          type="email"
          value={testTo}
          onChange={(e) => setTestTo(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 min-w-48 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-navy transition"
        />
        <button
          onClick={sendTest}
          disabled={busy !== ""}
          className="px-5 py-2.5 border-2 border-navy text-navy font-bold rounded-lg hover:bg-navy hover:text-white transition disabled:opacity-50"
        >
          {busy === "test" ? "Sending…" : "Send test"}
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap border-t border-gray-100 pt-3">
        <button
          onClick={sendAll}
          disabled={busy !== ""}
          className="px-6 py-2.5 bg-red hover:bg-red/90 text-white font-bold rounded-lg transition disabled:opacity-50"
        >
          {busy === "send" ? "Sending…" : `Send to ${recipientCount}`}
        </button>
        {result && <span className="text-sm font-semibold text-green-700">✓ {result}</span>}
        {error && <span className="text-sm font-semibold text-red">{error}</span>}
      </div>
    </div>
  );
}
