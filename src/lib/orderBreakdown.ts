import Stripe from "stripe";
import { env } from "@/lib/env";

export interface OrderBreakdown {
  /** Pre-tax, pre-discount unit/line amounts per item (same order as order.items), when known. */
  lines: { unit: number; total: number }[] | null;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  source: "stripe" | "estimate";
}

const r2 = (n: number) => Math.round(n * 100) / 100;

interface OrderLike {
  stripeSessionId?: string | null;
  items: { price: number; qty: number }[];
  total: number;
}

/**
 * Subtotal / discount / shipping / tax split for an order.
 *
 * Orders recorded before this change stored each item's price WITH tax (Stripe's per-line
 * `amount_total`), so the split can't be derived from the order row alone. For Stripe orders we
 * ask Stripe (the source of truth) — that works for old and new orders. Pay-at-pickup orders
 * store pre-tax prices and a 6% Michigan tax, so those are derived from the row. Returns null
 * when no reliable split exists (callers then fall back to the plain total).
 */
export async function getOrderBreakdown(order: OrderLike): Promise<OrderBreakdown | null> {
  const sid = order.stripeSessionId ?? "";

  if (sid.startsWith("pickup-")) {
    const subtotal = r2(order.items.reduce((s, i) => s + i.price * i.qty, 0));
    const net = r2(order.total / 1.06);
    return {
      lines: order.items.map((i) => ({ unit: i.price, total: r2(i.price * i.qty) })),
      subtotal,
      discount: Math.max(0, r2(subtotal - net)),
      shipping: 0,
      tax: r2(order.total - net),
      total: order.total,
      source: "estimate",
    };
  }

  if (!sid || sid.startsWith("store-")) return null;

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
    const s = await stripe.checkout.sessions.retrieve(sid, { expand: ["line_items"] });
    const lis = s.line_items?.data ?? [];
    return {
      lines: lis.length === order.items.length
        ? lis.map((li) => ({ unit: r2((li.amount_subtotal ?? 0) / 100 / (li.quantity ?? 1)), total: r2((li.amount_subtotal ?? 0) / 100) }))
        : null,
      subtotal: r2((s.amount_subtotal ?? 0) / 100),
      discount: r2((s.total_details?.amount_discount ?? 0) / 100),
      shipping: r2((s.total_details?.amount_shipping ?? 0) / 100),
      tax: r2((s.total_details?.amount_tax ?? 0) / 100),
      total: r2((s.amount_total ?? 0) / 100),
      source: "stripe",
    };
  } catch {
    return null; // Stripe unavailable / session too old
  }
}
