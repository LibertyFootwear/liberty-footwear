import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/authJwt";
import { getUserById } from "@/lib/userDb";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json(null);
  const user = await getUserById(userId);
  if (!user) return NextResponse.json(null);
  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    newsletter: user.newsletter ?? false,
    favorites: user.favorites,
  });
}
