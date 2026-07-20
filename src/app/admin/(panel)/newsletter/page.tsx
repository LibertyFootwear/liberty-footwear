import { requireAdmin } from "@/lib/adminAuth";
import { getSubscribers } from "@/lib/newsletterDb";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminNewsletter() {
  await requireAdmin();

  const [subs, usersRes] = await Promise.all([
    getSubscribers(),
    getSupabase().from("users").select("email, name, newsletter, created_at").eq("newsletter", true),
  ]);

  // Merge: newsletter form signups + registered users who opted in, unique by email
  const map = new Map<string, { email: string; name?: string; source: string; date: string }>();
  for (const s of subs) {
    map.set(s.email.toLowerCase(), { email: s.email, source: "Signup form", date: s.createdAt });
  }
  for (const u of usersRes.data ?? []) {
    const key = (u.email as string).toLowerCase();
    if (map.has(key)) {
      const ex = map.get(key)!;
      ex.source = "Form + Account";
      ex.name = u.name as string;
    } else {
      map.set(key, { email: u.email as string, name: u.name as string, source: "Account", date: u.created_at as string });
    }
  }

  const list = [...map.values()].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const emailsText = list.map((l) => l.email).join(", ");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Newsletter</h1>
      <p className="text-sm text-gray-400 mb-6">{list.length} subscribers · from the signup form and registered accounts who opted in</p>

      {/* Copy-all box */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">All emails (copy for your mail tool)</p>
        <textarea
          readOnly
          value={emailsText}
          rows={3}
          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-xs text-gray-600 focus:outline-none focus:border-navy resize-none font-mono"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Email", "Name", "Source", "Subscribed"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-400">No subscribers yet.</td></tr>
            )}
            {list.map((l) => (
              <tr key={l.email} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-navy font-semibold">
                  <a href={`mailto:${l.email}`} className="hover:text-red underline">{l.email}</a>
                </td>
                <td className="px-4 py-3 text-gray-600">{l.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{l.source}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{l.date ? new Date(l.date).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
