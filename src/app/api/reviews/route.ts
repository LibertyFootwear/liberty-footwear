import { NextRequest, NextResponse } from "next/server";
import { getReviews, addReview } from "@/lib/reviewsDb";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET(req: NextRequest) {
  const stockNo = req.nextUrl.searchParams.get("stockNo");
  if (!stockNo) return NextResponse.json({ error: "Missing stockNo" }, { status: 400 });
  return NextResponse.json(await getReviews(stockNo));
}

export async function POST(req: NextRequest) {
  const { stockNo, author, rating, text } = await req.json();

  if (!stockNo || typeof stockNo !== "string") return NextResponse.json({ error: "Invalid stockNo" }, { status: 400 });
  if (!author || author.length > 100) return NextResponse.json({ error: "Invalid author" }, { status: 400 });
  if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  if (!text || text.length < 5 || text.length > 2000) return NextResponse.json({ error: "Invalid text" }, { status: 400 });

  const review = await addReview({
    stockNo,
    author: esc(author.trim()),
    rating: Number(rating),
    text: esc(text.trim()),
  });

  return NextResponse.json(review, { status: 201 });
}
