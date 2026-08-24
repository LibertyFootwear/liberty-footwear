import Stripe from "stripe";
import { saveOrder, getOrderByStripeSession } from "@/lib/ordersDb";
import { decrementInventory } from "@/lib/inventoryDb";
import { tryUpsertCustomer } from "@/lib/customersDb";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/orderEmail";
import { products } from "@/data/products";
import { publicEnv } from "@/lib/publicEnv";
import { redeemDiscount } from "@/lib/discounts";

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

  const createdAt = new Date().toISOString();
  const shippingName = session.customer_details?.name ?? undefined;
  const shippingEmail = session.customer_details?.email ?? undefined;
  const shippingPhone = session.metadata?.phone ?? s.customer_details?.phone ?? undefined;

  // Log the buyer into the unified customer registry (deduped by email/phone).
  const customerId = await tryUpsertCustomer({
    name: shippingName,
    email: shippingEmail,
    phone: shippingPhone,
    address: addr ? {
      line1: addr.line1 ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zip: addr.postal_code ?? "",
      country: addr.country ?? "US",
    } : undefined,
    userId: session.metadata?.userId || undefined,
    source: "web",
    purchaseAt: createdAt,
  });

  const orderId = crypto.randomUUID();
  const total = (session.amount_total ?? 0) / 100;

  await saveOrder({
    id: orderId,
    stripeSessionId: sessionId,
    userId: session.metadata?.userId || undefined,
    customerId,
    items,
    total,
    status: "paid",
    createdAt,
    shippingName,
    shippingEmail,
    shippingPhone,
    shippingAddress: addr ? {
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      postalCode: addr.postal_code,
      country: addr.country,
    } : undefined,
    shippingMethod: session.metadata?.shippingMethod === "pickup" ? "pickup" : "ship",
  });

  await decrementInventory(items);

  // Count the discount-code redemption. Runs only here (new order just recorded),
  // so webhook retries + success-page double-calls never over-count.
  const discountCodeId = session.metadata?.discountCodeId;
  if (discountCodeId) await redeemDiscount(discountCodeId);

  // Send the branded confirmation with the invoice PDF attached. Runs only here,
  // where a new order was just recorded, so webhook retries never double-send.
  // Best-effort: a mail failure must not fail fulfillment.
  if (shippingEmail) {
    try {
      await sendOrderConfirmationEmail({
        to: shippingEmail,
        name: shippingName,
        items,
        total,
        orderId,
        // Our own branded, printable invoice — no Stripe Invoicing fee.
        invoiceUrl: `${publicEnv.NEXT_PUBLIC_BASE_URL}/invoice/${orderId}`,
      });
    } catch (err) {
      console.error("Order confirmation email failed (order still recorded):", err);
    }
  }

  // Notify the shop of the new order, with a click-through to edit it in the
  // admin panel. Independent of the customer email and best-effort.
  try {
    await sendNewOrderAdminEmail({
      orderId,
      items,
      total,
      customerName: shippingName,
      customerEmail: shippingEmail,
      customerPhone: shippingPhone,
      shippingAddress: addr ? {
        line1: addr.line1,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postal_code,
        country: addr.country,
      } : undefined,
      baseUrl: publicEnv.NEXT_PUBLIC_BASE_URL,
    });
  } catch (err) {
    console.error("New-order admin email failed (order still recorded):", err);
  }

  return true;
}
