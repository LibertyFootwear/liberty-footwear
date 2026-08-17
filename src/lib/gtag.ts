/**
 * GA4 e-commerce event helpers. All are safe no-ops when GA isn't loaded
 * (analytics key unset, or called before the gtag script is ready), so callers
 * never need to guard.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export interface GaItem {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
  item_category?: string;
  item_variant?: string;
}

const CURRENCY = "USD";

function gtag(...args: unknown[]) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag(...args);
}

export function trackViewItem(item: GaItem) {
  gtag("event", "view_item", {
    currency: CURRENCY,
    value: item.price ?? 0,
    items: [{ quantity: 1, ...item }],
  });
}

export function trackAddToCart(item: GaItem) {
  const quantity = item.quantity ?? 1;
  gtag("event", "add_to_cart", {
    currency: CURRENCY,
    value: (item.price ?? 0) * quantity,
    items: [{ ...item, quantity }],
  });
}

export function trackSelectItem(item: GaItem, listName?: string) {
  gtag("event", "select_item", {
    ...(listName ? { item_list_name: listName } : {}),
    items: [{ quantity: 1, ...item }],
  });
}

export function trackViewItemList(items: GaItem[], listName?: string) {
  if (!items.length) return;
  gtag("event", "view_item_list", {
    ...(listName ? { item_list_name: listName } : {}),
    items,
  });
}

export function trackViewCart(data: { value: number; items: GaItem[] }) {
  gtag("event", "view_cart", {
    currency: CURRENCY,
    value: data.value,
    items: data.items,
  });
}

export function trackRemoveFromCart(item: GaItem) {
  const quantity = item.quantity ?? 1;
  gtag("event", "remove_from_cart", {
    currency: CURRENCY,
    value: (item.price ?? 0) * quantity,
    items: [{ ...item, quantity }],
  });
}

export function trackBeginCheckout(data: { value: number; items: GaItem[] }) {
  gtag("event", "begin_checkout", {
    currency: CURRENCY,
    value: data.value,
    items: data.items,
  });
}

export function trackPurchase(data: {
  transaction_id: string;
  value: number;
  items: GaItem[];
  tax?: number;
  shipping?: number;
}) {
  gtag("event", "purchase", {
    transaction_id: data.transaction_id,
    value: data.value,
    currency: CURRENCY,
    tax: data.tax,
    shipping: data.shipping,
    items: data.items,
  });
}
