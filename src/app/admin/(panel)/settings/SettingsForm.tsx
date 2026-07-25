"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  salesEnabled: boolean;
  pausedMessage: string;
  contactPhone: string;
}

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [salesEnabled, setSalesEnabled] = useState(initial.salesEnabled);
  const [pausedMessage, setPausedMessage] = useState(initial.pausedMessage);
  const [contactPhone, setContactPhone] = useState(initial.contactPhone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save(next?: Partial<Settings>) {
    setSaving(true);
    setSaved(false);
    const body = { salesEnabled, pausedMessage, contactPhone, ...next };
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      router.refresh();
    } else {
      alert("Could not save. Please try again.");
    }
  }

  function toggleSales() {
    const next = !salesEnabled;
    setSalesEnabled(next);
    save({ salesEnabled: next });
  }

  return (
    <div className="space-y-8">
      {/* Sales kill-switch */}
      <section className={`rounded-xl border-2 p-6 ${salesEnabled ? "border-green-200 bg-green-50" : "border-red bg-red/5"}`}>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="font-black text-navy text-lg">Online ordering</h2>
            <p className="text-sm text-gray-600 mt-1">
              {salesEnabled
                ? "Customers can place orders online as normal."
                : "Ordering is paused. Customers see the message below and are asked to call instead."}
            </p>
            <p className={`mt-3 text-sm font-black uppercase tracking-widest ${salesEnabled ? "text-green-600" : "text-red"}`}>
              {salesEnabled ? "● Sales ON" : "● Sales STOPPED"}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleSales}
            disabled={saving}
            className={`shrink-0 px-5 py-3 rounded-lg font-bold text-sm text-white transition disabled:opacity-60 ${
              salesEnabled ? "bg-red hover:bg-red/90" : "bg-green-600 hover:bg-green-500"
            }`}
          >
            {salesEnabled ? "Stop Sales" : "Resume Sales"}
          </button>
        </div>
      </section>

      {/* Message + phone shown when paused */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
        <h2 className="font-black text-navy">Pause message &amp; phone</h2>
        <p className="text-sm text-gray-500 -mt-3">Shown to customers when ordering is paused.</p>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Message</label>
          <textarea
            value={pausedMessage}
            onChange={(e) => setPausedMessage(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Phone number</label>
          <input
            type="text"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/30"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => save()}
            disabled={saving}
            className="bg-navy text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-navy/90 transition disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-green-600 text-sm font-bold">✓ Saved</span>}
        </div>
      </section>
    </div>
  );
}
