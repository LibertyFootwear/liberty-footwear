"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Current {
  price: number;
  description: string;
  shortDescription: string;
  isNew: boolean;
  popular: boolean;
  hidden: boolean;
}

export default function ProductEditForm({
  stockNo, slug, current, original,
}: {
  stockNo: string;
  slug: string;
  current: Current;
  original: { price: number; description: string; shortDescription: string };
}) {
  const [form, setForm] = useState<Current>(current);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  function set<K extends keyof Current>(key: K, value: Current[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/products/${stockNo}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  async function resetToDefault() {
    setSaving(true);
    await fetch(`/api/admin/products/${stockNo}`, { method: "DELETE" });
    setSaving(false);
    router.refresh();
    setForm({
      price: original.price,
      description: original.description,
      shortDescription: original.shortDescription,
      isNew: form.isNew,
      popular: form.popular,
      hidden: false,
    });
  }

  return (
    <div className="space-y-6">
      {/* Price */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Price (USD)</label>
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-gray-400">$</span>
          <input
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => set("price", parseFloat(e.target.value) || 0)}
            className="w-32 border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-navy transition"
          />
          {form.price !== original.price && (
            <span className="text-xs text-gray-400">was ${original.price}</span>
          )}
        </div>
      </div>

      {/* Short description */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Short Description</label>
        <input
          type="text"
          value={form.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
          placeholder="e.g. 6″ Mocc Toe water resistant"
          className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-navy transition"
        />
      </div>

      {/* Description */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Full Description</label>
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={8}
          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy transition leading-relaxed"
        />
        <p className="text-xs text-gray-400 mt-2">{form.description.length} characters</p>
      </div>

      {/* Toggles */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
        {[
          { key: "hidden" as const, label: "Hide from shop", desc: "Product won't appear in the catalog or be purchasable" },
          { key: "isNew" as const, label: "Show \"New\" badge", desc: "Highlights the product as newly added" },
          { key: "popular" as const, label: "Show \"Popular\" badge", desc: "Marks the product as a customer favorite" },
        ].map((t) => (
          <label key={t.key} className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form[t.key]}
              onChange={(e) => set(t.key, e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-navy"
            />
            <div>
              <p className="font-bold text-navy text-sm">{t.label}</p>
              <p className="text-xs text-gray-500">{t.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="px-6 py-3 bg-navy text-white font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50"
        >
          {saved ? "✓ Saved" : saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          onClick={resetToDefault}
          disabled={saving}
          className="px-6 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-lg hover:border-red hover:text-red transition disabled:opacity-50"
        >
          Reset to Original
        </button>
        <Link
          href={`/shop/${slug}`}
          target="_blank"
          className="ml-auto text-sm font-bold text-navy hover:text-red transition"
        >
          View on site →
        </Link>
      </div>
    </div>
  );
}
