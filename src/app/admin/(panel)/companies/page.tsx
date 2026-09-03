import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import CompaniesTable, { Company } from "./CompaniesTable";

export const dynamic = "force-dynamic";

const clean = (s: unknown) => String(s ?? "").replace(/\s+/g, " ").trim();
// Skip blanks and placeholder employers like "?" or "? Construction".
const isRealCompany = (s: string) => s.length > 1 && !s.startsWith("?");

export default async function AdminCompanies() {
  await requireAdmin();
  const sb = getSupabase();

  const [custRes, salesAgg] = await Promise.all([
    sb.from("customers")
      .select("id, name, email, phone, employer, newsletter, last_purchase_at")
      .order("last_purchase_at", { ascending: false, nullsFirst: false }),
    (async () => {
      // Page through retail_sales for employer + total to tally spend per company.
      const rows: { customer_employer: string | null; total: number | null }[] = [];
      const PAGE = 1000;
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await sb
          .from("retail_sales")
          .select("customer_employer, total")
          .range(from, from + PAGE - 1);
        if (error || !data || data.length === 0) break;
        rows.push(...(data as typeof rows));
        if (data.length < PAGE) break;
      }
      return rows;
    })(),
  ]);

  const customers = custRes.data ?? [];

  // Group by a normalised (lowercased) company key; keep the first-seen label.
  const map = new Map<string, Company>();
  const get = (label: string): Company => {
    const key = label.toLowerCase();
    let c = map.get(key);
    if (!c) { c = { key, name: label, contactCount: 0, revenue: 0, newsletter: 0, contacts: [] }; map.set(key, c); }
    return c;
  };

  for (const cust of customers) {
    const label = clean(cust.employer);
    if (!isRealCompany(label)) continue;
    const c = get(label);
    c.contactCount++;
    if (cust.newsletter) c.newsletter++;
    c.contacts.push({
      id: cust.id as string,
      name: (cust.name as string) ?? "—",
      email: (cust.email as string) ?? null,
      phone: (cust.phone as string) ?? null,
      lastPurchaseAt: (cust.last_purchase_at as string) ?? null,
    });
  }

  for (const s of salesAgg) {
    const label = clean(s.customer_employer);
    if (!isRealCompany(label)) continue;
    const total = typeof s.total === "number" ? s.total : 0;
    if (total > 0) get(label).revenue += total;
  }

  const companies = [...map.values()]
    .map((c) => ({ ...c, revenue: Math.round(c.revenue) }))
    .sort((a, b) => b.revenue - a.revenue || b.contactCount - a.contactCount);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Companies</h1>
      <p className="text-sm text-gray-400 mb-8">
        Employers across your customers &amp; sales — who buys for a crew. Click a company to see its people.
        Built from the &quot;employer&quot; field on customers and sales.
      </p>
      <CompaniesTable companies={companies} />
    </div>
  );
}
