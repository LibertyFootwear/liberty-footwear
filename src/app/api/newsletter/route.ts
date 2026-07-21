import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { addSubscriber } from "@/lib/newsletterDb";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`newsletter:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });
  }

  const { email } = await req.json() as { email: string };
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  // Persist the subscriber (idempotent) — don't fail signup if this errors
  try { await addSubscriber(email); } catch (err) { console.error("newsletter save failed", err); }

  try {
    await resend.emails.send({
      from: "Liberty Footwear <info@libertyfootwear.com>",
      to: email,
      subject: "Welcome to Liberty Footwear",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
          <div style="background:#0b3154;padding:24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px">Liberty Footwear</h1>
            <p style="color:#c4a882;margin:4px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase">Built in America</p>
          </div>
          <div style="padding:32px 24px">
            <h2 style="color:#0b3154">You're in!</h2>
            <p>Thanks for signing up. You'll be the first to hear about new styles, promotions, and boot care tips from Liberty Footwear.</p>
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/shop" style="display:inline-block;margin-top:16px;background:#d1282a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;text-transform:uppercase;letter-spacing:1px">Shop Now</a>
          </div>
          <div style="background:#f5f0e8;padding:16px 24px;text-align:center;font-size:12px;color:#888">
            © ${new Date().getFullYear()} Liberty Footwear · Built in America
          </div>
        </div>
      `,
    });

    // Also notify the shop owner
    await resend.emails.send({
      from: "Liberty Footwear <info@libertyfootwear.com>",
      to: "info@libertyfootwear.com",
      subject: `New newsletter subscriber: ${email}`,
      html: `<p>New subscriber: <strong>${email}</strong></p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
