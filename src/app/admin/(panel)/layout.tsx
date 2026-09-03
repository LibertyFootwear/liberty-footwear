import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

/** Count web orders still needing action (new + in-progress). */
async function pendingOrderCount(): Promise<number> {
  try {
    const { data } = await getSupabase()
      .from("orders")
      .select("source, shipping_method")
      .in("status", ["paid", "processing"]);
    return (data ?? []).filter((o) => o.source !== "store" && o.shipping_method !== "store").length;
  } catch {
    return 0;
  }
}

/** Count unread (new) contact-form messages. */
async function unreadMessageCount(): Promise<number> {
  try {
    const { count } = await getSupabase()
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("status", "new");
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [pending, messages] = await Promise.all([pendingOrderCount(), unreadMessageCount()]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pending={pending} messages={messages} />

      {/* Main — full width on mobile (with room for the top bar), offset by the sidebar on desktop */}
      <main className="md:ml-56 min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
