import Stripe from "stripe";
import { saveOrder, getOrderByStripeSession } from "@/lib/ordersDb";
import { decrementInventory } from "@/lib/inventoryDb";
import { products } from "@/data/products";

/**
 * Turn a paid Stripe Checkout Session into an order + inventory deduction.
 * Idempotent: safe to call from both the success page and the webhook.
 * Returns true if a new order was recorded.
 */
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== "paid") return false;
  const sessionId = session.id;

  const existing = await getOrderByStripeSession(sessionId);
  if (existing) return false;

  const items = (session.line_items?.data ?? []).map((li) => {
    const prod = li.price?.product as Stripe.Product | undefined;
    const stockNo = prod?.metadata?.stockNo ?? "";
    const size = prod?.metadata?.size ?? "";
    const product = products.find((p) => p.stockNo === stockNo);
    return {
      stockNo,
      name: li.description ?? prod?.name ?? "",
      size,
      price: (li.amount_total ?? 0) / 100 / (li.quantity ?? 1),
      qty: li.quantity ?? 1,
      slug: product?.slug,
    };
  });

  const s = session as unknown as {
    shipping_details?: { address?: Record<string, string> };
    customer_details?: { address?: Record<string, string>; phone?: string };
  };
  const addr = s.shipping_details?.address ?? s.customer_details?.address;

  await saveOrder({
    id: crypto.randomUUID(),
    stripeSessionId: sessionId,
    userId: session.metadata?.userId || undefined,
    items,
    total: (session.amount_total ?? 0) / 100,
    status: "paid",
    createdAt: new Date().toISOString(),
    shippingName: session.customer_details?.name ?? undefined,
    shippingEmail: session.customer_details?.email ?? undefined,
    shippingPhone: session.metadata?.phone ?? s.customer_details?.phone ?? undefined,
    shippingAddress: addr ? {
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
      country: addr.country,
    } : undefined,
  });

  await decrementInventory(items);
  return true;
}
