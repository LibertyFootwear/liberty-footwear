/**
 * Seasonal copy helpers — tiny date gates used by the homepage and announcement bar.
 * Dates are inclusive of the "until" day in site time (US Eastern — the Grand Rapids store's own clock).
 */

const ET_OFFSET_HOURS = -5; // ET is close enough for a holiday copy switch; DST drift of 1h doesn't matter here.

function etDateString(): string {
  const now = new Date();
  const et = new Date(now.getTime() + ET_OFFSET_HOURS * 3600_000);
  return et.toISOString().slice(0, 10); // YYYY-MM-DD
}

/** True from now until the end of Thanksgiving weekend (Sun Nov 29, 2026, ET). */
export function isThanksgivingSeason(): boolean {
  const today = etDateString();
  return today <= "2026-11-29";
}
