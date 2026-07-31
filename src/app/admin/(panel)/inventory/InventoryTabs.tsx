const TABS = [
  { key: "boots", href: "/admin/inventory", label: "Finished Boots" },
  { key: "specials", href: "/admin/inventory/specials", label: "Specials" },
  { key: "uppers", href: "/admin/inventory/uppers", label: "Uppers" },
];

export default function InventoryTabs({ active }: { active: "boots" | "specials" | "uppers" }) {
  return (
    <div className="flex gap-2 border-b border-gray-200 mb-8">
      {TABS.map((t) => (
        <a
          key={t.key}
          href={t.href}
          className={`px-4 py-2 text-sm font-bold transition ${
            t.key === active ? "text-navy border-b-2 border-navy -mb-px" : "text-gray-400 hover:text-navy"
          }`}
        >
          {t.label}
        </a>
      ))}
    </div>
  );
}
