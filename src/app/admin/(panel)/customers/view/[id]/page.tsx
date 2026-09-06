import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { products } from "@/data/products";
import { isBootItem } from "@/lib/analytics";
import { notFound } from "next/navigation";
import Link from "next/link";
import SmsButton from "../../../SmsButton";

export const dynamic = "force-dynamic";

const NAME_BY_STOCK = new Map(products.map((p) => [p.stockNo, p.name]));

interface Line {
  date: string;
  channel: "web" | "store";
  name: string;
  stockNo: string;
  size?: string;
  qty: number;
  amount: number; // line total
}

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sb = getSupabase();

  const [custRes, ordersRes, salesRes, commsRes] = await Promise.all([
    sb.from("customers").select("*").eq("id", id).maybeSingle(),
    sb.from("orders").select("items, total, created_at, source, status").eq("customer_id", id).order("created_at", { ascending: false }),
    sb.from("retail_sales").select("stock_no, size, qty, total, sale_date").eq("customer_id", id).order("sale_date", { ascending: false }),
    sb.from("communications").select("*").eq("customer_id", id).order("occurred_at", { ascending: false, nullsFirst: false }).limit(50),
  ]);

  const c = custRes.data;
  if (!c) notFound();

  const orders = ordersRes.data ?? [];
  const sales = salesRes.data ?? [];
  const comms = commsRes.data ?? [];

  // Flatten every purchased product into a single line list, newest first.
  const lines: Line[] = [];
  let totalSpent = 0;
  let purchaseCount = 0;

  for (const o of orders) {
    purchaseCount += 1;
    totalSpent += (o.total as number) ?? 0;
    const channel = o.source === "store" ? "store" : "web";
    for (const it of (o.items as { name?: string; stockNo?: string; size?: string; qty?: number; price?: number }[]) ?? []) {
      lines.push({
        date: o.created_at as string,
        channel,
        name: it.name || NAME_BY_STOCK.get(it.stockNo ?? "") || it.stockNo || "—",
        stockNo: it.stockNo ?? "",
        size: it.size,
        qty: it.qty ?? 1,
        amount: (it.price ?? 0) * (it.qty ?? 1),
      });
    }
  }

  for (const s of sales) {
    const amount = (s.total as number) ?? 0;
    const isReturn = amount < 0;
    // A return refunds spend and nets out items bought, but is not a purchase itself.
    if (!isReturn) purchaseCount += 1;
    totalSpent += amount;
    const stock = (s.stock_no as string) ?? "";
    const qty = (s.qty as number) ?? 1;
    lines.push({
      date: (s.sale_date as string) ?? "",
      channel: "store",
      name: NAME_BY_STOCK.get(stock) || stock || "—",
      stockNo: stock,
      size: (s.size as string) ?? undefined,
      qty: isReturn ? -qty : qty,
      amount,
    });
  }

  lines.sort((a, b) => (a.date < b.date ? 1 : -1));

  // Boots only (excludes services, footbeds, accessories, apparel); returns net out.
  const bootsBought = lines.filter((l) => isBootItem(l.stockNo)).reduce((s, l) => s + l.qty, 0);

  const sources = (c.sources as string[]) ?? [];
  const channelLabel = sources.includes("web") && sources.includes("store") ? "Web + In-store"
    : sources.includes("web") ? "Web" : sources.includes("store") ? "In-store" : "—";

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/admin/customers" className="text-sm text-gray-400 hover:text-navy transition">← Customers</Link>

      {/* Header */}
      <div className="mt-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-black text-navy">{c.name || "Unnamed customer"}</h1>
          {c.user_id && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">HAS WEB ACCOUNT</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {c.email || "no email"} · {c.phone || "no phone"} · {channelLabel}
        </p>
        {c.phone && (
          <div className="mt-2">
            <SmsButton
              phone={c.phone as string}
              customerId={id}
              label="Send a text"
              message={`Hi ${(c.name as string)?.split(" ")[0] || "there"}, `}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50"
            />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Total spent</p>
          <p className="text-2xl font-black text-navy mt-1">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Purchases</p>
          <p className="text-2xl font-black text-navy mt-1">{purchaseCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Boots bought</p>
          <p className="text-2xl font-black text-navy mt-1">{bootsBought}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Items bought</p>
          <p className="text-2xl font-black text-navy mt-1">{lines.reduce((s, l) => s + l.qty, 0)}</p>
        </div>
      </div>

      {/* Products bought */}
      <h2 className="font-black text-navy mb-3">Products purchased</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "Product", "Stock #", "Size", "Qty", "Channel", "Amount"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lines.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No purchases recorded.</td></tr>
            )}
            {lines.map((l, i) => (
              <tr key={i} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">{l.date ? new Date(l.date).toLocaleDateString("en-US") : "—"}</td>
                <td className="px-5 py-3 font-semibold text-navy">{l.name}</td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{l.stockNo || "—"}</td>
                <td className="px-5 py-3 text-gray-500">{l.size || "—"}</td>
                <td className="px-5 py-3 text-gray-600">{l.qty}</td>
                <td className="px-5 py-3">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${l.channel === "web" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                    {l.channel === "web" ? "WEB" : "STORE"}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{l.amount ? `$${l.amount.toFixed(2)}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calls & texts (Quo) */}
      {comms.length > 0 && (
        <>
          <h2 className="font-black text-navy mb-3 mt-8">Calls &amp; texts</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {comms.map((m) => {
              const out = m.direction === "outgoing";
              const isCall = m.type === "call" || m.type === "voicemail";
              const icon = m.type === "voicemail" ? "🎙️" : isCall ? (m.status === "missed" ? "📵" : "📞") : (out ? "💬→" : "💬");
              const when = m.occurred_at || m.created_at;
              return (
                <div key={m.id as string} className="flex items-start gap-3 px-4 py-3">
                  <span className="text-lg leading-none">{icon}</span>
                  <div className="min-w-0 flex-1">
                    {m.content ? <p className="text-sm text-gray-700">{m.content as string}</p> : <p className="text-sm text-gray-400 italic">{isCall ? "Call" : "Text"} · {(m.status as string) || ""}</p>}
                    <p className="text-xs text-gray-400">
                      {out ? "Outgoing" : "Incoming"}
                      {m.duration ? ` · ${Math.floor((m.duration as number) / 60)}m ${(m.duration as number) % 60}s` : ""}
                      {when ? ` · ${new Date(when as string).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` : ""}
                      {m.recording_url ? <> · <a href={m.recording_url as string} target="_blank" rel="noopener noreferrer" className="text-navy font-semibold hover:underline">recording</a></> : null}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
