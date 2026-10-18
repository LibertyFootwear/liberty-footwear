import { sendMail } from "./mailer";
import { ADMIN_NOTIFY_TO } from "./orderEmail";
import { publicEnv } from "./publicEnv";

export const SITE = publicEnv.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");

export interface Check { name: string; ok: boolean; detail?: string; ms?: number }

const NAVY = "#0b3154", RED = "#d1282a";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Timed fetch with no browser cache noise. Returns the response or null on network error. */
export async function safeFetch(url: string, init?: RequestInit): Promise<{ res: Response | null; ms: number; err?: string }> {
  const t = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store", redirect: "manual", ...init });
    return { res, ms: Date.now() - t };
  } catch (err) {
    return { res: null, ms: Date.now() - t, err: err instanceof Error ? err.message : String(err) };
  }
}

export async function expectOk(name: string, url: string, init?: RequestInit): Promise<Check> {
  const { res, ms, err } = await safeFetch(url, init);
  if (!res) return { name, ok: false, detail: `network error: ${err}`, ms };
  if (res.status >= 200 && res.status < 400) return { name, ok: true, ms };
  return { name, ok: false, detail: `HTTP ${res.status}`, ms };
}

/** Email the shop a summary — only when something is broken (unless `force`). */
export async function emailAlert(subject: string, checks: Check[], force = false): Promise<void> {
  const failed = checks.filter((c) => !c.ok);
  if (!failed.length && !force) return;
  const rows = checks.map((c) =>
    `<tr>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;color:${c.ok ? "#15803d" : RED};font-weight:${c.ok ? 600 : 800};">${c.ok ? "OK" : "FAIL"}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;color:${NAVY};">${esc(c.name)}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;color:#6b7280;font-size:12px;">${c.ms != null ? c.ms + " ms" : ""}</td>
       <td style="padding:6px 10px;border-bottom:1px solid #eee;color:#6b7280;font-size:12px;">${esc(c.detail ?? "")}</td>
     </tr>`).join("");
  await sendMail({
    to: ADMIN_NOTIFY_TO,
    subject: `${failed.length ? "⚠️ " : "✓ "}${subject}${failed.length ? ` — ${failed.length} failing` : ""}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;color:#1a1a1a">
      <h2 style="color:${NAVY};margin:0 0 8px">${esc(subject)}</h2>
      <p style="color:#6b7280;margin:0 0 16px;font-size:13px">${new Date().toISOString()} · ${SITE}</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
        <thead><tr style="background:#f9fafb"><th style="padding:6px 10px;text-align:left;color:#6b7280;font-size:11px;letter-spacing:1px">STATUS</th><th style="padding:6px 10px;text-align:left;color:#6b7280;font-size:11px;letter-spacing:1px">CHECK</th><th style="padding:6px 10px;text-align:left;color:#6b7280;font-size:11px;letter-spacing:1px">TIME</th><th style="padding:6px 10px;text-align:left;color:#6b7280;font-size:11px;letter-spacing:1px">DETAIL</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`,
  });
}
