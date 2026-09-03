import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { assertAdmin } from "@/lib/adminAuth";

const clean = (v: unknown) => {
  const s = String(v ?? "").replace(/\s+/g, " ").trim();
  return s === "" ? null : s;
};

/**
 * Upsert a company by its normalised name (lower(trim(name))). Used both to add
 * a brand-new company and to attach details to one that so far only existed as an
 * aggregated employer. Renaming makes a new record (name is the key) — delete the
 * old one if needed.
 */
export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  const name = clean(b.name);
  if (!name) return NextResponse.json({ error: "Company name is required" }, { status: 400 });

  const row = {
    name,
    name_norm: name.toLowerCase(),
    contact_person: clean(b.contactPerson),
    phone: clean(b.phone),
    email: clean(b.email),
    address: clean(b.address),
    notes: clean(b.notes),
  };

  const { error } = await getSupabase()
    .from("companies")
    .upsert(row, { onConflict: "name_norm" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await getSupabase().from("companies").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
