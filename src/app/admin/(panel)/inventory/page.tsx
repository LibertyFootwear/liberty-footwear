import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { getSiteSettings } from "@/lib/siteSettings";
import InventoryEditor from "./InventoryEditor";
import InventoryImport from "./InventoryImport";
import InventoryTabs from "./InventoryTabs";
import { buildInventoryRows, knownStocks, type DbInvRow } from "./buildRows";
import { PageHeader } from "../ui";

export const dynamic = "force-dynamic";

export default async function AdminInventory() {
  await requireAdmin();

  const settings = await getSiteSettings();
  const { data } = await getSupabase().from("inventory").select("*");
  const rows = buildInventoryRows((data ?? []) as DbInvRow[]);

  const lastCount = settings.lastInventoryDate
    ? `Last counted ${settings.lastInventoryDate}${settings.lastInventoryBy ? ` · by ${settings.lastInventoryBy}` : ""}`
    : null;

  return (
    <div className="p-8">
      <PageHeader title="Inventory" />

      <InventoryTabs active="boots" />

      <InventoryImport knownStocks={knownStocks} />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">Stock levels by product and size. Click a number to edit.</p>
        {lastCount && <p className="text-xs font-semibold text-gray-500">{lastCount}</p>}
      </div>
      <InventoryEditor rows={rows} />
    </div>
  );
}
