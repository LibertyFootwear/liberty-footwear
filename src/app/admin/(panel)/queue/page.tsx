import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";
import { usDate } from "@/lib/formatDate";
import {
  QueueItem, prioritize, parseDue, addDays, ageInDays, todayKey, WEB_SLA_DAYS,
} from "@/lib/queue";
import { PageHeader } from "../ui";

export const dynamic = "force-dynamic";

const KIND_META: Record<string, { label: string; icon: string; badge: string }> = {
  web:    { label: "Web order",     icon: "🌐", badge: "bg-blue-100 text-blue-700" },
  custom: { label: "Custom order",  icon: "🏪", badge: "bg-amber-100 text-amber-700" },
  repair: { label: "Repair",        icon: "🔧", badge: "bg-purple-100 text-purple-700" },
};

interface Loaded { work: QueueItem[]; pickup: QueueItem[]; }

async function load(): Promise<Loaded> {
  const sb = getSupabase();
  const today = todayKey();

  const [ordersRes, openRes, repairsRes] = await Promise.all([
    sb.from("orders").select("*").order("created_at", { ascending: false }),
    sb.from("open_orders").select("*"),
    sb.from("repairs").select("*"),
  ]);

  const work: QueueItem[] = [];
  const pickup: QueueItem[] = [];

  // ── Web orders — paid (new) or processing still need work; shipping SLA drives due.
  for (const o of ordersRes.data ?? []) {
    if (o.source === "store" || o.shipping_method === "store" || o.archived) continue;
    if (o.status !== "paid" && o.status !== "processing") continue;
    const due = addDays(o.created_at, WEB_SLA_DAYS);
    work.push({
      id: o.id, kind: "web", href: "/admin/orders",
      customer: o.shipping_name ?? "Guest",
      summary: `${(o.items as unknown[])?.length ?? 0} item(s) · $${(o.total ?? 0).toFixed(2)}${o.paid === false ? " · unpaid" : ""}`,
      stage: o.status === "paid" ? "New" : "Processing",
      due, createdAt: o.created_at, overdue: due < today,
    });
  }

  // ── Custom orders (open_orders): open = needs making; made = awaiting pickup.
  for (const r of openRes.data ?? []) {
    if (r.picked_up_date) continue;
    const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "—";
    const summary = [r.stock_no, r.details].filter(Boolean).join(" · ") || "—";
    const { date, note } = parseDue(r.promised);
    if (r.complete_date) {
      pickup.push({
        id: r.id, kind: "custom", href: "/admin/open-orders", customer: name, summary,
        stage: "Made — awaiting pickup", due: date, dueNote: note,
        createdAt: r.created_at ?? r.ordered_date ?? "", overdue: false,
      });
    } else {
      work.push({
        id: r.id, kind: "custom", href: "/admin/open-orders", customer: name, summary,
        stage: "Open", due: date, dueNote: note,
        createdAt: r.created_at ?? r.ordered_date ?? "", overdue: !!date && date < today,
      });
    }
  }

  // ── Repairs: open = in shop needing work; done = awaiting pickup.
  for (const r of repairsRes.data ?? []) {
    if (r.picked_up_date) continue;
    const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || "—";
    const summary = [r.job, r.tag_no ? `#${r.tag_no}` : null, r.details].filter(Boolean).join(" · ") || "—";
    const { date, note } = parseDue(r.promised);
    if (r.complete_date) {
      pickup.push({
        id: r.id, kind: "repair", href: "/admin/repairs", customer: name, summary,
        stage: "Done — awaiting pickup", due: date, dueNote: note,
        createdAt: r.created_at ?? r.ordered_date ?? "", overdue: false,
      });
    } else {
      work.push({
        id: r.id, kind: "repair", href: "/admin/repairs", customer: name, summary,
        stage: "In shop", due: date, dueNote: note,
        createdAt: r.created_at ?? r.ordered_date ?? "", overdue: !!date && date < today,
      });
    }
  }

  return { work: prioritize(work), pickup: prioritize(pickup) };
}

function DueCell({ item }: { item: QueueItem }) {
  const today = todayKey();
  if (!item.due) return <span className="text-gray-400">no date</span>;
  const days = ageInDays(item.due, today); // >0 = past
  const rel =
    days > 0 ? `${days}d overdue` :
    days === 0 ? "due today" :
    `in ${-days}d`;
  return (
    <span className={item.overdue ? "text-red font-bold" : days === 0 ? "text-amber-600 font-semibold" : "text-gray-600"}>
      {usDate(item.due)} <span className="text-[11px] font-normal">· {rel}</span>
    </span>
  );
}

function Row({ item, rank }: { item: QueueItem; rank?: number }) {
  const meta = KIND_META[item.kind];
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${item.overdue ? "bg-red/5" : ""}`}
    >
      {rank != null && (
        <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${item.overdue ? "bg-red text-white" : "bg-gray-100 text-gray-500"}`}>
          {rank}
        </span>
      )}
      <span className="text-lg flex-shrink-0" title={meta.label}>{meta.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-navy truncate">{item.customer}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${meta.badge}`}>{item.stage}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{item.summary}</p>
      </div>
      <div className="text-right text-sm flex-shrink-0 whitespace-nowrap">
        <DueCell item={item} />
        {item.dueNote && <p className="text-[11px] text-gray-400 truncate max-w-40">{item.dueNote}</p>}
      </div>
    </Link>
  );
}

export default async function AdminQueue() {
  await requireAdmin();
  const { work, pickup } = await load();

  const overdue = work.filter((i) => i.overdue).length;
  const byKind = (k: string) => work.filter((i) => i.kind === k).length;

  const stat = (label: string, value: number | string, cls = "text-navy") => (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-black tabular-nums ${cls}`}>{value}</p>
    </div>
  );

  return (
    <div className="p-8">
      <PageHeader
        title="Work Queue"
        subtitle={<>Everything that needs work, most urgent first — web orders, custom orders and repairs together, ranked by promised date. <span className="text-red font-semibold">Overdue</span> jobs are at the top.</>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stat("Needs work", work.length)}
        {stat("Overdue", overdue, overdue > 0 ? "text-red" : "text-navy")}
        {stat("🔧 Repairs", byKind("repair"))}
        {stat("Awaiting pickup", pickup.length)}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm mb-8">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-black text-navy">Do next</h2>
          <span className="text-xs text-gray-400">🌐 web · 🏪 custom · 🔧 repair</span>
        </div>
        <div className="divide-y divide-gray-50">
          {work.length === 0 && <p className="px-4 py-10 text-center text-sm text-gray-400">Nothing waiting — all caught up. 🎉</p>}
          {work.map((item, i) => <Row key={`${item.kind}-${item.id}`} item={item} rank={i + 1} />)}
        </div>
      </div>

      {pickup.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-black text-navy">Ready — awaiting pickup</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {pickup.map((item) => <Row key={`${item.kind}-${item.id}`} item={item} />)}
          </div>
        </div>
      )}
    </div>
  );
}
