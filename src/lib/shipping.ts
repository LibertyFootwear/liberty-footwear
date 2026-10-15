import type { ProductCategory } from "@/data/products";

/** Flat shipping fee for orders without any boots (apparel, insoles, leather care). */
export const SMALL_ITEM_SHIPPING = 8;

/** Categories that count as actual footwear — these earn free shipping. */
const BOOT_CATEGORIES: ProductCategory[] = ["Work", "Casual", "Outdoors", "Safety", "One of a Kind"];

/** True for real boots. Apparel, Insoles and Care do NOT qualify for free shipping. */
export function isBootCategory(category: ProductCategory): boolean {
  return BOOT_CATEGORIES.includes(category);
}

/**
 * US states with NO statewide sales tax ("NOMAD"): Alaska, Delaware, Montana, New Hampshire,
 * Oregon. Orders shipped there are not charged tax (store pickups are in Michigan, so they stay
 * taxable). Accepts the 2-letter code or full name, any case; dots/extra spaces are ignored.
 */
const NO_SALES_TAX_STATES = new Set(["ak", "alaska", "de", "delaware", "mt", "montana", "nh", "new hampshire", "or", "oregon"]);

export function isNoTaxState(state: string | undefined | null): boolean {
  const s = (state ?? "").toLowerCase().replace(/\./g, "").replace(/\s+/g, " ").trim();
  return NO_SALES_TAX_STATES.has(s);
}

/** Gift cards are delivered by email, never shipped, and carry no sales tax at purchase. */
export function isGiftCardCategory(category: ProductCategory | undefined | null): boolean {
  return category === "Gift Cards";
}
