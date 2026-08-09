/**
 * Boot add-ons — extras a customer can pick on a boot (product page + cart).
 * Insole is a free choice; speedhooks and toe bumpers are paid upgrades.
 * Apparel never takes add-ons.
 */

export type InsoleChoice = "Regular" | "High Cushion";
export const INSOLE_CHOICES: InsoleChoice[] = ["Regular", "High Cushion"];

export interface BootAddons {
  insole: InsoleChoice;
  speedhooks: boolean;
  toeBumpers: boolean;
}

export const DEFAULT_ADDONS: BootAddons = { insole: "Regular", speedhooks: false, toeBumpers: false };

/** Per-upgrade surcharge in dollars. Insole choice is free. */
export const ADDON_PRICES = { speedhooks: 20, toeBumpers: 20 } as const;

/** Boots take add-ons; apparel does not. */
export function takesAddons(category: string | undefined): boolean {
  return category !== "Apparel";
}

export function addonsSurcharge(a: BootAddons | undefined): number {
  if (!a) return 0;
  return (a.speedhooks ? ADDON_PRICES.speedhooks : 0) + (a.toeBumpers ? ADDON_PRICES.toeBumpers : 0);
}

/** Stable identity so cart lines with different add-ons don't merge. */
export function addonsKey(a: BootAddons | undefined): string {
  if (!a) return "none";
  return `${a.insole}|${a.speedhooks ? 1 : 0}|${a.toeBumpers ? 1 : 0}`;
}

/** Human summary, e.g. "High Cushion insole · Speedhooks · Toe bumpers". */
export function addonsLabel(a: BootAddons | undefined): string {
  if (!a) return "";
  const parts = [`${a.insole} insole`];
  if (a.speedhooks) parts.push("Speedhooks");
  if (a.toeBumpers) parts.push("Toe bumpers");
  return parts.join(" · ");
}

/** Compact string for Stripe metadata / order records. */
export function encodeAddons(a: BootAddons | undefined): string {
  if (!a) return "";
  return `insole=${a.insole};speedhooks=${a.speedhooks ? 1 : 0};toeBumpers=${a.toeBumpers ? 1 : 0}`;
}

/** Parse the compact string back (tolerant — returns null if empty/invalid). */
export function decodeAddons(s: string | undefined | null): BootAddons | null {
  if (!s) return null;
  const map = new Map<string, string>();
  for (const pair of s.split(";")) {
    const [k, v] = pair.split("=");
    if (k) map.set(k.trim(), (v ?? "").trim());
  }
  const insole = map.get("insole") === "High Cushion" ? "High Cushion" : "Regular";
  return {
    insole,
    speedhooks: map.get("speedhooks") === "1",
    toeBumpers: map.get("toeBumpers") === "1",
  };
}
