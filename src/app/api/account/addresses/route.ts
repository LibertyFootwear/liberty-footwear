import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/authJwt";
import { getUserById, updateUser, SavedAddress } from "@/lib/userDb";
import crypto from "crypto";

export async function GET() {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const user = await getUserById(userId);
  return NextResponse.json(user?.addresses ?? []);
}

export async function PUT(req: NextRequest) {
  const userId = await getAuthUserId();
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { addresses } = await req.json() as { addresses: SavedAddress[] };
  if (!Array.isArray(addresses)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  const clean: SavedAddress[] = addresses.slice(0, 20).map((a) => ({
    id: a.id || crypto.randomUUID(),
    label: (a.label || "Address").toString().slice(0, 40).trim(),
    line1: (a.line1 || "").toString().slice(0, 120).trim(),
    city: (a.city || "").toString().slice(0, 80).trim(),
    state: (a.state || "").toString().slice(0, 40).trim(),
    zip: (a.zip || "").toString().slice(0, 20).trim(),
    country: (a.country || "US").toString().slice(0, 4).trim(),
    isDefault: !!a.isDefault,
  })).filter((a) => a.line1 && a.city && a.state && a.zip);

  // Exactly one default (first one if none marked)
  if (clean.length && !clean.some((a) => a.isDefault)) clean[0].isDefault = true;
  let seenDefault = false;
  for (const a of clean) {
    if (a.isDefault && !seenDefault) seenDefault = true;
    else a.isDefault = false;
  }

  await updateUser(userId, { addresses: clean });
  return NextResponse.json(clean);
}
