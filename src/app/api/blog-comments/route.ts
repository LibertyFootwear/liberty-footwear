import { NextRequest, NextResponse } from "next/server";
import { getComments, addComment } from "@/lib/commentsDb";
import { getAuthUserId } from "@/lib/authJwt";
import { getUserById } from "@/lib/userDb";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  return NextResponse.json(await getComments(slug));
}

export async function POST(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 401 });

  const { slug, text } = await req.json();
  if (!slug || typeof slug !== "string") return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  if (!text || text.length < 2 || text.length > 2000) return NextResponse.json({ error: "Invalid text" }, { status: 400 });

  const comment = await addComment({
    slug,
    author: esc(user.name ?? user.email),
    text: esc(text.trim()),
  });

  return NextResponse.json(comment, { status: 201 });
}
