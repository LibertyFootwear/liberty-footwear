import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

/**
 * Shared SMTP mailer. Configure via env (see src/lib/env.ts):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ORDER_EMAIL_FROM
 *
 * IONOS requires the From address to match the authenticated mailbox, so
 * ORDER_EMAIL_FROM should use the same mailbox as SMTP_USER.
 */

let _transport: Transporter | null = null;

function getTransport(): Transporter {
  if (_transport) return _transport;
  const port = env.SMTP_PORT;
  _transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return _transport;
}

export const MAIL_FROM = env.ORDER_EMAIL_FROM;

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
  await getTransport().sendMail({
    from: input.from ?? MAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    replyTo: input.replyTo,
    attachments: input.attachments,
  });
}
