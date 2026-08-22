import { getSupabase } from "./supabase";

export interface Subscriber {
  email: string;
  createdAt: string;
}

export async function addSubscriber(email: string): Promise<void> {
  await getSupabase()
    .from("newsletter_subscribers")
    .upsert({ email: email.toLowerCase().trim() }, { onConflict: "email", ignoreDuplicates: true });
}

/** Remove a subscriber. Also clears the newsletter flag on any matching account. */
export async function removeSubscriber(email: string): Promise<void> {
  const e = email.toLowerCase().trim();
  const db = getSupabase();
  await db.from("newsletter_subscribers").delete().eq("email", e);
  await db.from("users").update({ newsletter: false }).eq("email", e);
}

export async function getSubscribers(): Promise<Subscriber[]> {
  const { data } = await getSupabase()
    .from("newsletter_subscribers")
    .select("email, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({ email: r.email as string, createdAt: r.created_at as string }));
}
