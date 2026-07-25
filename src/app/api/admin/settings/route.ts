import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { getSiteSettings, updateSiteSettings } from "@/lib/siteSettings";

export async function GET() {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  return NextResponse.json(await getSiteSettings());
}

export async function PATCH(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const b = await req.json();
  const fields: Record<string, unknown> = {};
  if (b.salesEnabled !== undefined) fields.salesEnabled = Boolean(b.salesEnabled);
  if (b.pausedMessage !== undefined) fields.pausedMessage = String(b.pausedMessage);
  if (b.contactPhone !== undefined) fields.contactPhone = String(b.contactPhone);
  await updateSiteSettings(fields);
  return NextResponse.json({ ok: true, settings: await getSiteSettings() });
}
