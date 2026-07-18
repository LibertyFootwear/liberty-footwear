import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { products } from "@/data/products";
import { getAuthUserId } from "@/lib/authJwt";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(req: NextRequest) {
  const { items } = await req.json() as {
    items: { stockNo: string; name: string; price: number; qty: number }[];
  };

  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });
  const userId = await getAuthUserId();

  // Validate prices server-side — never trust client price
  const validatedItems = items.map((item) => {
    const product = products.find((p) => p.stockNo === item.stockNo);
    if (!product) throw new Error(`Unknown product: ${item.stockNo}`);
    if (item.qty < 1 || item.qty > 100) throw new Error("Invalid quantity");
    return { stockNo: item.stockNo, name: product.name, price: product.price, qty: item.qty };
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: validatedItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.price * 100,
        product_data: { name: item.name, metadata: { stockNo: item.stockNo } },
      },
      quantity: item.qty,
    })),
    shipping_address_collection: { allowed_countries: ["US", "CA"] },
    metadata: userId ? { userId } : {},
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
  });

  return NextResponse.json({ url: session.url });
}
