import { NextRequest, NextResponse } from "next/server";
import { applyUnsubscribe } from "@/lib/newsletterDb";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`unsub:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  const { email, types } = await req.json() as { email: string; types?: string[] };
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!Array.isArray(types) || types.length === 0) {
    return NextResponse.json({ error: "Please choose what to unsubscribe from." }, { status: 400 });
  }

  try {
    const { accountFound } = await applyUnsubscribe(email, types);
    return NextResponse.json({ ok: true, accountFound });
  } catch (err) {
    console.error("unsubscribe failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
