import { randomInt } from "crypto";
import { getSupabase } from "@/lib/supabase";

// No 0/O/1/I/L — codes are read aloud and typed from print-outs.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** e.g. LF-7K3M-Q9XD */
export function generateGiftCode(): string {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `LF-${part()}-${part()}`;
}

/**
 * Create a single-use fixed-amount code for a paid gift-card line. It rides on the
 * discount_codes system, so redemption (validation, Stripe coupon, usage count) needs
 * no extra plumbing. Retries on the (very unlikely) unique-code collision.
 */
export async function createGiftCardCode(amount: number, orderId: string): Promise<string> {
  const sb = getSupabase();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateGiftCode();
    const { error } = await sb.from("discount_codes").insert({
      code,
      amount_off: amount,
      max_uses: 1,
      active: true,
      note: `Gift card $${amount} · order ${orderId.slice(0, 8)}`,
    });
    if (!error) return code;
    if (error.code !== "23505") throw new Error(error.message); // not a unique violation
  }
  throw new Error("Could not generate a unique gift card code");
}
