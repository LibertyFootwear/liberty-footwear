import { requireAdmin } from "@/lib/adminAuth";
import { getSupabase } from "@/lib/supabase";
import { getSiteSettings } from "@/lib/siteSettings";
import InventoryEditor from "../InventoryEditor";
import InventoryImport from "../InventoryImport";
import InventoryTabs from "../InventoryTabs";
import { buildInventoryRows, knownStocks, type DbInvRow } from "../buildRows";

export const dynamic = "force-dynamic";

export default async function AdminInventorySpecials() {
  await requireAdmin();

  const settings = await getSiteSettings();
  const { data } = await getSupabase().from("inventory_specials").select("*");
  const rows = buildInventoryRows((data ?? []) as DbInvRow[]);

  const lastCount = settings.lastSpecialsDate
    ? `Last counted ${settings.lastSpecialsDate}${settings.lastSpecialsBy ? ` · by ${settings.lastSpecialsBy}` : ""}`
    : null;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-4">Inventory</h1>

      <InventoryTabs active="specials" />

      <p className="text-sm text-gray-500 mb-4">
        Finished boots with a defect (seconds). Same stock numbers as regular stock, counted separately.
      </p>

      <InventoryImport
        knownStocks={knownStocks}
        importEndpoint="/api/admin/inventory/specials/import"
        label="Import counted specials (.xls)"
      />

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">Defective stock by product and size. Click a number to edit.</p>
        {lastCount && <p className="text-xs font-semibold text-gray-500">{lastCount}</p>}
      </div>
      <InventoryEditor rows={rows} saveEndpoint="/api/admin/inventory/specials" />
    </div>
  );
}
