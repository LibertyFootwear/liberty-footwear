import { NextRequest, NextResponse } from "next/server";
import { sendMail, type MailAttachment } from "@/lib/mailer";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

const MAX_FILES = 3;
const MAX_EACH = 5 * 1024 * 1024; // 5 MB decoded
const MAX_TOTAL = 10 * 1024 * 1024; // 10 MB decoded
const ALLOWED_TYPES = new Set([
  "image/png", "image/jpeg", "image/jpg", "image/webp", "image/heic", "application/pdf",
]);

type RawAttachment = { filename?: string; contentType?: string; base64?: string };

/** Validate and decode the client-supplied attachments. Returns null on any violation. */
function buildAttachments(raw: unknown): MailAttachment[] | null {
  if (raw == null) return [];
  if (!Array.isArray(raw) || raw.length > MAX_FILES) return null;
  const out: MailAttachment[] = [];
  let total = 0;
  for (const a of raw as RawAttachment[]) {
    if (!a?.base64 || typeof a.base64 !== "string") return null;
    const type = (a.contentType ?? "").toLowerCase();
    if (!ALLOWED_TYPES.has(type)) return null;
    let content: Buffer;
    try { content = Buffer.from(a.base64, "base64"); } catch { return null; }
    if (content.length === 0 || content.length > MAX_EACH) return null;
    total += content.length;
    if (total > MAX_TOTAL) return null;
    const filename = oneLine(a.filename ?? "attachment").slice(0, 200) || "attachment";
    out.push({ filename, content, contentType: type });
  }
  return out;
}

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

  const raw = await req.json() as { name: string; email: string; subject: string; message: string; attachments?: unknown };
  // Header-bound fields must be single-line; the message body may keep its newlines.
  const name = oneLine(raw.name ?? "");
  const email = (raw.email ?? "").trim();
  const subject = oneLine(raw.subject ?? "");
  const message = raw.message ?? "";

  if (!name || name.length > 255) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  if (!message || message.length > 10000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

  const attachments = buildAttachments(raw.attachments);
  if (attachments === null) {
    return NextResponse.json({ error: "Invalid attachment (allowed: images or PDF, up to 3 files, 5 MB each)." }, { status: 400 });
  }

  await sendMail({
    to: "info@libertyfootwear.com",
    replyTo: email,
    subject: `Contact form: ${esc(subject || "No subject")} – from ${esc(name)}`,
    html: `
      <p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p>
      <p><strong>Subject:</strong> ${esc(subject)}</p>
      ${attachments.length ? `<p><strong>Attachments:</strong> ${attachments.length}</p>` : ""}
      <hr/>
      <p>${esc(message).replace(/\n/g, "<br>")}</p>
    `,
    attachments: attachments.length ? attachments : undefined,
  });

  return NextResponse.json({ ok: true });
}
