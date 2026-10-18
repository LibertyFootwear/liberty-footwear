import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";

/**
 * Add one or more addresses to the newsletter list (manual add from admin, or import of old-site
 * contacts). Idempotent — existing emails are kept, duplicates ignored. Everyone added here is
 * included in the newsletter recipient list automatically.
 */
export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { emails, source } = await req.json().catch(() => ({})) as { emails?: unknown; source?: string };

  const list = Array.isArray(emails) ? emails : typeof emails === "string" ? [emails] : [];
  const clean = [...new Set(list
    .flatMap((v) => String(v ?? "").split(/[\s,;]+/))
    .map((s) => s.toLowerCase().trim())
    .filter((e) => e.length > 2 && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))];

  if (clean.length === 0) return NextResponse.json({ error: "No valid email addresses." }, { status: 400 });

  const src = (source ?? "manual").toString().slice(0, 32) || "manual";
  // Try with a `source` column; fall back to plain upsert if the column isn't there yet.
  let { error } = await getSupabase()
    .from("newsletter_subscribers")
    .upsert(clean.map((email) => ({ email, source: src })), { onConflict: "email", ignoreDuplicates: true });
  if (error && /column .*source/i.test(error.message)) {
    ({ error } = await getSupabase()
      .from("newsletter_subscribers")
      .upsert(clean.map((email) => ({ email })), { onConflict: "email", ignoreDuplicates: true }));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, added: clean.length, source: src });
}
