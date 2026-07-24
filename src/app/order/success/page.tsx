import Link from "next/link";
import Stripe from "stripe";
import { fulfillCheckoutSession } from "@/lib/fulfillOrder";

interface Props {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams;

  if (session_id && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
      const session = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["line_items.data.price.product"],
      });
      // Idempotent — the webhook may have already recorded this order.
      await fulfillCheckoutSession(session);
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
