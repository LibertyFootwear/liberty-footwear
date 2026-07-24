import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { password } = await req.json();
  if (!process.env.ANALYTICS_PASSWORD || password !== process.env.ANALYTICS_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "lf_analytics",
    value: "1",
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
    sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: "lf_analytics", value: "", httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
