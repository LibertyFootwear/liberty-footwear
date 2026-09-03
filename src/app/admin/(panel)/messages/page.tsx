import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import MessagesInbox, { MessageRow } from "./MessagesInbox";
import { PageHeader } from "../ui";

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
      <PageHeader
        title="Messages"
        subtitle="Contact-form messages from the website. Files are attached to the email; this is the searchable log."
      />
      <MessagesInbox messages={messages} />
    </div>
  );
}
