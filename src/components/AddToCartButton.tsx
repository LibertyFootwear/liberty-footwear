"use client";

import { useState } from "react";
import { Product } from "@/data/products";
import { useCart } from "@/context/CartContext";

interface Props {
  product: Product;
  sizeOptions: string[];
}

export default function AddToCartButton({ product, sizeOptions }: Props) {
  const [selectedSize, setSelectedSize] = useState("");
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  function handleAdd() {
    if (!selectedSize) return;
    addItem(product, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">
          Select Size
        </label>
        <select
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm font-semibold focus:outline-none focus:border-navy transition"
        >
          <option value="">Choose a size…</option>
          {sizeOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <button
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
        {added ? "✓ Added to Cart!" : "Add to Cart"}
      </button>
    </div>
  );
}
