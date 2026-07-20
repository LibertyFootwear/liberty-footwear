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

export async function getSubscribers(): Promise<Subscriber[]> {
  const { data } = await getSupabase()
    .from("newsletter_subscribers")
    .select("email, created_at")
    .order("created_at", { ascending: false });
  return (data ?? []).map((r) => ({ email: r.email as string, createdAt: r.created_at as string }));
}
