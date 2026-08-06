"use client";

import { useEffect } from "react";
import { trackPurchase } from "@/lib/gtag";
import type { GaItem } from "@/lib/gtag";

interface Props {
  transactionId: string;
  value: number;
  tax?: number;
  shipping?: number;
  items: GaItem[];
}

/**
 * Fires the GA4 `purchase` event once per order. The success page can be
 * refreshed or re-opened, so we dedupe on transaction id via sessionStorage to
 * avoid inflating revenue.
 */
export default function PurchaseTracker({ transactionId, value, tax, shipping, items }: Props) {
  useEffect(() => {
    if (!transactionId) return;
    const key = `ga_purchase_${transactionId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable — still track (better a rare dupe than a miss)
    }
    trackPurchase({ transaction_id: transactionId, value, tax, shipping, items });
  }, [transactionId, value, tax, shipping, items]);

  return null;
}
