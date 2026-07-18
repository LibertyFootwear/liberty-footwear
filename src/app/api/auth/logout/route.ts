import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/authJwt";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(clearAuthCookie());
  return res;
}
