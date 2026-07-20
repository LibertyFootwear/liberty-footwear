import Link from "next/link";
import Stripe from "stripe";
import { saveOrder, getOrderByStripeSession } from "@/lib/ordersDb";
import { decrementInventory } from "@/lib/inventoryDb";
import { products } from "@/data/products";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const existing = await getOrderByStripeSession(session_id);
      if (!existing) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
        const session = await stripe.checkout.sessions.retrieve(session_id, {
          expand: ["line_items.data.price.product"],
        });

        if (session.payment_status === "paid") {
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

          await saveOrder({
            id: crypto.randomUUID(),
            stripeSessionId: session_id,
            userId: session.metadata?.userId || undefined,
            items,
            total: (session.amount_total ?? 0) / 100,
            status: "paid",
            createdAt: new Date().toISOString(),
            shippingName: session.customer_details?.name ?? undefined,
            shippingEmail: session.customer_details?.email ?? undefined,
          });

          // Deduct purchased quantities from finished-boot inventory (runs once per order)
          await decrementInventory(items);
        }
      }
    } catch {
      // Stripe not configured or session invalid — still show success
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="flex justify-center">
        <svg className="w-20 h-20 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h1 className="text-4xl font-black text-navy">Order Confirmed!</h1>
      <p className="text-gray-600 max-w-md">
        Thank you for your order. You'll receive a confirmation email shortly. Liberty Footwear
        boots are handcrafted to order — please allow 4–6 weeks for delivery.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/account" className="btn-primary">View My Orders</Link>
        <Link href="/shop" className="btn-secondary">Continue Shopping</Link>
      </div>
    </div>
  );
}
