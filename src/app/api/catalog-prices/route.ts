import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export const dynamic = "force-dynamic";

/** Public map of stockNo → current catalog price (with admin overrides applied),
 *  plus the list of stockNos hidden in the admin panel, so client-rendered
 *  surfaces (homepage featured, account recently-viewed/recommended) show the
 *  live price and drop hidden products, not the static bundle. */
export async function GET() {
  try {
    const catalog = await getCatalog(true);
    const prices: Record<string, number> = {};
    const hidden: string[] = [];
    for (const p of catalog) {
      prices[p.stockNo] = p.price;
      if (p.hidden) hidden.push(p.stockNo);
    }
    return NextResponse.json({ prices, hidden });
  } catch {
    return NextResponse.json({ prices: {}, hidden: [] });
  }
}
