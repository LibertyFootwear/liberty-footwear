import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { products } from "@/data/products";
import { SITE, expectOk, emailAlert, safeFetch, type Check } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Hourly health check: homepage, shop, one product, and a fake checkout call that must come
 * back with a Stripe redirect URL — proves the full order path works without charging anything.
 * Emails info@libertyfootwear.com when any check fails. Secured by CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Pick a stable, in-catalog boot — the first visible one with an image & price.
  const sample = products.find((p) => !p.hidden && p.image && p.price > 0) ?? products[0];

  const checks: Check[] = [];
  checks.push(await expectOk("Homepage", `${SITE}/`));
  checks.push(await expectOk("Shop listing", `${SITE}/shop`));
  checks.push(await expectOk(`Product page (${sample.stockNo})`, `${SITE}/shop/${sample.slug}`));
  checks.push(await expectOk("Sitemap", `${SITE}/sitemap.xml`));
  checks.push(await expectOk("Robots", `${SITE}/robots.txt`));

  // Simulated checkout — hits our /api/checkout with a real cart; a valid Stripe session URL back = pass.
  // Nothing is charged: we never visit the Stripe URL. The call records no order (no payment event).
  {
    const body = {
      items: [{ stockNo: sample.stockNo, name: sample.name, size: "M 9", price: sample.price, qty: 1 }],
      shippingMethod: "ship",
      billing: { firstName: "Monitor", lastName: "Bot", email: "monitor@libertyfootwear.com", phone: "6169303060",
        address: "1750 Alpine Ave NW", city: "Grand Rapids", state: "MI", zip: "49504", country: "US" },
    };
    const { res, ms } = await safeFetch(`${SITE}/api/checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = res ? await res.json().catch(() => ({})) : {};
    const url = (data as { url?: string }).url ?? "";
    const okUrl = /^https:\/\/checkout\.stripe\.com\//.test(url);
    checks.push({ name: "Checkout → Stripe redirect", ok: okUrl, ms,
      detail: okUrl ? "" : `HTTP ${res?.status ?? "?"} ${(data as { error?: string }).error ?? url ?? ""}`.trim() });
  }

  await emailAlert("Hourly health check", checks);
  const failed = checks.filter((c) => !c.ok).length;
  return NextResponse.json({ ok: failed === 0, failed, total: checks.length, checks });
}
