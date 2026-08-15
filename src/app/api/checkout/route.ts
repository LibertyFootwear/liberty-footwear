import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import { getCatalogPrice } from "@/lib/catalog";
import { products } from "@/data/products";
import { decodeAddons, addonsSurcharge, addonsLabel, encodeAddons, takesAddons } from "@/lib/bootAddons";
import { getAuthUserId, signToken, setAuthCookie } from "@/lib/authJwt";
import { getUserByEmail, createUser } from "@/lib/userDb";
import { tryUpsertCustomer } from "@/lib/customersDb";
import { getSiteSettings } from "@/lib/siteSettings";
import { saveOrder } from "@/lib/ordersDb";
import { decrementInventory } from "@/lib/inventoryDb";
import { sendOrderConfirmationEmail, sendNewOrderAdminEmail } from "@/lib/orderEmail";
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
  const { items, shippingMethod, billing, payAtPickup } = await req.json() as {
    items: { stockNo: string; name: string; size?: string; price: number; qty: number; addons?: string }[];
    shippingMethod?: "ship" | "pickup";
    payAtPickup?: boolean;
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

  // Validate prices server-side — never trust client price (uses admin-edited
  // catalog price) or client add-on surcharge (recomputed from ADDON_PRICES).
  const validatedItems = await Promise.all(items.map(async (item) => {
    const product = await getCatalogPrice(item.stockNo);
    if (!product) throw new Error(`Unknown product: ${item.stockNo}`);
    if (item.qty < 1 || item.qty > 100) throw new Error("Invalid quantity");
    // Add-ons apply to boots only; ignore any sent for apparel.
    const catalogItem = products.find((p) => p.stockNo === item.stockNo);
    const addons = takesAddons(catalogItem?.category) ? decodeAddons(item.addons) : null;
    const surcharge = addonsSurcharge(addons ?? undefined);
    const label = addons ? addonsLabel(addons) : "";
    const name = `${item.name || product.name}${label ? ` — ${label}` : ""}`;
    return {
      stockNo: item.stockNo,
      name,
      size: item.size ?? "",
      price: product.price + surcharge,
      qty: item.qty,
      addons: addons ? encodeAddons(addons) : "",
    };
  }));

  // Shipping: apparel-only orders pay a flat fee when shipped; free if any boot is in the cart or on pickup.
  const hasBoot = validatedItems.some((it) => products.find((p) => p.stockNo === it.stockNo)?.category !== "Apparel");
  const hasApparel = validatedItems.some((it) => products.find((p) => p.stockNo === it.stockNo)?.category === "Apparel");
  const chargeApparelShipping = shippingMethod !== "pickup" && hasApparel && !hasBoot;

  // ── Pay-at-pickup: create the order directly, no Stripe. Collected in store. ──
  if (shippingMethod === "pickup" && payAtPickup) {
    const subtotal = validatedItems.reduce((s, it) => s + it.price * it.qty, 0);
    const tax = Math.round(subtotal * 0.06 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    const orderId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const shippingName = billing ? `${billing.firstName ?? ""} ${billing.lastName ?? ""}`.trim() || undefined : undefined;

    const customerId = billing?.email || billing?.phone
      ? await tryUpsertCustomer({
          name: shippingName, email: billing?.email, phone: billing?.phone,
          userId: userId || undefined, source: "web", purchaseAt: createdAt,
        })
      : undefined;

    await saveOrder({
      id: orderId,
      stripeSessionId: `pickup-${orderId}`,
      userId: userId || undefined,
      customerId,
      items: validatedItems.map((it) => ({ stockNo: it.stockNo, name: it.name, size: it.size, price: it.price, qty: it.qty })),
      total,
      status: "paid", // enters the board's "New" column; payment tracked separately via `paid`
      paid: false,
      shippingMethod: "pickup",
      createdAt,
      shippingName,
      shippingEmail: billing?.email,
      shippingPhone: billing?.phone,
    });
    await decrementInventory(validatedItems.map((it) => ({ stockNo: it.stockNo, size: it.size, qty: it.qty })));

    if (billing?.email) {
      try {
        await sendOrderConfirmationEmail({
          to: billing.email, name: shippingName,
          items: validatedItems.map((it) => ({ stockNo: it.stockNo, name: it.name, size: it.size, price: it.price, qty: it.qty })),
          total, orderId, payAtPickup: true,
        });
      } catch (err) { console.error("Pickup confirmation email failed:", err); }
    }
    try {
      await sendNewOrderAdminEmail({
        orderId,
        items: validatedItems.map((it) => ({ stockNo: it.stockNo, name: it.name, size: it.size, price: it.price, qty: it.qty })),
        total, customerName: shippingName, customerEmail: billing?.email, customerPhone: billing?.phone,
        baseUrl: env.NEXT_PUBLIC_BASE_URL,
      });
    } catch (err) { console.error("Pickup admin email failed:", err); }

    const res = NextResponse.json({ url: `${env.NEXT_PUBLIC_BASE_URL}/order/success?pickup=pending` });
    if (authCookie) res.cookies.set(authCookie);
    return res;
  }

  // US states with NO statewide sales tax ("NOMAD"): Delaware, Montana, New
  // Hampshire, Oregon, Alaska — don't charge tax when the order goes there.
  // Store pickups are always in Michigan, so those stay taxable.
  const NO_TAX_STATES = new Set([
    "de", "delaware", "mt", "montana", "nh", "new hampshire",
    "or", "oregon", "ak", "alaska",
  ]);
  const destState = (shippingMethod === "pickup" ? "MI" : billing?.state ?? "").trim().toLowerCase();
  const applyTax = destState !== "" ? !NO_TAX_STATES.has(destState) : true;
  const taxRateId = applyTax ? await getMiTaxRateId() : null;

  const session = await stripe.checkout.sessions.create({
    // Omit payment_method_types so Stripe enables every method turned on in the
    // Dashboard (card, Apple Pay, Google Pay, Link) — improves conversion.
    mode: "payment",
    // We generate our own branded invoice at /invoice/[orderId] and link it in the
    // confirmation email, so Stripe's paid-invoice fee (0.4%) is not incurred.
    line_items: validatedItems.map((item) => ({
      price_data: {
        currency: "usd",
        unit_amount: item.price * 100,
        product_data: { name: item.name, metadata: { stockNo: item.stockNo, size: item.size, addons: item.addons } },
      },
      quantity: item.qty,
      ...(taxRateId ? { tax_rates: [taxRateId] } : {}),
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
    // Force a full billing address (incl. state) so every generated invoice is complete.
    billing_address_collection: "required",
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
