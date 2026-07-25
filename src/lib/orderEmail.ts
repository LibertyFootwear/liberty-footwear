import { readFileSync } from "fs";
import path from "path";
import { sendMail, type MailAttachment } from "./mailer";
import { trackingUrl, type OrderItem } from "./ordersDb";

const NAVY = "#0b3154";
const RED = "#d1282a";
const LOGO_CID = "lf-logo";

/** Read the white logo from /public once and cache its base64 (null if unreadable). */
let _logoBase64: string | null | undefined;
function getLogoBase64(): string | null {
  if (_logoBase64 !== undefined) return _logoBase64;
  try {
    const file = path.join(process.cwd(), "public", "logo", "logo-white.png");
    _logoBase64 = readFileSync(file).toString("base64");
  } catch (err) {
    console.error("Email logo not found — falling back to text header:", err);
    _logoBase64 = null;
  }
  return _logoBase64;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const money = (n: number) => `$${n.toFixed(2)}`;

/** Branded outer shell: navy header with logo + footer. `inner` fills the body cell. */
function shell(logoSrc: string | undefined, inner: string): string {
  const header = logoSrc
    ? `<img src="${esc(logoSrc)}" alt="Liberty Footwear" width="220" style="display:block;width:220px;max-width:60%;height:auto;border:0;">`
    : `<span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">LIBERTY FOOTWEAR</span>`;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr><td style="background:${NAVY};padding:28px 32px;">
          ${header}
          <div style="width:44px;height:3px;background:${RED};margin-top:14px;"></div>
        </td></tr>
        <tr><td style="padding:32px;">${inner}</td></tr>
        <tr><td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #eee;">
          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
            Liberty Footwear · Built in America · Grand Rapids, MI<br>
            Questions? Reply to this email or contact info@libertyfootwear.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Line-item rows for an order summary table. */
function itemRows(items: OrderItem[]): string {
  return items
    .map((it) => {
      const line = (it.price ?? 0) * (it.qty ?? 1);
      const size = it.size ? `<span style="color:#6b7280;font-size:13px;"> · Size ${esc(it.size)}</span>` : "";
      return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #eee;">
            <strong style="color:${NAVY};">${esc(it.name)}</strong>${size}<br>
            <span style="color:#9ca3af;font-size:12px;">${esc(it.stockNo)} · Qty ${it.qty}</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #eee;text-align:right;color:${NAVY};white-space:nowrap;">
            ${money(line)}
          </td>
        </tr>`;
    })
    .join("");
}

function itemsTable(items: OrderItem[], total?: number): string {
  const totalRow =
    total !== undefined
      ? `<tr>
           <td style="padding:16px 0 0;text-align:right;color:${NAVY};font-size:16px;font-weight:800;">Total</td>
           <td style="padding:16px 0 0;text-align:right;color:${NAVY};font-size:16px;font-weight:800;white-space:nowrap;">${money(total)}</td>
         </tr>`
      : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows(items)}${totalRow}</table>`;
}

// ── Order confirmation (sent on payment) ───────────────────────────────────

export interface OrderConfirmationEmail {
  to: string;
  name?: string;
  items: OrderItem[];
  total: number;
  orderId: string;
  /** Stripe-hosted invoice page, linked as a fallback / for online viewing. */
  invoiceUrl?: string;
  /** Invoice PDF to attach directly to the email. */
  invoicePdf?: { filename: string; base64: string };
  /** Value for the logo <img> src (a cid: ref for real mail, a data: URI for previews). */
  logoSrc?: string;
  /** Override the sender address (defaults to FROM). Used for testing before domain verification. */
  from?: string;
}

export function buildOrderEmailHtml(o: OrderConfirmationEmail): string {
  const invoiceLink = o.invoiceUrl
    ? `<p style="font-size:13px;color:#6b7280;margin:18px 0 0;">Your invoice is attached to this email. You can also <a href="${esc(o.invoiceUrl)}" style="color:${RED};">view it online</a>.</p>`
    : `<p style="font-size:13px;color:#6b7280;margin:18px 0 0;">Your invoice is attached to this email.</p>`;

  const inner = `
    <h1 style="margin:0 0 6px;color:${NAVY};font-size:22px;">Thank you${o.name ? `, ${esc(o.name.split(" ")[0])}` : ""}!</h1>
    <p style="margin:0 0 4px;color:#374151;font-size:15px;">We've received your payment and your order is confirmed. We'll email you again as soon as we start preparing it for shipment.</p>
    <p style="margin:0 0 22px;color:#9ca3af;font-size:12px;">Order #${esc(o.orderId.slice(0, 8))}</p>
    ${itemsTable(o.items, o.total)}
    ${invoiceLink}`;
  return shell(o.logoSrc, inner);
}

/**
 * Send the branded order-confirmation email with the invoice PDF attached.
 * Throws on failure — callers in the purchase flow should wrap in try/catch so
 * a mail hiccup never breaks order fulfillment.
 */
export async function sendOrderConfirmationEmail(o: OrderConfirmationEmail): Promise<void> {
  const logo = getLogoBase64();
  const attachments: MailAttachment[] = [];
  if (logo) attachments.push({ filename: "logo.png", content: Buffer.from(logo, "base64"), cid: LOGO_CID, contentType: "image/png" });
  if (o.invoicePdf) attachments.push({ filename: o.invoicePdf.filename, content: Buffer.from(o.invoicePdf.base64, "base64"), contentType: "application/pdf" });

  await sendMail({
    to: o.to,
    from: o.from,
    subject: `Your Liberty Footwear order #${o.orderId.slice(0, 8)}`,
    html: buildOrderEmailHtml({ ...o, logoSrc: logo ? `cid:${LOGO_CID}` : undefined }),
    attachments,
  });
}

// ── Order status updates (sent from the admin panel) ────────────────────────

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderStatusEmail {
  to: string;
  name?: string;
  orderId: string;
  status: OrderStatus;
  items?: OrderItem[];
  total?: number;
  carrier?: string;
  trackingNumber?: string;
  logoSrc?: string;
  /** Override the sender address (defaults to FROM). Used for testing before domain verification. */
  from?: string;
}

const STATUS_COPY: Record<OrderStatus, { subject: (n: string) => string; heading: string; body: string }> = {
  processing: {
    subject: (n) => `We're preparing your Liberty Footwear order #${n}`,
    heading: "We've received your order",
    body: "Thanks! Your order has been received and our team is preparing it for shipment. We'll email you again as soon as it ships.",
  },
  shipped: {
    subject: (n) => `Your Liberty Footwear order #${n} has shipped`,
    heading: "Your order is on its way!",
    body: "Good news — your order has shipped and is heading your way.",
  },
  delivered: {
    subject: (n) => `Your Liberty Footwear order #${n} was delivered`,
    heading: "Your order has been delivered",
    body: "Your order has been delivered. We hope you love your new boots — thank you for choosing Liberty Footwear!",
  },
  cancelled: {
    subject: (n) => `Your Liberty Footwear order #${n} was cancelled`,
    heading: "Your order has been cancelled",
    body: "Your order has been cancelled. If you have any questions or believe this was a mistake, just reply to this email and we'll help.",
  },
};

export function buildStatusEmailHtml(o: OrderStatusEmail): string {
  const copy = STATUS_COPY[o.status];
  const shortId = o.orderId.slice(0, 8);

  let trackingBlock = "";
  if (o.status === "shipped" && o.trackingNumber) {
    const link = trackingUrl(o.carrier, o.trackingNumber);
    trackingBlock = `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;">
        <tr><td style="background:#f9fafb;border:1px solid #eee;border-radius:8px;padding:16px 20px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Tracking${o.carrier ? ` · ${esc(o.carrier)}` : ""}</p>
          <p style="margin:0 0 12px;color:${NAVY};font-size:16px;font-weight:700;">${esc(o.trackingNumber)}</p>
          <a href="${esc(link)}" style="display:inline-block;background:${RED};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:10px 18px;border-radius:6px;">Track your package →</a>
        </td></tr>
      </table>`;
  }

  const summary = o.items?.length ? itemsTable(o.items, o.total) : "";

  const inner = `
    <h1 style="margin:0 0 8px;color:${NAVY};font-size:22px;">${copy.heading}${o.name ? `, ${esc(o.name.split(" ")[0])}` : ""}</h1>
    <p style="margin:0 0 4px;color:#374151;font-size:15px;line-height:1.6;">${copy.body}</p>
    <p style="margin:0 0 18px;color:#9ca3af;font-size:12px;">Order #${esc(shortId)}</p>
    ${trackingBlock}
    ${summary}`;
  return shell(o.logoSrc, inner);
}

/**
 * Send a branded order-status email (preparing / shipped / delivered / cancelled).
 * Throws on failure — callers should wrap in try/catch so a mail hiccup never
 * blocks the status update itself.
 */
export async function sendOrderStatusEmail(o: OrderStatusEmail): Promise<void> {
  const logo = getLogoBase64();
  const attachments: MailAttachment[] = logo
    ? [{ filename: "logo.png", content: Buffer.from(logo, "base64"), cid: LOGO_CID, contentType: "image/png" }]
    : [];

  await sendMail({
    to: o.to,
    from: o.from,
    subject: STATUS_COPY[o.status].subject(o.orderId.slice(0, 8)),
    html: buildStatusEmailHtml({ ...o, logoSrc: logo ? `cid:${LOGO_CID}` : undefined }),
    attachments,
  });
}
