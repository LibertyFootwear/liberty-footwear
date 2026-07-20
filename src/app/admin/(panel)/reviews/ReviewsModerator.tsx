"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Row {
  id: string;
  stockNo: string;
  productName: string;
  slug: string;
  author: string;
  rating: number;
  text: string;
  approved: boolean;
  createdAt: string;
}

function Stars({ n }: { n: number }) {
  return <span className="text-amber-500">{"★".repeat(n)}<span className="text-gray-300">{"★".repeat(5 - n)}</span></span>;
}

export default function ReviewsModerator({ pending, approved }: { pending: Row[]; approved: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "unapprove" | "delete") {
    setBusy(id);
    if (action === "delete") {
      await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: action === "approve" }),
      });
    }
    setBusy(null);
    router.refresh();
  }

  function Card({ r, isPending }: { r: Row; isPending: boolean }) {
    return (
      <div className={`rounded-xl border p-5 ${isPending ? "border-amber-200 bg-amber-50/40" : "border-gray-100 bg-white"} shadow-sm`}>
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-navy text-sm">{r.author}</p>
              <Stars n={r.rating} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {r.slug
                ? <Link href={`/shop/${r.slug}`} target="_blank" className="hover:text-navy underline">{r.productName}</Link>
                : r.productName}
              {" · "}{new Date(r.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed mb-4">{r.text}</p>
        <div className="flex items-center gap-2">
          {isPending ? (
            <button onClick={() => act(r.id, "approve")} disabled={busy === r.id}
              className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition disabled:opacity-50">
              {busy === r.id ? "…" : "✓ Approve"}
            </button>
          ) : (
            <button onClick={() => act(r.id, "unapprove")} disabled={busy === r.id}
              className="px-4 py-2 border-2 border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:border-navy transition disabled:opacity-50">
              {busy === r.id ? "…" : "Unpublish"}
            </button>
          )}
          <button onClick={() => act(r.id, "delete")} disabled={busy === r.id}
            className="px-4 py-2 border-2 border-gray-200 text-red text-xs font-bold rounded-lg hover:border-red transition disabled:opacity-50">
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h2 className="font-black text-navy mb-4">Awaiting Approval ({pending.length})</h2>
        {pending.length === 0
          ? <p className="text-sm text-gray-400">No pending reviews.</p>
          : <div className="space-y-4">{pending.map((r) => <Card key={r.id} r={r} isPending />)}</div>}
      </div>

      <div>
        <h2 className="font-black text-navy mb-4">Published ({approved.length})</h2>
        {approved.length === 0
          ? <p className="text-sm text-gray-400">No published reviews yet.</p>
          : <div className="space-y-4">{approved.map((r) => <Card key={r.id} r={r} isPending={false} />)}</div>}
      </div>
    </div>
  );
}
