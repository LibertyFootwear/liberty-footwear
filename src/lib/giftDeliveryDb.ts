import { getSupabase } from "./supabase";

/**
 * Optional personalisation attached to a bought gift card: who it's for, who it's from, a short
 * message, and when to deliver it. Row created in fulfillOrder; the print page reads it to render
 * recipient/from/message on the card; the cron sends the recipient email when scheduled_for ≤ now.
 */
export interface GiftDelivery {
  code: string;
  amount: number;
  orderId?: string;
  buyerName?: string;
  buyerEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  fromName?: string;
  message?: string;
  scheduledFor?: string;   // ISO; null/past = send immediately
  sentAt?: string;
}

export async function saveGiftDelivery(d: GiftDelivery): Promise<void> {
  await getSupabase().from("gift_card_deliveries").insert({
    code: d.code,
    amount: d.amount,
    order_id: d.orderId ?? null,
    buyer_name: d.buyerName ?? null,
    buyer_email: d.buyerEmail ?? null,
    recipient_name: d.recipientName ?? null,
    recipient_email: d.recipientEmail ?? null,
    from_name: d.fromName ?? null,
    message: d.message ?? null,
    scheduled_for: d.scheduledFor ?? null,
    sent_at: d.sentAt ?? null,
  });
}

export async function getGiftDelivery(code: string): Promise<GiftDelivery | null> {
  const { data } = await getSupabase()
    .from("gift_card_deliveries")
    .select("*").eq("code", code).maybeSingle();
  if (!data) return null;
  return {
    code: data.code as string,
    amount: Number(data.amount),
    orderId: (data.order_id as string) ?? undefined,
    buyerName: (data.buyer_name as string) ?? undefined,
    buyerEmail: (data.buyer_email as string) ?? undefined,
    recipientName: (data.recipient_name as string) ?? undefined,
    recipientEmail: (data.recipient_email as string) ?? undefined,
    fromName: (data.from_name as string) ?? undefined,
    message: (data.message as string) ?? undefined,
    scheduledFor: (data.scheduled_for as string) ?? undefined,
    sentAt: (data.sent_at as string) ?? undefined,
  };
}

/** Pending scheduled sends due by `by` (ISO). The cron picks these up. */
export async function listDueGifts(by: string, limit = 100): Promise<GiftDelivery[]> {
  const { data } = await getSupabase()
    .from("gift_card_deliveries")
    .select("*")
    .is("sent_at", null)
    .not("recipient_email", "is", null)
    .lte("scheduled_for", by)
    .order("scheduled_for", { ascending: true })
    .limit(limit);
  return (data ?? []).map((r) => ({
    code: r.code as string, amount: Number(r.amount), orderId: (r.order_id as string) ?? undefined,
    buyerName: (r.buyer_name as string) ?? undefined, buyerEmail: (r.buyer_email as string) ?? undefined,
    recipientName: (r.recipient_name as string) ?? undefined, recipientEmail: (r.recipient_email as string) ?? undefined,
    fromName: (r.from_name as string) ?? undefined, message: (r.message as string) ?? undefined,
    scheduledFor: (r.scheduled_for as string) ?? undefined, sentAt: (r.sent_at as string) ?? undefined,
  }));
}

export async function markGiftSent(code: string): Promise<void> {
  await getSupabase().from("gift_card_deliveries").update({ sent_at: new Date().toISOString() }).eq("code", code);
}
