/**
 * Book (or unbook) a Retail Sales row from a work item — a repair or a custom
 * (open) order — when its Paid flag flips.
 *
 * Money and work are decoupled: the item stays in the Work Queue until it's
 * done, but the moment it's marked Paid (up front or at pickup) it becomes a
 * recorded sale. `sale_id` on the source row keeps this idempotent — one sale
 * per work item, even if Paid is toggled off and back on.
 */
import { getSupabase } from "@/lib/supabase";
import { tryUpsertCustomer } from "@/lib/customersDb";
import { syncRowToSheet, deleteRowFromSheet } from "@/lib/sheetsSync";
import { todayKey } from "@/lib/queue";

type Kind = "repair" | "open_order";

interface WorkRow {
  id: string;
  sale_id?: string | null;
  paid?: boolean | null;
  price_quote?: number | null;
  first_name?: string | null;
  last_name?: string | null;
  contact?: string | null;
  details?: string | null;
  // repair-only
  job?: string | null;
  tag_no?: string | null;
  // open_order-only
  stock_no?: string | null;
  size?: string | null;
  width?: string | null;
}

/** Shape the retail_sales insert for a work item. */
function saleRecord(kind: Kind, row: WorkRow, customerId?: string) {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || null;
  const base = {
    customer_id: customerId ?? null,
    sale_date: todayKey(),
    qty: 1,
    paid: true,
    total: row.price_quote ?? null,
    payment: null as string | null,
    customer_name: name,
    phone: row.contact ?? null,
    customer_email: null as string | null,
    customer_address: null as string | null,
    customer_employer: null as string | null,
    referral_source: null as string | null,
  };
  if (kind === "repair") {
    const note = [row.tag_no ? `#${row.tag_no}` : null, row.details].filter(Boolean).join(" · ") || null;
    return { ...base, stock_no: row.job || "Repair", size: null, width: null, notes: note };
  }
  // open_order
  return {
    ...base,
    stock_no: row.stock_no || "Custom order",
    size: row.size ?? null,
    width: row.width ?? null,
    notes: row.details ?? null,
  };
}

/**
 * Reconcile the retail_sales row for a work item after an update.
 * - Paid & no linked sale  → create the sale, store its id on the source row.
 * - Not paid & linked sale → delete the sale, clear the link.
 * - otherwise              → no-op.
 * Best-effort: failures are logged, never thrown (the primary update already succeeded).
 */
export async function reconcileWorkSale(
  kind: Kind,
  table: "repairs" | "open_orders",
  row: WorkRow,
): Promise<void> {
  const sb = getSupabase();
  try {
    const paid = row.paid === true;
    const linked = row.sale_id ?? null;

    if (paid && !linked) {
      const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
      const customerId = (name || row.contact)
        ? await tryUpsertCustomer({
            name: name || undefined,
            phone: row.contact ?? undefined,
            source: "store",
            purchaseAt: new Date().toISOString(),
          })
        : undefined;

      const { data, error } = await sb
        .from("retail_sales")
        .insert(saleRecord(kind, row, customerId))
        .select("*")
        .single();
      if (error) { console.error("reconcileWorkSale insert failed", error.message); return; }

      await sb.from(table).update({ sale_id: data.id }).eq("id", row.id);
      await syncRowToSheet(data);
    } else if (!paid && linked) {
      await sb.from("retail_sales").delete().eq("id", linked);
      await deleteRowFromSheet(linked);
      await sb.from(table).update({ sale_id: null }).eq("id", row.id);
    }
  } catch (e) {
    console.error("reconcileWorkSale error", e);
  }
}
