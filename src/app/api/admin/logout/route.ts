import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/adminJwt";
import { clearUnlockCookie } from "@/lib/analyticsLock";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearAdminCookie());
  res.cookies.set(clearUnlockCookie());
  return res;
}
