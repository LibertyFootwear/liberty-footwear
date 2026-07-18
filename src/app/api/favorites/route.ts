import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/authJwt";
import { getUserById, updateFavorites } from "@/lib/userDb";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ favorites: [] });
  const user = await getUserById(userId);
  return NextResponse.json({ favorites: user?.favorites ?? [] });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { slug } = await req.json();
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const favorites = user.favorites.includes(slug)
    ? user.favorites.filter((s) => s !== slug)
    : [...user.favorites, slug];
  await updateFavorites(userId, favorites);
  return NextResponse.json({ favorites });
}
