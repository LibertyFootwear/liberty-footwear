"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentStatusForm({ orderId, paid }: { orderId: string; paid: boolean }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function setPaid(value: boolean) {
    setBusy(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: value }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
        {paid ? "✓ Paid" : "Unpaid — pay at pickup"}
      </span>
      <button
        onClick={() => setPaid(!paid)}
        disabled={busy}
        className="ml-auto px-4 py-2 border-2 border-gray-200 text-navy text-sm font-bold rounded-lg hover:border-navy transition disabled:opacity-50"
      >
        {busy ? "…" : paid ? "Mark unpaid" : "Mark paid"}
      </button>
    </div>
  );
}
