import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";
import { createQuoContact, quoEnabled } from "@/lib/quo";

export const maxDuration = 60;

const MAX_PER_RUN = 250;      // stay within the 60s budget
const DELAY_MS = 120;         // ~8 req/s — under Quo's rate limit
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Push customers (with a phone, not yet in Quo) into Quo Contacts, grouped by
 * source "Liberty Footwear". Idempotent via customers.quo_contact_id — safe to
 * run repeatedly; each run also picks up newly-added customers. Returns progress.
 */
export async function POST() {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  if (!quoEnabled) return NextResponse.json({ error: "Quo is not configured yet." }, { status: 400 });

  const sb = getSupabase();
  const { data, error } = await sb
    .from("customers")
    .select("id, name, email, phone, employer")
    .is("quo_contact_id", null)
    .not("phone", "is", null)
    .limit(MAX_PER_RUN + 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const batch = (data ?? []).slice(0, MAX_PER_RUN);
  const more = (data ?? []).length > MAX_PER_RUN;

  let synced = 0, failed = 0;
  for (const c of batch) {
    const name = String(c.name ?? "").trim();
    const [firstName, ...rest] = name.split(/\s+/);
    const res = await createQuoContact({
      firstName: firstName || name || "Customer",
      lastName: rest.join(" ") || null,
      company: (c.employer as string) ?? null,
      phone: (c.phone as string) ?? null,
      email: (c.email as string) ?? null,
      externalId: c.id as string,
    });
    if (res.ok && res.id) {
      await sb.from("customers").update({ quo_contact_id: res.id }).eq("id", c.id);
      synced++;
    } else {
      failed++;
    }
    await sleep(DELAY_MS);
  }

  return NextResponse.json({ ok: true, synced, failed, more });
}
