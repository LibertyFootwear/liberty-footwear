import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/userDb";
import { signToken, setAuthCookie } from "@/lib/authJwt";

export async function POST(req: NextRequest) {
  const { name, email, password, phone } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
  }
  if (await getUserByEmail(email)) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ name, email, phone: phone ?? "", passwordHash, newsletter: false });

  const token = await signToken({ userId: user.id });
  const res = NextResponse.json({ ok: true, name: user.name });
  res.cookies.set(setAuthCookie(token));
  return res;
}
