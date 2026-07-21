import { NextRequest, NextResponse } from "next/server";
import { getReviews, getReviewsByUser, addReview } from "@/lib/reviewsDb";
import { getAuthUserId } from "@/lib/authJwt";
import { getUserById } from "@/lib/userDb";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const stockNo = req.nextUrl.searchParams.get("stockNo");
  const mine = req.nextUrl.searchParams.get("mine");

  if (mine === "1") {
    const userId = await getAuthUserId();
    if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    return NextResponse.json(await getReviewsByUser(userId));
  }

  if (!stockNo) return NextResponse.json({ error: "Missing stockNo" }, { status: 400 });
  return NextResponse.json(await getReviews(stockNo));
}

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`review:${clientIp(req)}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many reviews. Please try again in a minute." }, { status: 429 });
  }

  const userId = await getAuthUserId();
  const { stockNo, author, rating, text } = await req.json();

  if (!stockNo || typeof stockNo !== "string") return NextResponse.json({ error: "Invalid stockNo" }, { status: 400 });
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  if (!text || text.length < 5 || text.length > 2000) return NextResponse.json({ error: "Invalid text" }, { status: 400 });

  let resolvedAuthor = author;
  if (userId) {
    const user = await getUserById(userId);
    if (user) resolvedAuthor = user.name;
  }
  if (!resolvedAuthor || resolvedAuthor.length > 100) return NextResponse.json({ error: "Invalid author" }, { status: 400 });

  const review = await addReview({
    stockNo,
    userId: userId ?? undefined,
    author: esc(resolvedAuthor.trim()),
    rating: Number(rating),
    text: esc(text.trim()),
  });

  return NextResponse.json(review, { status: 201 });
}
