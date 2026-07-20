import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getCatalogPrice } from "@/lib/catalog";
import { products } from "@/data/products";
import { getAuthUserId } from "@/lib/authJwt";

const APPAREL_SHIPPING_CENTS = 800; // $8 flat when the order is apparel-only

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia",
});

export async function POST(req: NextRequest) {
  const { items, shippingMethod, billing } = await req.json() as {
    items: { stockNo: string; name: string; size?: string; price: number; qty: number }[];
    shippingMethod?: "ship" | "pickup";
    billing?: { firstName: string; lastName: string; email: string; phone: string; address?: string; city?: string; state?: string; zip?: string; country?: string };
  };

  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });
  const userId = await getAuthUserId();

  // Validate prices server-side — never trust client price (uses admin-edited catalog price)
  const validatedItems = await Promise.all(items.map(async (item) => {
    const product = await getCatalogPrice(item.stockNo);
    if (!product) throw new Error(`Unknown product: ${item.stockNo}`);
    if (item.qty < 1 || item.qty > 100) throw new Error("Invalid quantity");
    return { stockNo: item.stockNo, name: item.name || product.name, size: item.size ?? "", price: product.price, qty: item.qty };
  }));

  // Shipping: apparel-only orders pay a flat fee when shipped; free if any boot is in the cart or on pickup.
  const hasBoot = validatedItems.some((it) => products.find((p) => p.stockNo === it.stockNo)?.category !== "Apparel");
  const hasApparel = validatedItems.some((it) => products.find((p) => p.stockNo === it.stockNo)?.category === "Apparel");
  const chargeApparelShipping = shippingMethod !== "pickup" && hasApparel && !hasBoot;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: validatedItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.price * 100,
        product_data: { name: item.name, metadata: { stockNo: item.stockNo, size: item.size } },
      },
      quantity: item.qty,
    })),
    shipping_options: [
      shippingMethod === "pickup"
        ? {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: { amount: 0, currency: "usd" },
              display_name: "Pick up in store — Grand Rapids, MI",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 1 },
                maximum: { unit: "business_day" as const, value: 2 },
              },
            },
          }
        : {
            shipping_rate_data: {
              type: "fixed_amount" as const,
              fixed_amount: { amount: chargeApparelShipping ? APPAREL_SHIPPING_CENTS : 0, currency: "usd" },
              display_name: chargeApparelShipping ? "Standard Shipping" : "Standard Shipping — Free",
              delivery_estimate: {
                minimum: { unit: "business_day" as const, value: 3 },
                maximum: { unit: "business_day" as const, value: 7 },
              },
            },
          },
    ],
    ...(shippingMethod !== "pickup" && {
      shipping_address_collection: { allowed_countries: ["US", "CA"] as ["US", "CA"] },
    }),
    ...(billing?.email && { customer_email: billing.email }),
    metadata: {
      ...(userId ? { userId } : {}),
      ...(billing ? { name: `${billing.firstName} ${billing.lastName}`, phone: billing.phone, shippingMethod: shippingMethod ?? "ship" } : {}),
    },
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
  });

  return NextResponse.json({ url: session.url });
}
