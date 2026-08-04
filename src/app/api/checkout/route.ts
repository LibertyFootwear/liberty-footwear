import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import { getCatalogPrice } from "@/lib/catalog";
import { products } from "@/data/products";
import { getAuthUserId, signToken, setAuthCookie } from "@/lib/authJwt";
import { getUserByEmail, createUser } from "@/lib/userDb";
import { tryUpsertCustomer } from "@/lib/customersDb";
import { getSiteSettings } from "@/lib/siteSettings";
import { env } from "@/lib/env";

const APPAREL_SHIPPING_CENTS = 800; // $8 flat when the order is apparel-only

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-06-24.dahlia",
});

// 6% Michigan sales tax — created once per Stripe mode, then reused.
let cachedTaxRateId: string | null = null;
async function getMiTaxRateId(): Promise<string> {
  if (cachedTaxRateId) return cachedTaxRateId;
  const existing = await stripe.taxRates.list({ active: true, limit: 100 });
  const found = existing.data.find((r) => r.metadata?.lf === "mi6");
  if (found) return (cachedTaxRateId = found.id);
  const created = await stripe.taxRates.create({
    display_name: "Sales Tax",
    description: "Michigan Sales Tax",
    percentage: 6,
    inclusive: false,
    metadata: { lf: "mi6" },
  });
  return (cachedTaxRateId = created.id);
}

export async function POST(req: NextRequest) {
  const { items, shippingMethod, billing } = await req.json() as {
    items: { stockNo: string; name: string; size?: string; price: number; qty: number }[];
    shippingMethod?: "ship" | "pickup";
    billing?: { firstName: string; lastName: string; email: string; phone: string; address?: string; city?: string; state?: string; zip?: string; country?: string; createAccount?: boolean; password?: string };
  };

  if (!items?.length) return NextResponse.json({ error: "No items" }, { status: 400 });

  // Kill-switch: refuse new orders when online sales are paused in admin settings.
  const settings = await getSiteSettings();
  if (!settings.salesEnabled) {
    return NextResponse.json(
      { error: "sales_paused", message: settings.pausedMessage, phone: settings.contactPhone },
      { status: 403 }
    );
  }

  let userId = await getAuthUserId();

  // Optional: create the account the guest opted into at checkout. Best-effort —
  // a hiccup here must never block the purchase. On success we log them in
  // (auth cookie set on the response) and link the order to the new account.
  let authCookie: ReturnType<typeof setAuthCookie> | null = null;
  if (!userId && billing?.createAccount && billing.email && (billing.password?.length ?? 0) >= 8) {
    try {
      if (!(await getUserByEmail(billing.email))) {
        const user = await createUser({
          name: `${billing.firstName ?? ""} ${billing.lastName ?? ""}`.trim() || billing.email,
          email: billing.email,
          phone: billing.phone ?? "",
          passwordHash: await bcrypt.hash(billing.password!, 10),
          newsletter: false,
          address: {
            line1: billing.address?.trim() ?? "",
            city: billing.city?.trim() ?? "",
            state: billing.state?.trim() ?? "",
            zip: billing.zip?.trim() ?? "",
            country: (billing.country || "US").trim(),
          },
        });
        await tryUpsertCustomer({
          name: user.name, email: user.email, phone: user.phone, address: user.address,
          userId: user.id, source: "web", isPurchase: false,
        });
        userId = user.id;
        authCookie = setAuthCookie(await signToken({ userId: user.id }));
      }
    } catch (err) {
      console.error("Account creation at checkout failed (order still proceeds):", err);
    }
  }

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

  const taxRateId = await getMiTaxRateId();

  const session = await stripe.checkout.sessions.create({
    // Omit payment_method_types so Stripe enables every method turned on in the
    // Dashboard (card, Apple Pay, Google Pay, Link) — improves conversion.
    mode: "payment",
    // Auto-generate a proper invoice (PDF) for every paid web order.
    invoice_creation: {
      enabled: true,
      invoice_data: {
        description: "Liberty Footwear — online order",
        footer: "Thank you for your business. Liberty Footwear · Built in America · Grand Rapids, MI",
      },
    },
    line_items: validatedItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.price * 100,
        product_data: { name: item.name, metadata: { stockNo: item.stockNo, size: item.size } },
      },
      quantity: item.qty,
      tax_rates: [taxRateId],
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
    success_url: `${env.NEXT_PUBLIC_BASE_URL}/order/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.NEXT_PUBLIC_BASE_URL}/cart`,
  });

  const res = NextResponse.json({ url: session.url });
  if (authCookie) res.cookies.set(authCookie); // log in the just-created account
  return res;
}
