"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Product, parseSizes } from "@/data/products";
import { useCart } from "@/context/CartContext";

const LEATHER_COLORS: Record<string, string> = {
  "Jet Black":  "#1a1a1a",
  "Black":      "#1a1a1a",
  "Coffee":     "#6B3A2A",
  "Chestnut":   "#954535",
  "Honey":      "#C8860A",
  "Tan":        "#C19A6B",
  "Brown":      "#7B4F2E",
  "Dark Brown": "#4A2C17",
  "Russet":     "#8B3A1A",
  "Mocha":      "#6B4226",
  "Blue":       "#1e3a5f",
};

const OUTSOLE_COLOR_HEX: Record<string, string> = {
  "Black": "#1a1a1a",
  "Cream": "#F5F0E8",
  "Gum":   "#C8A040",
  "Brown": "#7B4F2E",
  "White": "#FFFFFF",
};

const OUTSOLE_LABELS: Record<string, string> = {
  "Wedge rubber blend":  "Wedge",
  "Heel lug":            "Heel Lug",
  "Andes outdoor hiker": "Hiker",
  "Andes rubber cup":    "Hiker",
  "Fornax rubber cup":   "Work Hiker",
  "Cacique rubber cup":  "City Hiker",
  "Rubber":              "Rubber",
};

interface Props {
  product: Product;
  variants: Product[];
}

export default function ProductOptions({ product, variants }: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const isApparel = !!product.apparelSizes?.length;

  const sizeMap = parseSizes(product.sizes);
  const widths = Object.keys(sizeMap);
  const [selectedWidth, setSelectedWidth] = useState(widths[0] ?? "M");
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [apparelSize, setApparelSize] = useState<string | null>(null);
  const sizes = sizeMap[selectedWidth] ?? [];

  const sizeLabel = isApparel ? apparelSize : (selectedSize ? `${selectedWidth} ${selectedSize}` : null);

  // Leather colors — pick first variant per color as representative
  const leatherColors = [...new Map(variants.map((v) => [v.colorLeather, v])).values()];

  // Outsole types available for current leather color
  const sameColor = variants.filter((v) => v.colorLeather === product.colorLeather);
  const outsoleTypes = [...new Map(sameColor.map((v) => [v.outsoleType, v])).values()];

  // Outsole colors available for current leather color + outsole type
  const sameColorAndType = variants.filter(
    (v) => v.colorLeather === product.colorLeather && v.outsoleType === product.outsoleType
  );
  const outsoleColors = [...new Map(sameColorAndType.map((v) => [v.colorOutsole, v])).values()];

  function go(color: string, outsoleType: string, outsoleColor: string) {
    const target = variants.find(
      (v) => v.colorLeather === color && v.outsoleType === outsoleType && v.colorOutsole === outsoleColor
    ) ?? variants.find(
      (v) => v.colorLeather === color && v.outsoleType === outsoleType
    );
    if (target && target.slug !== product.slug) router.push(`/shop/${target.slug}`);
  }

  function handleAdd() {
    if (!sizeLabel) return;
    addItem(product, sizeLabel);
    setAdded(true);
    setTimeout(() => setAdded(false), 4000);
  }

  return (
    <div className="space-y-6">

      {/* Leather color */}
      {leatherColors.length > 1 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            {isApparel ? "Color" : "Leather Color"} — <span className="text-navy normal-case font-semibold">{product.colorLeather}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {leatherColors.map((v) => {
              const hex = LEATHER_COLORS[v.colorLeather] ?? "#888";
              const active = v.colorLeather === product.colorLeather;
              return (
                <button
                  key={v.colorLeather}
                  type="button"
                  title={v.colorLeather}
                  onClick={() => go(v.colorLeather, product.outsoleType, product.colorOutsole)}
                  className={`w-9 h-9 rounded-full border-2 transition ${
                    active ? "border-navy scale-110 shadow-md" : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Outsole type */}
      {outsoleTypes.length > 1 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Outsole Style</p>
          <div className="flex gap-2 flex-wrap">
            {outsoleTypes.map((v) => {
              const active = v.outsoleType === product.outsoleType;
              return (
                <button
                  key={v.outsoleType}
                  type="button"
                  onClick={() => go(product.colorLeather, v.outsoleType, product.colorOutsole)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition ${
                    active ? "border-navy bg-navy text-white" : "border-gray-200 text-gray-700 hover:border-navy"
                  }`}
                >
                  {OUTSOLE_LABELS[v.outsoleType] ?? v.outsoleType}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Outsole color */}
      {outsoleColors.length > 1 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Sole Color — <span className="text-navy normal-case font-semibold">{product.colorOutsole}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            {outsoleColors.map((v) => {
              const hex = OUTSOLE_COLOR_HEX[v.colorOutsole] ?? "#888";
              const active = v.colorOutsole === product.colorOutsole;
              const isLight = ["Cream", "White", "Gum"].includes(v.colorOutsole);
              return (
                <button
                  key={v.colorOutsole}
                  type="button"
                  title={v.colorOutsole}
                  onClick={() => go(product.colorLeather, product.outsoleType, v.colorOutsole)}
                  className={`w-9 h-9 rounded-full border-2 transition ${
                    active ? "border-navy scale-110 shadow-md" : isLight ? "border-gray-300 hover:border-gray-500" : "border-gray-200 hover:border-gray-400"
                  }`}
                  style={{ backgroundColor: hex }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Width */}
      {widths.length > 1 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Width</p>
          <div className="flex gap-2 flex-wrap">
            {widths.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => { setSelectedWidth(w); setSelectedSize(null); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold border-2 transition ${
                  selectedWidth === w ? "border-navy bg-navy text-white" : "border-gray-200 text-gray-700 hover:border-navy"
                }`}
              >
                {w === "EW" ? "Extra Wide" : "Medium"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          Size{sizeLabel ? ` — ${sizeLabel}` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {isApparel
            ? product.apparelSizes!.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setApparelSize(s)}
                  className={`min-w-12 h-12 px-3 rounded-lg text-sm font-semibold border-2 transition ${
                    apparelSize === s ? "border-navy bg-navy text-white" : "border-gray-200 text-gray-700 hover:border-navy"
                  }`}
                >
                  {s}
                </button>
              ))
            : sizes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSelectedSize(s)}
                  className={`w-12 h-12 rounded-lg text-sm font-semibold border-2 transition ${
                    selectedSize === s ? "border-navy bg-navy text-white" : "border-gray-200 text-gray-700 hover:border-navy"
                  }`}
                >
                  {s}
                </button>
              ))}
        </div>
      </div>

      {/* Add to Cart */}
      <button
        type="button"
        onClick={handleAdd}
        disabled={!sizeLabel}
        className={`w-full py-4 rounded-lg font-bold text-base uppercase tracking-wide transition ${
          sizeLabel
            ? "bg-red hover:bg-red-dark text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {sizeLabel ? `Add to Cart — ${sizeLabel}` : "Select a Size"}
      </button>

      {/* Toast */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${added ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
        <div className="flex items-center gap-4 bg-navy text-white px-5 py-4 rounded-2xl shadow-2xl min-w-72">
          <span className="text-green-400 text-xl">✓</span>
          <div className="flex-1">
            <p className="font-bold text-sm">Added to cart!</p>
            <p className="text-xs text-white/60">{product.name} · {sizeLabel}</p>
          </div>
          <Link
            href="/cart"
            className="bg-amber-500 hover:bg-amber-400 text-white text-xs font-black px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            Go to Cart →
          </Link>
        </div>
      </div>
    </div>
  );
}
