import { NextRequest, NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { sendMail } from "@/lib/mailer";
import { getSubscribers } from "@/lib/newsletterDb";
import { getSupabase } from "@/lib/supabase";
import { defaultNotifications, type Notifications } from "@/lib/userDb";

export const maxDuration = 60;

/** Every opted-in recipient: signup-form subscribers + accounts with the newsletter flag on. */
async function recipients(): Promise<string[]> {
  const set = new Set<string>();
  const subs = await getSubscribers();
  subs.forEach((s) => set.add(s.email.toLowerCase().trim()));

  const { data: users } = await getSupabase().from("users").select("email, newsletter, notifications");
  for (const u of users ?? []) {
    const n = (u.notifications as Notifications) ?? defaultNotifications;
    if (n.newsletter || (u.newsletter as boolean)) set.add((u.email as string).toLowerCase().trim());
  }
  return [...set];
}

export async function POST(req: NextRequest) {
  try { await assertAdmin(); } catch { return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); }

  const { subject, html } = await req.json() as { subject?: string; html?: string };
  if (!subject?.trim() || !html?.trim()) {
    return NextResponse.json({ error: "Subject and HTML body are required." }, { status: 400 });
  }

  const to = await recipients();
  if (to.length === 0) return NextResponse.json({ error: "No subscribers to send to." }, { status: 400 });

  let sent = 0;
  const failed: string[] = [];
  for (const addr of to) {
    try {
      await sendMail({ to: addr, subject: subject.trim(), html });
      sent++;
    } catch (err) {
      console.error("newsletter send failed for", addr, err);
      failed.push(addr);
    }
  }

  return NextResponse.json({ ok: true, sent, failed: failed.length, total: to.length });
}
