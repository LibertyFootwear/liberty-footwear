import nodemailer, { type Transporter } from "nodemailer";

/**
 * Shared SMTP mailer (IONOS by default). Configure via env:
 *   SMTP_HOST  (default smtp.ionos.com)
 *   SMTP_PORT  (default 587 — STARTTLS; use 465 for implicit TLS)
 *   SMTP_USER  the mailbox address, e.g. orders@libertyfootwear.com
 *   SMTP_PASS  the mailbox password
 *
 * IONOS requires the From address to match the authenticated mailbox, so the
 * default From uses SMTP_USER.
 */

let _transport: Transporter | null = null;

function getTransport(): Transporter {
  if (_transport) return _transport;
  const host = process.env.SMTP_HOST || "smtp.ionos.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  _transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return _transport;
}

export const MAIL_FROM =
  process.env.ORDER_EMAIL_FROM ||
  `Liberty Footwear <${process.env.SMTP_USER || "info@libertyfootwear.com"}>`;

export interface MailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  /** Set for inline images referenced in HTML as cid:<value>. */
  cid?: string;
}

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
}

/** Send an email via SMTP. Throws on failure — wrap in try/catch in flows that must not break. */
export async function sendMail(input: SendMailInput): Promise<void> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP_USER / SMTP_PASS not set — skipping email send");
    return;
  }
  await getTransport().sendMail({
    from: input.from ?? MAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
    attachments: input.attachments,
  });
}
