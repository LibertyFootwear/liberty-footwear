/**
 * US date formatting for the admin panel (MM/DD/YYYY), independent of the
 * server/browser locale.
 */

/**
 * Format a date-only value (YYYY-MM-DD, or an ISO string) as US MM/DD/YYYY,
 * reformatting the string directly to avoid timezone off-by-one shifts.
 * Non-date text (e.g. "online") passes through unchanged; empty → "—".
 */
export function usDate(value: string | null | undefined): string {
  if (!value) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[2]}/${m[3]}/${m[1]}`;
  return value;
}
