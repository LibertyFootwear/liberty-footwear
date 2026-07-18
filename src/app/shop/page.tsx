"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { products, ProductCategory } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { useLang } from "@/context/LanguageContext";
import { Suspense, useState } from "react";

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: "Work",     label: "Work" },
  { id: "Casual",   label: "Casual" },
  { id: "Outdoors", label: "Outdoors" },
  { id: "Safety",   label: "Safety" },
];

const PRICE_RANGES = [
  { id: "under215", label: "Under $215", min: 0,   max: 214 },
  { id: "215-234",  label: "$215 – $234", min: 215, max: 234 },
  { id: "235-244",  label: "$235 – $244", min: 235, max: 244 },
  { id: "over245",  label: "$245 & up",   min: 245, max: 9999 },
];

const SORT_OPTIONS = [
  { id: "default",    label: "Featured" },
  { id: "price-asc",  label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "newest",     label: "Newest First" },
];

const OUTSOLES = [
  { id: "wedge",    label: "Wedge" },
  { id: "heel-lug", label: "Heel Lug" },
  { id: "cup",      label: "Cup Sole (Hiker)" },
];

const COLOR_SWATCHES: Record<string, string> = {
  "Jet Black": "#1c1c1c",
  "Honey":     "#c4892a",
  "Russet":    "#8b3a2a",
  "Mocha":     "#6b4226",
  "Coffee":    "#3e2010",
};

function getUniqueColors() {
  const set = new Set(products.map((p) => p.colorLeather));
  return Array.from(set).sort();
}

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left font-bold text-navy text-sm mb-3"
      >
        {title}
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function CheckItem({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-2.5 w-full text-left py-1 group"
    >
      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${checked ? "bg-navy border-navy" : "border-gray-300 group-hover:border-navy"}`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </span>
      <span className={`text-sm ${checked ? "text-navy font-semibold" : "text-gray-600 group-hover:text-navy"}`}>{label}</span>
    </button>
  );
}

function ColorSwatch({ color, checked, onChange }: { color: string; checked: boolean; onChange: () => void }) {
  const hex = COLOR_SWATCHES[color] ?? "#999";
  return (
    <button
      type="button"
      onClick={onChange}
      title={color}
      className={`flex items-center gap-2.5 w-full text-left py-1 group`}
    >
      <span
        className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition ${checked ? "border-navy scale-110" : "border-transparent group-hover:border-gray-400"}`}
        style={{ backgroundColor: hex, boxShadow: checked ? "0 0 0 2px white, 0 0 0 4px #0b3154" : undefined }}
      />
      <span className={`text-sm ${checked ? "text-navy font-semibold" : "text-gray-600 group-hover:text-navy"}`}>{color}</span>
    </button>
  );
}

function ShopContent() {
  const rawParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLang();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const cat       = rawParams.get("category") as ProductCategory | null;
  const colors    = rawParams.getAll("color");
  const prices    = rawParams.getAll("price");
  const outsoles  = rawParams.getAll("outsole");
  const safetyToe = rawParams.get("safety");
  const sort      = rawParams.get("sort") ?? "default";

  function buildUrl(updater: (p: URLSearchParams) => void) {
    const p = new URLSearchParams(rawParams.toString());
    updater(p);
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function setParam(key: string, value: string | null) {
    buildUrl((p) => { p.delete(key); if (value !== null) p.set(key, value); });
  }

  function toggleMulti(key: string, value: string) {
    buildUrl((p) => {
      const current = p.getAll(key);
      p.delete(key);
      if (current.includes(value)) {
        current.filter((v) => v !== value).forEach((v) => p.append(key, v));
      } else {
        [...current, value].forEach((v) => p.append(key, v));
      }
    });
  }

  function clearAll() {
    router.push(pathname, { scroll: false });
  }

  // Filter
  let filtered = products.filter((p) => {
    if (cat && p.category !== cat) return false;
    if (colors.length && !colors.includes(p.colorLeather)) return false;
    if (prices.length) {
      const ranges = PRICE_RANGES.filter((r) => prices.includes(r.id));
      if (!ranges.some((r) => p.price >= r.min && p.price <= r.max)) return false;
    }
    if (outsoles.length) {
      const ol = p.outsoleType.toLowerCase();
      const match = outsoles.some((o) => {
        if (o === "wedge")    return ol.includes("wedge");
        if (o === "heel-lug") return ol.includes("heel");
        if (o === "cup")      return ol.includes("cup") || ol.includes("andes") || ol.includes("fornax") || ol.includes("cacique");
        return false;
      });
      if (!match) return false;
    }
    if (safetyToe === "yes" && !p.safetyToe) return false;
    if (safetyToe === "no"  &&  p.safetyToe) return false;
    return true;
  });

  // Sort
  if (sort === "price-asc")  filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "newest")     filtered = [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));

  const activeCount = (cat ? 1 : 0) + colors.length + prices.length + outsoles.length + (safetyToe ? 1 : 0);
  const uniqueColors = getUniqueColors();

  const FiltersPanel = (
    <div>
      <FilterSection title="Category">
        <CheckItem checked={!cat} onChange={clearAll} label={`All (${products.length})`} />
        {CATEGORIES.map((c) => {
          const count = products.filter((p) => p.category === c.id).length;
          return (
            <CheckItem
              key={c.id}
              checked={cat === c.id}
              onChange={() => setParam("category", cat === c.id ? null : c.id)}
              label={`${c.label} (${count})`}
            />
          );
        })}
      </FilterSection>

      <FilterSection title="Price Range">
        {PRICE_RANGES.map((r) => (
          <CheckItem
            key={r.id}
            checked={prices.includes(r.id)}
            onChange={() => toggleMulti("price", r.id)}
            label={r.label}
          />
        ))}
      </FilterSection>

      <FilterSection title="Leather Color">
        {uniqueColors.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            checked={colors.includes(c)}
            onChange={() => toggleMulti("color", c)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Outsole Type" defaultOpen={false}>
        {OUTSOLES.map((o) => (
          <CheckItem
            key={o.id}
            checked={outsoles.includes(o.id)}
            onChange={() => toggleMulti("outsole", o.id)}
            label={o.label}
          />
        ))}
      </FilterSection>

      <FilterSection title="Safety Toe" defaultOpen={false}>
        <CheckItem checked={safetyToe === "yes"} onChange={() => setParam("safety", safetyToe === "yes" ? null : "yes")} label="Yes – CT EH" />
        <CheckItem checked={safetyToe === "no"}  onChange={() => setParam("safety", safetyToe === "no"  ? null : "no")}  label="No – Soft Toe" />
      </FilterSection>

      {activeCount > 0 && (
        <button type="button" onClick={clearAll} className="text-red text-sm font-semibold hover:underline mt-1">
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-10">

        {/* Sidebar – desktop */}
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-2">
            <p className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-4">Filters</p>
            {FiltersPanel}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-black text-navy">
                {cat ? `${cat} Boots` : t.shop.title}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">{filtered.length} styles</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mobile filter button */}
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:border-navy transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
                </svg>
                Filters
                {activeCount > 0 && (
                  <span className="bg-navy text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeCount}</span>
                )}
              </button>

              {/* Sort */}
              <select
                value={sort}
                onChange={(e) => setParam("sort", e.target.value === "default" ? null : e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active filter chips */}
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {cat && (
                <span className="inline-flex items-center gap-1 bg-navy text-white text-xs px-3 py-1 rounded-full">
                  {cat}
                  <button type="button" onClick={() => setParam("category", null)} className="ml-0.5 hover:text-tan">×</button>
                </span>
              )}
              {colors.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 bg-navy text-white text-xs px-2 py-1 rounded-full">
                  <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: COLOR_SWATCHES[c] ?? "#999" }} />
                  {c}
                  <button type="button" onClick={() => toggleMulti("color", c)} className="ml-0.5 hover:text-tan">×</button>
                </span>
              ))}
              {prices.map((p) => (
                <span key={p} className="inline-flex items-center gap-1 bg-navy text-white text-xs px-3 py-1 rounded-full">
                  {PRICE_RANGES.find((r) => r.id === p)?.label}
                  <button type="button" onClick={() => toggleMulti("price", p)} className="ml-0.5 hover:text-tan">×</button>
                </span>
              ))}
              {outsoles.map((o) => (
                <span key={o} className="inline-flex items-center gap-1 bg-navy text-white text-xs px-3 py-1 rounded-full">
                  {OUTSOLES.find((r) => r.id === o)?.label}
                  <button type="button" onClick={() => toggleMulti("outsole", o)} className="ml-0.5 hover:text-tan">×</button>
                </span>
              ))}
              {safetyToe && (
                <span className="inline-flex items-center gap-1 bg-navy text-white text-xs px-3 py-1 rounded-full">
                  Safety Toe: {safetyToe === "yes" ? "Yes" : "No"}
                  <button type="button" onClick={() => setParam("safety", null)} className="ml-0.5 hover:text-tan">×</button>
                </span>
              )}
              <button type="button" onClick={clearAll} className="text-xs text-gray-400 hover:text-red underline self-center">Clear all</button>
            </div>
          )}

          {/* Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-500 mb-4">{t.shop.noResults}</p>
              <button type="button" onClick={clearAll} className="btn-primary">{t.shop.allCategories}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <ProductCard key={p.stockNo} product={p} />
              ))}
            </div>
          )}

          {/* Category cards */}
          <div className="mt-16 border-t border-gray-100 pt-12">
            <h2 className="text-xl font-black text-navy mb-6">{t.shopByCategory.h2}</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((c) => {
                const count = products.filter((p) => p.category === c.id).length;
                const isActive = cat === c.id;
                const BG: Record<string, string> = {
                  Work:     "bg-navy",
                  Casual:   "bg-[#6B3A2A]",
                  Outdoors: "bg-[#2D5016]",
                  Safety:   "bg-[#8B1A1A]",
                };
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setParam("category", isActive ? null : c.id)}
                    className={`relative rounded-xl p-6 text-left transition hover:scale-[1.02] hover:shadow-lg ${BG[c.id]} ${isActive ? "ring-4 ring-offset-2 ring-navy" : ""}`}
                  >

                    <p className="font-black text-white text-lg leading-tight">{c.label}</p>
                    <p className="text-white/60 text-xs mt-1">{count} styles</p>
                    {isActive && (
                      <span className="absolute top-3 right-3 bg-white text-navy text-xs font-bold px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-black text-navy text-lg">Filters</h2>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="text-gray-400 hover:text-navy text-2xl leading-none">&times;</button>
            </div>
            {FiltersPanel}
            <button type="button" onClick={() => setMobileFiltersOpen(false)} className="w-full btn-primary mt-6">
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-cream border-b border-cream-dark py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500">
          <a href="/" className="hover:text-navy">Home</a>
          {" / "}
          <span className="text-navy font-medium">Shop</span>
        </div>
      </div>
      <Suspense fallback={<div className="p-20 text-center text-gray-400">Loading…</div>}>
        <ShopContent />
      </Suspense>
    </div>
  );
}
