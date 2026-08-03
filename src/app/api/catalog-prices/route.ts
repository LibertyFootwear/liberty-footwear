import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Public map of stockNo → current catalog price (with admin overrides applied),
 *  so client-rendered surfaces (homepage featured) show the live price, not the
 *  static base price baked into the bundle. */
export async function GET() {
  try {
    const catalog = await getCatalog(true);
    const prices: Record<string, number> = {};
    for (const p of catalog) prices[p.stockNo] = p.price;
    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: {} });
  }
}
