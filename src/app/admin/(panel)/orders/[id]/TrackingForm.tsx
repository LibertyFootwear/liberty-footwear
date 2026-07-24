"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CARRIERS = ["FedEx", "UPS", "USPS", "Other"];

export default function TrackingForm({ orderId, carrier, trackingNumber }: {
  orderId: string;
  carrier?: string;
  trackingNumber?: string;
}) {
  const [c, setC] = useState(carrier || "FedEx");
  const [t, setT] = useState(trackingNumber || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carrier: c, trackingNumber: t }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Carrier</label>
        <select value={c} onChange={(e) => setC(e.target.value)}
          className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy">
          {CARRIERS.map((x) => <option key={x}>{x}</option>)}
        </select>
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tracking number</label>
        <input value={t} onChange={(e) => setT(e.target.value)} placeholder="e.g. 771234567890"
          className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy" />
      </div>
      <button onClick={save} disabled={saving}
        className="px-5 py-2 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50">
        {saved ? "✓ Saved" : saving ? "Saving…" : "Save tracking"}
      </button>
    </div>
  );
}
