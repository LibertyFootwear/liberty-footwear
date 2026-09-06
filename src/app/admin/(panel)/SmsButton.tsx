"use client";

import { useState } from "react";

/**
 * One-click SMS via Quo. Prefills a message the user can tweak in a prompt, then
 * posts to /api/admin/sms (which sends + logs it). Renders nothing without a phone.
 */
export default function SmsButton({ phone, message, customerId, label = "Text", className }: {
  phone?: string | null;
  message?: string;
  customerId?: string | null;
  label?: string;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  if (!phone) return null;

  async function go() {
    const text = window.prompt(`Text to ${phone}:`, message ?? "");
    if (text == null || !text.trim()) return;
    setState("sending");
    const res = await fetch("/api/admin/sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: phone, content: text.trim(), customerId: customerId ?? undefined }),
    });
    if (res.ok) {
      setState("sent");
      setTimeout(() => setState("idle"), 2500);
    } else {
      setState("idle");
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Couldn't send the text.");
    }
  }

  return (
    <button
      onClick={go}
      disabled={state === "sending"}
      className={className ?? "text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-50"}
      title={`Send an SMS to ${phone}`}
    >
      {state === "sent" ? "✓ Sent" : state === "sending" ? "…" : `💬 ${label}`}
    </button>
  );
}
