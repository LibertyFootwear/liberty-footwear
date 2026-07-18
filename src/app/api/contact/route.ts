import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json() as {
    name: string; email: string; subject: string; message: string;
  };

  if (!name || name.length > 255) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (!message || message.length > 10000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  await resend.emails.send({
    from: "Liberty Footwear Website <hello@libertyfootwear.com>",
    to: "vojtech.kovarik05@gmail.com",
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
