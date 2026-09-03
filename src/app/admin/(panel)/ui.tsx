/**
 * Shared admin UI primitives + style tokens. Presentational only (no hooks), so
 * both server and client admin pages can import them. Adopt these instead of
 * re-declaring per-page class strings so the panel stays visually consistent.
 */
import type { ReactNode } from "react";

// ── Style tokens ────────────────────────────────────────────────────────────
export const TH = "px-3 py-2 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap";
export const TD = "px-3 py-2 text-sm text-gray-700 align-top";
export const INPUT = "w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy";
export const LABEL = "block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1";
export const BTN = "px-4 py-2 bg-navy text-white text-sm font-black rounded-lg hover:bg-navy/80 transition disabled:opacity-50";
export const BTN_GHOST = "px-4 py-2 border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-lg hover:border-navy transition disabled:opacity-50";
export const CARD = "bg-white rounded-xl border border-gray-100 shadow-sm";
export const TABLE_WRAP = "overflow-x-auto border border-gray-100 rounded-xl";

// ── Page header — one consistent title/subtitle/actions row ──────────────────
export function PageHeader({ title, subtitle, actions }: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-black text-navy">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Stat card — the KPI tiles used across dashboard/queue/companies ──────────
export function StatCard({ label, value, sub, accent }: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  accent?: "navy" | "red";
}) {
  return (
    <div className={CARD + " p-4 sm:p-5"}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl lg:text-3xl font-black tabular-nums leading-tight break-words ${accent === "red" ? "text-red" : "text-navy"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Empty state — consistent "nothing here yet" row ─────────────────────────
export function EmptyState({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-center text-sm text-gray-400 py-10 ${className}`}>{children}</p>;
}
