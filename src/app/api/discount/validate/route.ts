import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/authJwt";
import { validateDiscount } from "@/lib/discounts";

/** Preview a discount code for the cart/checkout. Real discount is re-checked at checkout. */
export async function POST(req: NextRequest) {
  const { code, subtotal } = (await req.json()) as { code?: string; subtotal?: number };
  const userId = await getAuthUserId();
  const res = await validateDiscount(code ?? "", {
    userId,
    subtotal: typeof subtotal === "number" ? subtotal : 0,
  });
  if (!res.ok) return NextResponse.json({ ok: false, error: res.reason }, { status: 200 });
  return NextResponse.json({ ok: true, code: res.code?.code, label: res.label, discount: res.discount });
}
