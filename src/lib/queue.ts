/**
 * Unified work queue — "what needs work first" across the three order types:
 *   • web      — online orders awaiting fulfilment (orders table)
 *   • custom   — walk-in / call-in custom orders (open_orders table)
 *   • repair   — repairs & resoles (repairs table)
 *
 * Everything is ranked by an effective DUE date, soonest first, with overdue
 * items floating to the very top. Web orders carry no promised date, so they
 * get an implicit SLA (created + WEB_SLA_DAYS) to slot into the same list.
 */

export type QueueKind = "web" | "custom" | "repair";

export interface QueueItem {
  id: string;
  kind: QueueKind;
  href: string;          // where to go to act on it
  customer: string;
  summary: string;       // stock #, job, item count…
  stage: string;         // human status ("New", "Made", "In progress"…)
  due: string | null;    // effective due date, YYYY-MM-DD (null = no date known)
  dueNote?: string;      // trailing free text from a promised field ("Mike picked up…")
  createdAt: string;     // ISO — used for age + fallback sort
  overdue: boolean;
}

/** Days after a paid web order is placed before it counts as "due". */
export const WEB_SLA_DAYS = 2;

/** Local calendar day in the shop's timezone, as YYYY-MM-DD. */
export function todayKey(tz = "America/Detroit"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
}

/**
 * Pull a leading date out of a "promised"-style value and normalise to
 * YYYY-MM-DD. Accepts YYYY-MM-DD and M/D/YY(YY); returns the date plus any
 * trailing note ("8/10/26 Mike picked up" → { date: "2026-08-10", note: "Mike picked up" }).
 * Non-date text ("quote", "online") → { date: null, note: <text> }.
 */
export function parseDue(value: string | null | undefined): { date: string | null; note: string } {
  if (!value) return { date: null, note: "" };
  const v = value.trim();

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  if (iso) return { date: iso[0], note: v.slice(iso[0].length).trim() };

  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(v);
  if (us) {
    const mm = us[1].padStart(2, "0");
    const dd = us[2].padStart(2, "0");
    let yy = us[3];
    if (yy.length === 2) yy = `20${yy}`;
    return { date: `${yy}-${mm}-${dd}`, note: v.slice(us[0].length).trim() };
  }
  return { date: null, note: v };
}

/** Add N days to a YYYY-MM-DD (or ISO) string, returning YYYY-MM-DD. */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days between a YYYY-MM-DD/ISO date and today (positive = in the past). */
export function ageInDays(dateStr: string | null, today = todayKey()): number {
  if (!dateStr) return 0;
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${dateStr.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((a - b) / 86_400_000);
}

/**
 * Rank queue items: overdue first (most overdue first), then by soonest due
 * date, then dateless items oldest-first. Returns a new sorted array.
 */
export function prioritize(items: QueueItem[]): QueueItem[] {
  const rank = (i: QueueItem) => {
    if (i.overdue) return 0;
    if (i.due) return 1;
    return 2;
  };
  return [...items].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (a.due && b.due) return a.due < b.due ? -1 : a.due > b.due ? 1 : 0;
    // dateless → oldest created first
    return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
  });
}
