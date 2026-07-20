import { requireAdmin } from "@/lib/adminAuth";
import uppers from "@/data/uppers.json";

interface Upper {
  sku: string;
  name: string;
  m: Record<string, string>;
  ew: Record<string, string>;
}

export default async function AdminUppers() {
  await requireAdmin();
  const { date, sizes, products } = uppers as { date: string; sizes: string[]; products: Upper[] };

  function cellClass(v: string) {
    if (!v) return "text-gray-200";
    if (v.includes("+")) return "text-amber-600 font-semibold"; // has odd L/R singles
    return "text-navy font-semibold";
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-black text-navy mb-4">Inventory</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-8">
        <a href="/admin/inventory" className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-navy transition">Finished Boots</a>
        <a href="/admin/inventory/uppers" className="px-4 py-2 text-sm font-bold text-navy border-b-2 border-navy -mb-px">Uppers</a>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-400">Upper parts stock by SKU, width and size · {products.length} SKUs · as of {date}</p>
        <p className="text-xs text-gray-400">
          <span className="text-amber-600 font-semibold">+1R / +1L</span> = extra single right/left upper
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="text-xs whitespace-nowrap">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 font-bold text-gray-500 sticky left-0 bg-gray-50 z-10">SKU / Name</th>
              <th className="px-2 py-2 font-bold text-gray-500">W</th>
              {sizes.map((s) => (
                <th key={s} className="px-2 py-2 font-bold text-gray-500 text-center w-12">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              [
                <tr key={`${p.sku}-m`} className={i % 2 ? "bg-gray-50/40" : ""}>
                  <td className="px-3 py-1.5 sticky left-0 bg-inherit z-10 border-r border-gray-100" rowSpan={2}>
                    <p className="font-mono font-bold text-navy">{p.sku}</p>
                    <p className="text-gray-400">{p.name}</p>
                  </td>
                  <td className="px-2 py-1.5 text-center font-bold text-gray-400">M</td>
                  {sizes.map((s) => (
                    <td key={s} className={`px-2 py-1.5 text-center ${cellClass(p.m[s])}`}>{p.m[s] || "·"}</td>
                  ))}
                </tr>,
                <tr key={`${p.sku}-ew`} className={`${i % 2 ? "bg-gray-50/40" : ""} border-b border-gray-100`}>
                  <td className="px-2 py-1.5 text-center font-bold text-gray-400">EW</td>
                  {sizes.map((s) => (
                    <td key={s} className={`px-2 py-1.5 text-center ${cellClass(p.ew[s])}`}>{p.ew[s] || "·"}</td>
                  ))}
                </tr>,
              ]
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
