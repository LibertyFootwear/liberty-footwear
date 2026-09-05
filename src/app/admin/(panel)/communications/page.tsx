import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { quoEnabled } from "@/lib/quo";
import { PageHeader } from "../ui";
import CommsLog, { CommRow } from "./CommsLog";

export const dynamic = "force-dynamic";

export default async function AdminCommunications() {
  await requireAdmin();
  const sb = getSupabase();

  const { data } = await sb
    .from("communications")
    .select("*")
    .order("occurred_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(500);

  const rows = (data ?? []) as CommRow[];

  // Resolve matched customer names for display.
  const ids = [...new Set(rows.map((r) => r.customer_id).filter(Boolean))] as string[];
  const names: Record<string, string> = {};
  if (ids.length) {
    const { data: custs } = await sb.from("customers").select("id, name").in("id", ids);
    for (const c of custs ?? []) names[c.id as string] = (c.name as string) ?? "";
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Communications"
        subtitle="Calls & texts from your Quo business number, matched to customers. Send a text straight from here."
      />
      {!quoEnabled && (
        <div className="mb-6 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Quo isn&apos;t connected yet — add the API keys (see the setup guide) to start logging calls and sending texts.
        </div>
      )}
      <CommsLog rows={rows} names={names} quoEnabled={quoEnabled} />
    </div>
  );
}
