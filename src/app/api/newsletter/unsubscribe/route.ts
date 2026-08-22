import { NextRequest, NextResponse } from "next/server";
import { removeSubscriber } from "@/lib/newsletterDb";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`unsub:${clientIp(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  const { email } = await req.json() as { email: string };
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await removeSubscriber(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("unsubscribe failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
