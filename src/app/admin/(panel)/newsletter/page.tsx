import { requireAdmin } from "@/lib/adminAuth";
import { getSubscribers } from "@/lib/newsletterDb";
import { getSupabase } from "@/lib/supabase";
import { defaultNotifications, Notifications } from "@/lib/userDb";

export const dynamic = "force-dynamic";

const TYPES: { key: keyof Notifications; label: string }[] = [
  { key: "newsletter",    label: "Newsletter" },
  { key: "specialOffers", label: "Special Offers" },
  { key: "newProducts",   label: "New Products" },
  { key: "blog",          label: "Blog" },
];

interface Entry { email: string; name?: string; source: string; date: string; subs: string[] }

export default async function AdminNewsletter() {
  await requireAdmin();

  const [subs, usersRes] = await Promise.all([
    getSubscribers(),
    getSupabase().from("users").select("email, name, newsletter, notifications, created_at"),
  ]);

  const map = new Map<string, Entry>();

  // Form-only signups — implicitly the general Newsletter
  for (const s of subs) {
    map.set(s.email.toLowerCase(), { email: s.email, source: "Signup form", date: s.createdAt, subs: ["Newsletter"] });
  }

  // Registered users — expand their notification preferences
  for (const u of usersRes.data ?? []) {
    const n = (u.notifications as Notifications) ?? defaultNotifications;
    const enabled: string[] = [];
    for (const t of TYPES) {
      const on = t.key === "newsletter" ? (n.newsletter || (u.newsletter as boolean)) : n[t.key];
      if (on) enabled.push(t.label);
    }
    if (enabled.length === 0) continue; // opted out of everything

    const key = (u.email as string).toLowerCase();
    if (map.has(key)) {
      const ex = map.get(key)!;
      ex.source = "Form + Account";
      ex.name = u.name as string;
      ex.subs = Array.from(new Set([...ex.subs, ...enabled]));
    } else {
      map.set(key, { email: u.email as string, name: u.name as string, source: "Account", date: u.created_at as string, subs: enabled });
    }
  }

  const list = [...map.values()].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const emailsText = list.map((l) => l.email).join(", ");

  // Per-type totals
  const typeCounts = TYPES.map((t) => ({ label: t.label, count: list.filter((l) => l.subs.includes(t.label)).length }));

  const CHIP: Record<string, string> = {
    "Newsletter":     "bg-navy/10 text-navy",
    "Special Offers": "bg-red/10 text-red",
    "New Products":   "bg-green-100 text-green-700",
    "Blog":           "bg-amber-100 text-amber-700",
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Newsletter</h1>
      <p className="text-sm text-gray-400 mb-6">{list.length} subscribers · registered users show exactly which email types they opted into</p>

      {/* Per-type summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {typeCounts.map((t) => (
          <div key={t.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.label}</p>
            <p className="text-2xl font-black text-navy">{t.count}</p>
          </div>
        ))}
      </div>

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
              {["Email", "Name", "Subscribed To", "Source", "Since"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {list.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No subscribers yet.</td></tr>
            )}
            {list.map((l) => (
              <tr key={l.email} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-navy font-semibold">
                  <a href={`mailto:${l.email}`} className="hover:text-red underline">{l.email}</a>
                </td>
                <td className="px-4 py-3 text-gray-600">{l.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {l.subs.map((s) => (
                      <span key={s} className={`text-xs font-bold px-2 py-0.5 rounded-full ${CHIP[s] ?? "bg-gray-100 text-gray-600"}`}>{s}</span>
                    ))}
                  </div>
                </td>
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
