import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { fulfillCheckoutSession } from "@/lib/fulfillOrder";

// Stripe needs the raw request body to verify the signature.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(secret, { apiVersion: "2026-06-24.dahlia" });
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? "", webhookSecret);
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
