"use client";

import { useEffect, useState } from "react";

interface Addr {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

const blank = (): Addr => ({ id: crypto.randomUUID(), label: "", line1: "", city: "", state: "", zip: "", country: "US" });

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Addr[]>([]);
  const [editing, setEditing] = useState<Addr | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/account/addresses").then((r) => r.json()).then((d) => {
      setAddresses(Array.isArray(d) ? d : []);
      setLoading(false);
    });
  }, []);

  async function persist(next: Addr[]) {
    setSaving(true);
    const res = await fetch("/api/account/addresses", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addresses: next }),
    });
    const saved = await res.json();
    setAddresses(Array.isArray(saved) ? saved : next);
    setSaving(false);
  }

  function saveEditing() {
    if (!editing) return;
    if (!editing.line1 || !editing.city || !editing.state || !editing.zip) return;
    const exists = addresses.some((a) => a.id === editing.id);
    const next = exists ? addresses.map((a) => (a.id === editing.id ? editing : a)) : [...addresses, editing];
    if (next.length === 1) next[0].isDefault = true;
    setEditing(null);
    persist(next);
  }

  function remove(id: string) {
    persist(addresses.filter((a) => a.id !== id));
  }

  function makeDefault(id: string) {
    persist(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
  }

  const inputCls = "w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-navy";

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-navy">Saved Addresses</h3>
        {!editing && (
          <button onClick={() => setEditing(blank())} className="text-sm font-bold text-navy hover:text-red transition">
            + Add address
          </button>
        )}
      </div>

      {addresses.length === 0 && !editing && (
        <p className="text-sm text-gray-400">No saved addresses yet. Add one so checkout is faster next time.</p>
      )}

      {/* List */}
      {!editing && addresses.map((a) => (
        <div key={a.id} className="flex items-start justify-between gap-4 border border-gray-200 rounded-xl p-4">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-navy text-sm">{a.label || "Address"}</p>
              {a.isDefault && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Default</span>}
            </div>
            <p className="text-sm text-gray-600">{a.line1}, {a.city}, {a.state} {a.zip}, {a.country}</p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0 text-xs font-bold">
            <button onClick={() => setEditing({ ...a })} className="text-navy hover:text-red transition">Edit</button>
            {!a.isDefault && <button onClick={() => makeDefault(a.id)} className="text-gray-400 hover:text-navy transition">Set default</button>}
            <button onClick={() => remove(a.id)} className="text-red hover:underline">Delete</button>
          </div>
        </div>
      ))}

      {/* Editor */}
      {editing && (
        <div className="border-2 border-navy/20 rounded-xl p-5 space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Label</label>
            <input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Home, Work…" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Street Address</label>
            <input value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} autoComplete="street-address" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
              <input value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">State</label>
              <input value={editing.state} onChange={(e) => setEditing({ ...editing, state: e.target.value })} placeholder="MI" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ZIP</label>
              <input value={editing.zip} onChange={(e) => setEditing({ ...editing, zip: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Country</label>
              <select value={editing.country} onChange={(e) => setEditing({ ...editing, country: e.target.value })} className={inputCls}>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={saveEditing} disabled={saving} className="px-5 py-2 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/80 transition disabled:opacity-50">
              {saving ? "Saving…" : "Save address"}
            </button>
            <button onClick={() => setEditing(null)} className="px-5 py-2 border-2 border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:border-navy transition">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
