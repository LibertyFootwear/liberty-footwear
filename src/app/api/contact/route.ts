import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Collapse CR/LF so values used in email headers can't inject extra headers. */
function oneLine(s: string) {
  return s.replace(/[\r\n]+/g, " ").trim();
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`contact:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many messages. Please try again in a minute." }, { status: 429 });
  }

  const raw = await req.json() as { name: string; email: string; subject: string; message: string };
  // Header-bound fields must be single-line; the message body may keep its newlines.
  const name = oneLine(raw.name ?? "");
  const email = (raw.email ?? "").trim();
  const subject = oneLine(raw.subject ?? "");
  const message = raw.message ?? "";

  if (!name || name.length > 255) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (!message || message.length > 10000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  await sendMail({
    to: "info@libertyfootwear.com",
    replyTo: email,
    subject: `Contact form: ${esc(subject || "No subject")} – from ${esc(name)}`,
    html: `
      <p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
      <p><strong>Subject:</strong> ${esc(subject)}</p>
      <hr/>
      <p>${esc(message).replace(/\n/g, "<br>")}</p>
    `,
  });

  return NextResponse.json({ ok: true });
}
