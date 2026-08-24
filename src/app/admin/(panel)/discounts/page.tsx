import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import DiscountsTable, { CodeRow, AccountOption } from "./DiscountsTable";

export const dynamic = "force-dynamic";

export default async function AdminDiscounts() {
  await requireAdmin();
  const sb = getSupabase();

  const [codesRes, usersRes] = await Promise.all([
    sb.from("discount_codes").select("*").order("created_at", { ascending: false }),
    sb.from("users").select("id, name, email").order("name", { ascending: true }),
  ]);

  const codes = (codesRes.data ?? []) as CodeRow[];
  const accounts = (usersRes.data ?? []) as AccountOption[];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-2">Discount Codes</h1>
      <p className="text-sm text-gray-400 mb-8">
        Create promo codes (percent or dollar off), see how many times each was used, and optionally tie a
        code to a single customer account. Codes apply automatically at checkout.
      </p>
      <DiscountsTable codes={codes} accounts={accounts} />
    </div>
  );
}
