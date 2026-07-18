import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/userDb";
import { signToken, setAuthCookie } from "@/lib/authJwt";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  const { email, password } = await req.json();
  const user = await getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
  }
  const token = await signToken({ userId: user.id });
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(setAuthCookie(token));
  return res;
}
