"use client";

import { useMemo, useState } from "react";
import type { ModelForecast, SizeStatus } from "@/lib/forecast";
import { TH, TD, TABLE_WRAP, BTN_GHOST, EmptyState } from "../../ui";

const STATUS_STYLE: Record<SizeStatus, { label: string; cls: string }> = {
  urgent: { label: "Reorder now", cls: "bg-red/10 text-red" },
  low: { label: "Running low", cls: "bg-amber-100 text-amber-700" },
  healthy: { label: "OK", cls: "bg-green-100 text-green-700" },
  overstock: { label: "Overstocked", cls: "bg-blue-50 text-blue-600" },
  dead: { label: "Not selling", cls: "bg-gray-100 text-gray-500" },
};

function Badge({ status }: { status: SizeStatus }) {
  const s = STATUS_STYLE[status];
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${s.cls}`}>{s.label}</span>;
}

function cover(weeks: number): string {
  if (!Number.isFinite(weeks)) return "—";
  if (weeks >= 52) return "1yr+";
  return `${weeks.toFixed(weeks < 10 ? 1 : 0)}w`;
}

type Filter = "toOrder" | "urgent" | "all";

export default function ReorderTable({
  models,
  names,
}: {
  models: ModelForecast[];
  names: Record<string, string>;
}) {
  const [filter, setFilter] = useState<Filter>("toOrder");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    if (filter === "urgent") return models.filter((m) => m.status === "urgent");
    if (filter === "toOrder") return models.filter((m) => m.recommendedOrder > 0);
    return models;
  }, [models, filter]);

  /** Copy a plain-text purchase order of everything currently suggested. */
  function copyPO() {
    const lines: string[] = ["LIBERTY FOOTWEAR — SUGGESTED REORDER", new Date().toLocaleDateString(), ""];
    for (const m of models.filter((x) => x.recommendedOrder > 0)) {
      lines.push(`${m.stockNo} ${names[m.stockNo] ?? ""} — ${m.recommendedOrder} pairs`);
      for (const s of m.sizes.filter((x) => x.recommendedOrder > 0)) {
        lines.push(`    ${s.size}: ${s.recommendedOrder}`);
      }
    }
    navigator.clipboard?.writeText(lines.join("\n"));
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "toOrder", label: "To order" },
    { key: "urgent", label: "Urgent" },
    { key: "all", label: "All models" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                filter === t.key ? "bg-navy text-white" : "border-2 border-gray-200 text-gray-500 hover:border-navy"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={copyPO} className={BTN_GHOST}>Copy purchase order</button>
      </div>

      {rows.length === 0 ? (
        <EmptyState>Nothing to reorder in this view.</EmptyState>
      ) : (
        <div className={TABLE_WRAP}>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className={TH}>Model</th>
                <th className={TH}>Status</th>
                <th className={TH + " text-right"}>On hand</th>
                <th className={TH + " text-right"}>Sold</th>
                <th className={TH + " text-right"}>Cover</th>
                <th className={TH + " text-right"}>Order</th>
                <th className={TH}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((m) => {
                const isOpen = open[m.stockNo];
                return (
                  <FragmentRow
                    key={m.stockNo}
                    m={m}
                    name={names[m.stockNo] ?? m.stockNo}
                    isOpen={isOpen}
                    toggle={() => setOpen((o) => ({ ...o, [m.stockNo]: !o[m.stockNo] }))}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  m,
  name,
  isOpen,
  toggle,
}: {
  m: ModelForecast;
  name: string;
  isOpen: boolean;
  toggle: () => void;
}) {
  const weeklyCover = m.dailyRate > 0 ? m.onHand / (m.dailyRate * 7) : Infinity;
  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={toggle}>
        <td className={TD}>
          <span className="font-bold text-navy">{m.stockNo}</span>{" "}
          <span className="text-gray-500">{name}</span>
        </td>
        <td className={TD}><Badge status={m.status} /></td>
        <td className={TD + " text-right tabular-nums"}>{m.onHand}</td>
        <td className={TD + " text-right tabular-nums"}>{m.unitsSold}</td>
        <td className={TD + " text-right tabular-nums"}>{cover(weeklyCover)}</td>
        <td className={TD + " text-right tabular-nums font-black " + (m.recommendedOrder > 0 ? "text-navy" : "text-gray-300")}>
          {m.recommendedOrder || "—"}
        </td>
        <td className={TD + " text-gray-400"}>{isOpen ? "▲" : "▼"}</td>
      </tr>
      {isOpen && (
        <tr>
          <td colSpan={7} className="bg-gray-50 px-6 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-1">
              {m.sizes.map((s) => (
                <div key={s.size} className="flex items-center justify-between text-xs py-0.5 border-b border-gray-100">
                  <span className="text-gray-600">{s.size}</span>
                  <span className="tabular-nums text-gray-400">
                    {s.onHand} on hand
                    {s.recommendedOrder > 0 && (
                      <span className="ml-2 font-black text-navy">+{s.recommendedOrder}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
