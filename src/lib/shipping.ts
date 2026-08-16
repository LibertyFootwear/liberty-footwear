import type { ProductCategory } from "@/data/products";

/** Flat shipping fee for orders without any boots (apparel, insoles, leather care). */
export const SMALL_ITEM_SHIPPING = 8;

/** Categories that count as actual footwear — these earn free shipping. */
const BOOT_CATEGORIES: ProductCategory[] = ["Work", "Casual", "Outdoors", "Safety", "One of a Kind"];

/** True for real boots. Apparel, Insoles and Care do NOT qualify for free shipping. */
export function isBootCategory(category: ProductCategory): boolean {
  return BOOT_CATEGORIES.includes(category);
}
