import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthUserId } from "@/lib/authJwt";
import { getUserById, getUserByEmail, updateUser } from "@/lib/userDb";

export async function PATCH(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const body = await req.json();
  const updates: Parameters<typeof updateUser>[1] = {};

  if (body.name !== undefined) {
    if (!body.name || body.name.trim().length < 1) return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    updates.name = body.name.trim();
  }

  if (body.email !== undefined) {
    const email = body.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    const existing = await getUserByEmail(email);
    if (existing && existing.id !== userId) return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    updates.email = email;
  }

  if (body.phone !== undefined) updates.phone = body.phone.trim();
  if (body.newsletter !== undefined) updates.newsletter = Boolean(body.newsletter);

  if (body.currentPassword !== undefined || body.newPassword !== undefined) {
    if (!body.currentPassword || !body.newPassword) return NextResponse.json({ error: "Both current and new password required" }, { status: 400 });
    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    if (body.newPassword.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
    updates.passwordHash = await bcrypt.hash(body.newPassword, 10);
  }

  await updateUser(userId, updates);

  const updated = await getUserById(userId);
  return NextResponse.json({
    name: updated!.name,
    email: updated!.email,
    phone: updated!.phone,
    newsletter: updated!.newsletter,
  });
}
