import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { getCatalogPrice } from "@/lib/catalog";
import { decrementInventory } from "@/lib/inventoryDb";

interface InItem { stockNo: string; size: string; qty: number; price: number }

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { items, paymentMethod, customerName, customerPhone, date } = await req.json() as {
    items: InItem[]; paymentMethod?: string; customerName?: string; customerPhone?: string; date?: string;
  };

  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });

  // Build validated line items (trust catalog for name; allow manual price override)
  const lineItems = [];
  let total = 0;
  for (const it of items) {
    if (!it.stockNo || !it.size || !it.qty || it.qty < 1) continue;
    const cat = await getCatalogPrice(it.stockNo);
    const price = typeof it.price === "number" && it.price >= 0 ? it.price : (cat?.price ?? 0);
    lineItems.push({ stockNo: it.stockNo, name: cat?.name ?? it.stockNo, size: it.size, price, qty: it.qty });
    total += price * it.qty;
  }
  if (lineItems.length === 0) return NextResponse.json({ error: "No valid items" }, { status: 400 });

  const createdAt = date ? new Date(date + "T12:00:00").toISOString() : new Date().toISOString();

  const { data, error } = await getSupabase().from("orders").insert({
    id: crypto.randomUUID(),
    stripe_session_id: `store-${crypto.randomUUID()}`,
    user_id: null,
    items: lineItems,
    total: Math.round(total * 100) / 100,
    status: "delivered",
    created_at: createdAt,
    shipping_name: customerName?.trim() || "In-store customer",
    shipping_email: null,
    phone: customerPhone?.trim() || null,
    shipping_method: "store",
    source: "store",
    payment_method: paymentMethod || null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await decrementInventory(lineItems);

  return NextResponse.json({ ok: true, id: data?.id });
}
