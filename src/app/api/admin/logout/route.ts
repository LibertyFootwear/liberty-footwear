import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/adminJwt";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearAdminCookie());
  return res;
}
