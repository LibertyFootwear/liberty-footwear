import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { fulfillCheckoutSession } from "@/lib/fulfillOrder";
import { env } from "@/lib/env";

// Stripe needs the raw request body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? "", env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature check failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    try {
      // Re-fetch with line items expanded so we can record the order fully.
      const full = await stripe.checkout.sessions.retrieve((event.data.object as Stripe.Checkout.Session).id, {
        expand: ["line_items.data.price.product"],
      });
      await fulfillCheckoutSession(full);
    } catch (err) {
      console.error("Order fulfillment failed:", err);
      return NextResponse.json({ error: "Fulfillment error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
