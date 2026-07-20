import { requireAdmin } from "@/lib/adminAuth";
import Link from "next/link";

const NAV = [
  { href: "/admin",            label: "Dashboard",   icon: "📊" },
  { href: "/admin/analytics",  label: "Analytics",   icon: "📈" },
  { href: "/admin/orders",     label: "Orders",      icon: "📦" },
  { href: "/admin/customers",  label: "Customers",   icon: "👤" },
  { href: "/admin/products",   label: "Products",    icon: "👢" },
  { href: "/admin/inventory",  label: "Inventory",   icon: "🗃️" },
  { href: "/admin/reviews",    label: "Reviews",     icon: "⭐" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-navy text-white flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-xs font-bold tracking-widest uppercase text-white/40 mb-1">Liberty Footwear</p>
          <p className="font-black text-lg leading-tight">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <span>{n.icon}</span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-white/40">Admin</p>
          <Link href="/" className="text-xs text-white/60 hover:text-white transition mt-1 block">← Back to site</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
