import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import MessagesInbox, { MessageRow } from "./MessagesInbox";

export const dynamic = "force-dynamic";

export default async function AdminMessages() {
  await requireAdmin();

  const { data } = await getSupabase()
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  const messages = (data ?? []) as MessageRow[];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Messages</h1>
      <p className="text-sm text-gray-400 mb-8">
        Contact-form messages from the website. Files are attached to the email; this is the searchable log.
      </p>
      <MessagesInbox messages={messages} />
    </div>
  );
}
