import { NextResponse } from "next/server";
import { getPopularStockNos } from "@/lib/popular";

export async function GET() {
  try {
    const stockNos = await getPopularStockNos(Date.now());
    return NextResponse.json({ stockNos });
  } catch {
    return NextResponse.json({ stockNos: [] });
  }
}
