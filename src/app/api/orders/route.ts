import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/authJwt";
import { getOrdersByUser } from "@/lib/ordersDb";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json([], { status: 401 });
  return NextResponse.json(getOrdersByUser(userId));
}
