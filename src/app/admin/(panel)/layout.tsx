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

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const pending = await pendingOrderCount();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar pending={pending} />

      {/* Main — full width on mobile (with room for the top bar), offset by the sidebar on desktop */}
      <main className="md:ml-56 min-h-screen pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}
