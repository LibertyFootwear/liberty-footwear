import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminCustomers() {
  await requireAdmin();
  const { data } = await getSupabase()
    .from("users")
    .select("id, name, email, phone, newsletter, created_at, favorites")
    .order("created_at", { ascending: false });

  const users = data ?? [];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Customers</h1>
      <p className="text-sm text-gray-400 mb-8">{users.length} registered accounts</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Name", "Email", "Phone", "Favorites", "Newsletter", "Joined", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No customers yet.</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-3 font-semibold text-navy">{u.name}</td>
                <td className="px-5 py-3 text-gray-600">{u.email}</td>
                <td className="px-5 py-3 text-gray-500">{u.phone || "—"}</td>
                <td className="px-5 py-3 text-gray-500">{(u.favorites as string[])?.length ?? 0}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.newsletter ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                    {u.newsletter ? "Yes" : "No"}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3">
                  <Link href={`/admin/customers/${u.id}`} className="text-xs font-bold text-navy hover:text-red transition">Detail →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
