import { requireAdmin } from "@/lib/adminAuth";
import oldCustomers from "@/data/oldCustomers.json";

interface OldCustomer {
  name: string;
  stockNumber: string;
  lastActive: string;
  orders: number;
  totalSpent: number;
  aov: number;
  city: string;
  region: string;
  zip: string;
}

export default async function OldCustomers() {
  await requireAdmin();
  const customers = (oldCustomers as OldCustomer[])
    .slice()
    .sort((a, b) => (b.lastActive || "").localeCompare(a.lastActive || ""));

  const totalSpent = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-4">Customers</h1>

      <div className="flex gap-2 border-b border-gray-200 mb-6">
        <a href="/admin/customers" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Registered</a>
        <a href="/admin/customers/old" className="px-4 py-2 text-sm font-bold text-navy border-b-2 border-navy -mb-px">From Old Website</a>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        {customers.length} customers imported from the old website · ${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 0 })} total spent
      </p>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Name", "Stock #", "Last Active", "Orders", "Total Spent", "AOV", "City", "Region", "ZIP"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers.map((c, i) => (
              <tr key={`${c.name}-${i}`} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold text-navy">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.stockNumber || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.lastActive || "—"}</td>
                <td className="px-4 py-3 text-gray-600">{c.orders}</td>
                <td className="px-4 py-3 font-bold text-gray-900">${c.totalSpent.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">${c.aov.toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-600">{c.city || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.region || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{c.zip || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
