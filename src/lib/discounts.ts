/**
 * Discount / promo codes — server-side source of truth. The cart & checkout UI
 * show a preview, but the real discount is always recomputed here at checkout so
 * a tampered client can't invent one.
 */
import { getSupabase } from "@/lib/supabase";

export interface DiscountCode {
  id: string;
  code: string;
  percent_off: number | null;
  amount_off: number | null;
  active: boolean;
  user_id: string | null;
  max_uses: number | null;
  used_count: number;
  note: string | null;
  created_at: string;
}

export function normalizeCode(raw: string | null | undefined): string {
  return (raw ?? "").trim().toUpperCase();
}

/** Human label for a code's value, e.g. "25% off" or "$10 off". */
export function discountLabel(c: Pick<DiscountCode, "percent_off" | "amount_off">): string {
  if (c.percent_off != null) return `${c.percent_off}% off`;
  if (c.amount_off != null) return `$${c.amount_off} off`;
  return "—";
}

/** Dollar discount a code yields on a given subtotal (never more than the subtotal). */
export function discountAmountFor(
  c: Pick<DiscountCode, "percent_off" | "amount_off">,
  subtotal: number,
): number {
  let d = 0;
  if (c.percent_off != null) d = subtotal * (c.percent_off / 100);
  else if (c.amount_off != null) d = c.amount_off;
  return Math.min(subtotal, Math.round(d * 100) / 100);
}

export interface ValidateContext {
  userId?: string | null;
  subtotal: number;
}

export interface ValidateResult {
  ok: boolean;
  reason?: string;
  code?: DiscountCode;
  label?: string;
  discount?: number; // dollars off for the given subtotal
}

/**
 * Look up and validate a code for a given customer + subtotal. Enforces active
 * flag, account binding (user_id) and usage cap. Does NOT mutate usage — that
 * happens once the order is actually placed (see redeemDiscount).
 */
export async function validateDiscount(rawCode: string, ctx: ValidateContext): Promise<ValidateResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, reason: "Enter a code." };

  const { data, error } = await getSupabase()
    .from("discount_codes")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) return { ok: false, reason: "Couldn't check that code." };
  const c = data as DiscountCode | null;
  if (!c || !c.active) return { ok: false, reason: "Invalid or expired code." };
  if (c.max_uses != null && c.used_count >= c.max_uses) return { ok: false, reason: "This code has reached its usage limit." };
  if (c.user_id && c.user_id !== ctx.userId) {
    return { ok: false, reason: "This code is tied to a specific account — sign in to use it." };
  }

  return {
    ok: true,
    code: c,
    label: discountLabel(c),
    discount: discountAmountFor(c, Math.max(0, ctx.subtotal)),
  };
}

/** Increment a code's redemption counter (atomic). Best-effort. */
export async function redeemDiscount(codeId: string): Promise<void> {
  try {
    await getSupabase().rpc("increment_discount_use", { p_id: codeId });
  } catch (e) {
    console.error("redeemDiscount failed", e);
  }
}
