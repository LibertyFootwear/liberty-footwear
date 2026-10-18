import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { SITE, safeFetch, emailAlert, type Check } from "@/lib/monitor";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily link check: pull sitemap.xml, HEAD each URL, email any broken (non-2xx/3xx) ones.
 * Secured by CRON_SECRET; same host only (never crawls off-site).
 */
export async function GET(req: NextRequest) {
  if (!env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { res } = await safeFetch(`${SITE}/sitemap.xml`);
  if (!res || !res.ok) {
    await emailAlert("Daily link check", [{ name: "Load sitemap.xml", ok: false, detail: `HTTP ${res?.status ?? "network"}` }]);
    return NextResponse.json({ ok: false, error: "Could not load sitemap" }, { status: 500 });
  }
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => u.startsWith(SITE));

  const failed: Check[] = [];
  const CONC = 8;
  for (let i = 0; i < urls.length; i += CONC) {
    const batch = urls.slice(i, i + CONC);
    const results = await Promise.all(batch.map(async (url): Promise<Check> => {
      // HEAD first (cheap); fall back to GET for servers that don't allow HEAD.
      let r = await safeFetch(url, { method: "HEAD" });
      if (r.res && r.res.status === 405) r = await safeFetch(url);
      if (!r.res) return { name: url, ok: false, detail: `network: ${r.err}`, ms: r.ms };
      const code = r.res.status;
      return { name: url, ok: code >= 200 && code < 400, detail: `HTTP ${code}`, ms: r.ms };
    }));
    for (const c of results) if (!c.ok) failed.push(c);
  }

  if (failed.length) await emailAlert(`Daily link check — ${failed.length} broken`, failed, true);
  return NextResponse.json({ ok: failed.length === 0, checked: urls.length, failed: failed.length });
}
