"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface BoardOrder {
  id: string;
  created_at: string;
  total: number;
  status: string;
  source?: string | null;
  shipping_name?: string | null;
  shipping_method?: string | null;
  tracking_number?: string | null;
  itemCount: number;
}

const COLUMNS = [
  { key: "paid",       label: "New",        head: "bg-blue-500" },
  { key: "processing", label: "Processing", head: "bg-amber-500" },
  { key: "shipped",    label: "Shipped",    head: "bg-purple-500" },
  { key: "delivered",  label: "Delivered",  head: "bg-green-600" },
];
const NEXT: Record<string, string> = { paid: "processing", processing: "shipped", shipped: "delivered" };
const NEXT_LABEL: Record<string, string> = { paid: "Start processing", processing: "Mark shipped", shipped: "Mark delivered" };

export default function OrdersBoard({ initial }: { initial: BoardOrder[] }) {
  const [orders, setOrders] = useState<BoardOrder[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();

  async function setStatus(id: string, status: string) {
    setBusy(id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((col) => {
        const items = orders.filter((o) => o.status === col.key);
        return (
          <div key={col.key} className="bg-gray-50 rounded-xl border border-gray-100 flex flex-col min-h-[200px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.head}`} />
                <span className="font-black text-navy text-sm">{col.label}</span>
              </div>
              <span className="text-xs font-bold text-gray-400 bg-white rounded-full px-2 py-0.5">{items.length}</span>
            </div>

            <div className="p-3 space-y-3 flex-1">
              {items.length === 0 && <p className="text-xs text-gray-300 text-center py-6">Empty</p>}
              {items.map((o) => {
                const next = NEXT[o.status];
                return (
                  <div key={o.id} className="bg-white rounded-lg border border-gray-100 shadow-sm p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Link href={`/admin/orders/${o.id}`} className="font-mono text-xs font-bold text-navy hover:text-red transition">#{o.id.slice(0, 8)}</Link>
                      <span className="text-xs font-black text-gray-900">${o.total?.toFixed(2)}</span>
                    </div>
                    <p className="text-sm font-semibold text-navy truncate">{o.shipping_name ?? "Guest"}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(o.created_at).toLocaleDateString()} · {o.itemCount} item{o.itemCount !== 1 ? "s" : ""}
                      {o.shipping_method === "pickup" ? " · 🏪 pickup" : ""}
                    </p>
                    {o.status === "shipped" && !o.tracking_number && (
                      <p className="text-[11px] text-amber-600 font-semibold mt-1">⚠ no tracking # yet</p>
                    )}

                    <div className="flex items-center gap-2 mt-2.5">
                      {next ? (
                        <button
                          onClick={() => setStatus(o.id, next)}
                          disabled={busy === o.id}
                          className="flex-1 px-2 py-1.5 bg-navy text-white text-[11px] font-bold rounded-md hover:bg-navy/80 transition disabled:opacity-50"
                        >
                          {busy === o.id ? "…" : `${NEXT_LABEL[o.status]} →`}
                        </button>
                      ) : (
                        <span className="flex-1 text-[11px] text-green-600 font-bold text-center py-1.5">✓ Complete</span>
                      )}
                      <Link href={`/admin/orders/${o.id}`} className="px-2 py-1.5 border border-gray-200 text-navy text-[11px] font-bold rounded-md hover:border-navy transition">
                        Detail
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
