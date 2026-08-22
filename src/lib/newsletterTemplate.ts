import { publicEnv } from "@/lib/publicEnv";

const NAVY = "#0b3154";
const RED = "#d1282a";

/** Canonical www host for absolute links inside emails. */
function siteBase(): string {
  try {
    const u = new URL(publicEnv.NEXT_PUBLIC_BASE_URL);
    if (u.hostname.split(".").length === 2) u.hostname = `www.${u.hostname}`;
    return u.origin;
  } catch {
    return "https://www.libertyfootwear.com";
  }
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Wrap composed newsletter body HTML in the branded Liberty Footwear shell:
 * colored header with logo, an optional "view in browser" link, and a footer
 * with contact details and an unsubscribe link (added automatically).
 */
export function renderNewsletterEmail(opts: { subject: string; bodyHtml: string; webUrl?: string }): string {
  const BASE = siteBase();
  const viewLink = opts.webUrl?.trim()
    ? `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
         <tr><td align="center" style="padding:0 0 12px;font-size:12px;color:#8a8a8a;">
           Not displaying correctly?
           <a href="${esc(opts.webUrl.trim())}" style="color:${NAVY};font-weight:bold;">Read it on our website &rarr;</a>
         </td></tr>
       </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>${esc(opts.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr><td align="center">
      ${viewLink}
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;">
        <tr>
          <td align="center" style="background:${NAVY};padding:26px 32px;">
            <a href="${BASE}"><img src="${BASE}/logo/logo-white.png" alt="Liberty Footwear" width="220" style="display:block;width:220px;max-width:60%;height:auto;border:0;"></a>
          </td>
        </tr>
        <tr>
          <td style="padding:30px 32px;font-size:16px;line-height:1.6;color:#333;">
            ${opts.bodyHtml}
          </td>
        </tr>
        <tr>
          <td align="center" style="background:#faf7f0;padding:24px 32px;border-top:1px solid #eee;">
            <a href="${BASE}/shop" style="display:inline-block;background:${RED};color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 34px;border-radius:8px;">Shop New Boots &rarr;</a>
          </td>
        </tr>
        <tr>
          <td style="background:${NAVY};padding:22px 32px;color:#cbd5e1;font-size:12px;line-height:1.6;">
            <p style="margin:0 0 4px;color:#ffffff;font-weight:bold;">Liberty Footwear · Built in America</p>
            <p style="margin:0 0 4px;">Grand Rapids, MI · 616.930.3060</p>
            <p style="margin:0;">
              <a href="${BASE}/shop" style="color:#f5c451;">Shop</a> &nbsp;·&nbsp;
              <a href="${BASE}/blog" style="color:#f5c451;">Blog</a> &nbsp;·&nbsp;
              <a href="${BASE}/contact" style="color:#f5c451;">Contact</a>
            </p>
            <p style="margin:12px 0 0;color:#8ba3bd;">You're receiving this because you signed up for Liberty Footwear updates.
              <a href="${BASE}/unsubscribe" style="color:#8ba3bd;text-decoration:underline;">Unsubscribe</a>.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
