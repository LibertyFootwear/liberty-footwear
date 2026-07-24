import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminByEmail } from "@/lib/adminDb";
import { signAdminToken, setAdminCookie } from "@/lib/adminJwt";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!checkRateLimit(`admin-login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const { email, password } = await req.json();
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const admin = await getAdminByEmail(email.trim());
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }

  const token = await signAdminToken({ adminId: admin.id });
  const res = NextResponse.json({ ok: true, name: admin.name });
  res.cookies.set(setAdminCookie(token));
  return res;
}
