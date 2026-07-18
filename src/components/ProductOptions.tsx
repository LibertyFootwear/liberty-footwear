"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const sizeMap = parseSizes(product.sizes);
  const widths = Object.keys(sizeMap);
  const [selectedWidth, setSelectedWidth] = useState(widths[0] ?? "M");
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const sizes = sizeMap[selectedWidth] ?? [];

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
    if (!selectedSize) return;
    addItem(product, `${selectedWidth} ${selectedSize}`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-6">

      {/* Leather color */}
      {leatherColors.length > 1 && (
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
            Leather Color — <span className="text-navy normal-case font-semibold">{product.colorLeather}</span>
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
                {w === "EW" ? "EW (Extra Wide)" : "M (Medium)"}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size */}
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          Size{selectedSize ? ` — ${selectedWidth} ${selectedSize}` : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          {sizes.map((s) => (
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
        disabled={!selectedSize}
        className={`w-full py-4 rounded-lg font-bold text-base uppercase tracking-wide transition ${
          added
            ? "bg-green-600 text-white"
            : selectedSize
            ? "bg-red hover:bg-red-dark text-white"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
      >
        {added ? "✓ Added to Cart!" : selectedSize ? `Add to Cart — ${selectedWidth} ${selectedSize}` : "Select a Size"}
      </button>
    </div>
  );
}
