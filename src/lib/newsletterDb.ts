import { getSupabase } from "./supabase";
import { defaultNotifications, type Notifications } from "./userTypes";

export interface Subscriber {
  email: string;
  createdAt: string;
}

export type EmailPref = keyof Notifications; // "newsletter" | "specialOffers" | "newProducts" | "blog"
const ALL_PREFS: EmailPref[] = ["newsletter", "specialOffers", "newProducts", "blog"];

/**
 * Stop the given email categories for an address. Handles both signup-form
 * subscribers (the newsletter list) and registered accounts (their notification
 * preferences). Pass "all" to unsubscribe from everything.
 */
export async function applyUnsubscribe(email: string, types: string[]): Promise<{ accountFound: boolean }> {
  const e = email.toLowerCase().trim();
  const db = getSupabase();
  const stop = new Set<EmailPref>(
    types.includes("all") ? ALL_PREFS : (types.filter((t) => (ALL_PREFS as string[]).includes(t)) as EmailPref[])
  );

  // Form-only newsletter list — remove when the newsletter is being stopped.
  if (stop.has("newsletter")) {
    await db.from("newsletter_subscribers").delete().eq("email", e);
  }

  // Registered account — flip the matching notification flags off.
  const { data } = await db.from("users").select("notifications").eq("email", e).limit(1);
  const user = (data ?? [])[0];
  if (!user) return { accountFound: false };

  const current = (user.notifications as Notifications) ?? defaultNotifications;
  const updated: Notifications = { ...defaultNotifications, ...current };
  for (const k of stop) updated[k] = false;

  const patch: Record<string, unknown> = { notifications: updated };
  if (stop.has("newsletter")) patch.newsletter = false;
  await db.from("users").update(patch).eq("email", e);

  return { accountFound: true };
}

export async function addSubscriber(email: string): Promise<void> {
  await getSupabase()
    .from("newsletter_subscribers")
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email", ignoreDuplicates: true });
}

export async function getSubscribers(): Promise<Subscriber[]> {
  const { data } = await getSupabase()
    .from("newsletter_subscribers")
    .select("email, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({ email: r.email as string, createdAt: r.created_at as string }));
}
