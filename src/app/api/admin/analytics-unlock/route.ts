import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { verifyPasscode, unlockCookie } from "@/lib/analyticsLock";

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }
  const { code } = await req.json().catch(() => ({ code: "" }));
  if (!verifyPasscode(String(code ?? ""))) {
    return NextResponse.json({ error: "Wrong code" }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(unlockCookie());
  return res;
}
