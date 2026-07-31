import { getSupabase } from "./supabase";

export interface SiteSettings {
  salesEnabled: boolean;
  pausedMessage: string;
  contactPhone: string;
  /** When finished-boot inventory was last counted (YYYY-MM-DD), and by whom. */
  lastInventoryDate?: string;
  lastInventoryBy?: string;
  /** Same, for the "specials" (defective/seconds) inventory. */
  lastSpecialsDate?: string;
  lastSpecialsBy?: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  salesEnabled: true,
  pausedMessage:
    "We are temporarily not accepting online orders. Please call us for current availability and to place an order.",
  contactPhone: "616.930.3060",
};

function mapRow(row: Record<string, unknown> | null): SiteSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    salesEnabled: (row.sales_enabled as boolean) ?? true,
    pausedMessage: (row.paused_message as string) ?? DEFAULT_SETTINGS.pausedMessage,
    contactPhone: (row.contact_phone as string) ?? DEFAULT_SETTINGS.contactPhone,
    lastInventoryDate: (row.last_inventory_date as string) ?? undefined,
    lastInventoryBy: (row.last_inventory_by as string) ?? undefined,
    lastSpecialsDate: (row.last_specials_date as string) ?? undefined,
    lastSpecialsBy: (row.last_specials_by as string) ?? undefined,
  };
}

/** Read the single settings row. Falls back to defaults (fail-open on sales) if unavailable. */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const { data } = await getSupabase().from("site_settings").select("*").eq("id", 1).maybeSingle();
    return mapRow(data);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSiteSettings(
  fields: Partial<SiteSettings>
): Promise<void> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (fields.salesEnabled !== undefined) update.sales_enabled = fields.salesEnabled;
  if (fields.pausedMessage !== undefined) update.paused_message = fields.pausedMessage;
  if (fields.contactPhone !== undefined) update.contact_phone = fields.contactPhone;
  if (fields.lastInventoryDate !== undefined) update.last_inventory_date = fields.lastInventoryDate;
  if (fields.lastInventoryBy !== undefined) update.last_inventory_by = fields.lastInventoryBy;
  if (fields.lastSpecialsDate !== undefined) update.last_specials_date = fields.lastSpecialsDate;
  if (fields.lastSpecialsBy !== undefined) update.last_specials_by = fields.lastSpecialsBy;
  // Upsert the singleton row so it exists even if the seed insert was skipped.
  await getSupabase().from("site_settings").upsert({ id: 1, ...update });
}
