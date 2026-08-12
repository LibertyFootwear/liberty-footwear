"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["paid", "processing", "shipped", "delivered", "cancelled"] as const;

const STATUS_COLOR: Record<string, string> = {
  paid:       "bg-blue-100 text-blue-700 border-blue-300",
  processing: "bg-yellow-100 text-yellow-700 border-yellow-300",
  shipped:    "bg-purple-100 text-purple-700 border-purple-300",
  delivered:  "bg-green-100 text-green-700 border-green-300",
  cancelled:  "bg-red-100 text-red-700 border-red-300",
};

// Store-pickup orders relabel the shipping stages.
const PICKUP_LABEL: Record<string, string> = { shipped: "Ready for pickup", delivered: "Picked up" };

export default function OrderStatusForm({ orderId, currentStatus, pickup, trackingNumber }: { orderId: string; currentStatus: string; pickup?: boolean; trackingNumber?: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function save() {
    // Confirm the tracking number when shipping — entered → shown in the email, blank → omitted.
    let tracking: string | undefined;
    if (status === "shipped" && !pickup) {
      const tn = window.prompt(
        "Tracking number for this shipment?\n\nEnter it to include a tracking link in the customer's email, or leave blank to send the shipped email without tracking.",
        trackingNumber ?? ""
      );
      if (tn === null) return; // cancelled
      tracking = tn.trim();
    }
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...(tracking !== undefined ? { trackingNumber: tracking } : {}) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {STATUSES.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => setStatus(s)}
          className={`px-4 py-2 rounded-lg text-sm font-bold border-2 capitalize transition ${
            status === s ? STATUS_COLOR[s] : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-400"
          }`}
        >
          {(pickup && PICKUP_LABEL[s]) || s}
        </button>
      ))}
      <button
        onClick={save}
        disabled={saving || status === currentStatus}
        className="ml-auto px-6 py-2 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-40"
      >
        {saved ? "✓ Saved" : saving ? "Saving…" : "Save Status"}
      </button>
    </div>
  );
}
