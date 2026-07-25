import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/siteSettings";

export const dynamic = "force-dynamic";

// Public read: the storefront uses this to know whether ordering is paused.
export async function GET() {
  const s = await getSiteSettings();
  return NextResponse.json(s);
}
