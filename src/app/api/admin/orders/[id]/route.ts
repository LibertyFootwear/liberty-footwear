import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { sendOrderStatusEmail, type OrderStatus } from "@/lib/orderEmail";
import type { OrderItem } from "@/lib/ordersDb";

// Statuses that notify the customer by email when newly set.
const EMAIL_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const valid = ["paid", "processing", "shipped", "delivered", "cancelled"];
    if (!valid.includes(body.status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    update.status = body.status;
  }
  if (body.carrier !== undefined) update.carrier = String(body.carrier).trim() || null;
  if (body.trackingNumber !== undefined) update.tracking_number = String(body.trackingNumber).trim() || null;
  if (body.archived !== undefined) update.archived = Boolean(body.archived);
  if (body.shippingMethod !== undefined) {
    if (!["ship", "pickup"].includes(body.shippingMethod)) return NextResponse.json({ error: "Invalid shipping method" }, { status: 400 });
    update.shipping_method = body.shippingMethod;
  }

  if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const sb = getSupabase();

  // Load the current order so we can tell whether the status actually changed and
  // gather the details (customer email, items, tracking) needed for the email.
  const { data: before } = await sb
    .from("orders")
    .select("status, shipping_name, shipping_email, items, total, carrier, tracking_number, shipping_method")
    .eq("id", id)
    .single();

  await sb.from("orders").update(update).eq("id", id);

  // Notify the customer only when the status transitions to a new email-worthy value.
  const newStatus = update.status as OrderStatus | undefined;
  const statusChanged = newStatus && before && newStatus !== before.status;
  if (statusChanged && EMAIL_STATUSES.includes(newStatus) && before.shipping_email) {
    try {
      const method = (body.shippingMethod as string) ?? (before.shipping_method as string);
      await sendOrderStatusEmail({
        to: before.shipping_email as string,
        name: (before.shipping_name as string) ?? undefined,
        orderId: id,
        status: newStatus,
        items: (before.items as OrderItem[]) ?? undefined,
        total: (before.total as number) ?? undefined,
        carrier: (body.carrier as string) ?? (before.carrier as string) ?? undefined,
        trackingNumber: (body.trackingNumber as string) ?? (before.tracking_number as string) ?? undefined,
        pickup: method === "pickup",
      });
    } catch (err) {
      console.error("Order status email failed (status still updated):", err);
    }
  }

  return NextResponse.json({ ok: true });
}
