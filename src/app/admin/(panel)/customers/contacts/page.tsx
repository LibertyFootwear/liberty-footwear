import { requireAdmin } from "@/lib/adminAuth";
import oldContacts from "@/data/oldContacts.json";

interface Contact {
  date: string;
  name: string;
  company: string;
  phone: string;
  email: string;
}

const TABS = [
  { href: "/admin/customers", label: "Registered" },
  { href: "/admin/customers/old", label: "From Old Website" },
  { href: "/admin/customers/contacts", label: "Email Contacts" },
];

export default async function ContactsPage() {
  await requireAdmin();
  const contacts = (oldContacts as Contact[])
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-4">Customers</h1>

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {TABS.map((t) => (
          <a key={t.href} href={t.href}
            className={`px-4 py-2 text-sm font-bold transition ${t.href === "/admin/customers/contacts" ? "text-navy border-b-2 border-navy -mb-px" : "text-gray-400 hover:text-navy"}`}>
            {t.label}
          </a>
        ))}
      </div>

      <p className="text-sm text-gray-400 mb-6">{contacts.length} contact form submissions from the old website (2020–2026)</p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Date", "Name", "Company", "Phone", "Email"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {contacts.map((c, i) => (
              <tr key={i} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-gray-500">{c.date || "—"}</td>
                <td className="px-4 py-3 font-semibold text-navy">{c.name || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.company || "—"}</td>
                <td className="px-4 py-3 text-gray-600">
                  {c.phone ? <a href={`tel:${c.phone}`} className="hover:text-navy">{c.phone}</a> : "—"}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.email ? <a href={`mailto:${c.email}`} className="hover:text-navy underline">{c.email}</a> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
