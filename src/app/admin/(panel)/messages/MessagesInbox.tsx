"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface MessageRow {
  id: string;
  name: string | null;
  email: string | null;
  subject: string | null;
  message: string | null;
  attachment_count: number;
  attachment_names: string | null;
  status: "new" | "read" | "archived";
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  new: "bg-red/10 text-red",
  read: "bg-gray-100 text-gray-500",
  archived: "bg-gray-100 text-gray-400",
};

function fmt(dt: string) {
  return new Date(dt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

export default function MessagesInbox({ messages }: { messages: MessageRow[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"inbox" | "archived">("inbox");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const newCount = messages.filter((m) => m.status === "new").length;

  const visible = useMemo(() => {
    const query = q.trim().toLowerCase();
    return messages.filter((m) => {
      if (tab === "inbox" && m.status === "archived") return false;
      if (tab === "archived" && m.status !== "archived") return false;
      if (!query) return true;
      return [m.name, m.email, m.subject, m.message].filter(Boolean).join(" ").toLowerCase().includes(query);
    });
  }, [messages, tab, q]);

  async function patch(id: string, status: MessageRow["status"]) {
    setBusy(true);
    await fetch("/api/admin/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this message permanently?")) return;
    setBusy(true);
    await fetch(`/api/admin/messages?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (openId === id) setOpenId(null);
    router.refresh();
  }

  function toggle(m: MessageRow) {
    const next = openId === m.id ? null : m.id;
    setOpenId(next);
    if (next && m.status === "new") patch(m.id, "read"); // opening marks it read
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(["inbox", "archived"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${tab === t ? "bg-white shadow text-navy" : "text-gray-500"}`}
            >
              {t === "inbox" ? `Inbox${newCount ? ` (${newCount} new)` : ""}` : "Archived"}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, email, subject, text…"
          className="flex-1 min-w-48 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy"
        />
      </div>

      <div className="border border-gray-100 rounded-xl divide-y divide-gray-50 overflow-hidden">
        {visible.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-gray-400">No messages{tab === "inbox" ? " in the inbox" : " archived"}.</p>
        )}
        {visible.map((m) => {
          const open = openId === m.id;
          return (
            <div key={m.id} className={m.status === "new" ? "bg-red/[0.03]" : ""}>
              <button onClick={() => toggle(m)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition">
                <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLE[m.status]}`}>{m.status}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`truncate ${m.status === "new" ? "font-black text-navy" : "font-semibold text-navy"}`}>{m.name || "—"}</span>
                    {m.email && <span className="text-xs text-gray-400 truncate">· {m.email}</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {m.subject ? <span className="font-semibold">{m.subject}: </span> : null}
                    {m.message}
                  </p>
                </div>
                {m.attachment_count > 0 && <span className="flex-shrink-0 text-xs text-gray-400">📎 {m.attachment_count}</span>}
                <span className="flex-shrink-0 text-xs text-gray-400 whitespace-nowrap hidden sm:block">{fmt(m.created_at)}</span>
              </button>

              {open && (
                <div className="px-4 pb-4 pt-1 bg-gray-50/60">
                  <div className="text-xs text-gray-400 mb-2 sm:hidden">{fmt(m.created_at)}</div>
                  <div className="bg-white border border-gray-100 rounded-lg p-4">
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{m.message}</p>
                    {m.attachment_names && (
                      <p className="mt-3 text-xs text-gray-500"><span className="font-semibold">Attachments (in the email):</span> {m.attachment_names}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {m.email && (
                      <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject || "Your message to Liberty Footwear")}`}
                        className="px-3 py-1.5 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/80 transition">Reply by email</a>
                    )}
                    {m.status !== "archived"
                      ? <button onClick={() => patch(m.id, "archived")} disabled={busy} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:border-navy transition">Archive</button>
                      : <button onClick={() => patch(m.id, "read")} disabled={busy} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:border-navy transition">Move to inbox</button>}
                    {m.status !== "new"
                      ? <button onClick={() => patch(m.id, "new")} disabled={busy} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:border-navy transition">Mark unread</button>
                      : null}
                    <button onClick={() => remove(m.id)} disabled={busy} className="px-3 py-1.5 text-red text-xs font-bold rounded-lg hover:underline ml-auto">Delete</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
