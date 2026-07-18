import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/userDb";
import { signToken, setAuthCookie } from "@/lib/authJwt";

export async function POST(req: NextRequest) {
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
