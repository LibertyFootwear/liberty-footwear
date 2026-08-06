"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminLogoutButton from "./AdminLogoutButton";

const NAV = [
  { href: "/admin",            label: "Dashboard",        icon: "📊" },
  { href: "/admin/analytics",  label: "Analytics",        icon: "📈" },
  { href: "/admin/orders",     label: "Orders",           icon: "📦" },
  { href: "/admin/open-orders",label: "Open Orders",      icon: "📝" },
  { href: "/admin/sales",      label: "Retail Sales",     icon: "🏪" },
  { href: "/admin/customers",  label: "Customers",        icon: "👤" },
  { href: "/admin/products",   label: "Products",         icon: "👢" },
  { href: "/admin/inventory",  label: "Inventory",        icon: "🗃️" },
  { href: "/admin/reviews",    label: "Reviews",          icon: "⭐" },
  { href: "/admin/newsletter", label: "Newsletter",       icon: "✉️" },
  { href: "/admin/settings",   label: "Website Settings", icon: "⚙️" },
];

export default function AdminSidebar({ pending }: { pending: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-navy text-white flex items-center px-4 z-30">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-2 -ml-2">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-black ml-1">Admin Panel</span>
        {pending > 0 && (
          <span className="ml-auto bg-red text-white text-xs font-black rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
            {pending}
          </span>
        )}
      </header>

      {/* Overlay (mobile only, when open) */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} aria-hidden />
      )}

      {/* Sidebar — off-canvas on mobile, fixed on desktop */}
      <aside
        className={`w-56 bg-navy text-white flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-5 py-6 border-b border-white/10 flex items-start justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-white/40 mb-1">Liberty Footwear</p>
            <p className="font-black text-lg leading-tight">Admin Panel</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="md:hidden p-1 -mr-1 text-white/60 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          {NAV.map((n) => {
            const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  active ? "bg-white/15 text-white" : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                <span>{n.icon}</span>
                {n.label}
                {n.href === "/admin/orders" && pending > 0 && (
                  <span className="ml-auto bg-red text-white text-xs font-black rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center animate-pulse">
                    {pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-white/40">Admin</p>
          <AdminLogoutButton />
          <Link href="/" className="text-xs text-white/60 hover:text-white transition mt-1 block">← Back to site</Link>
        </div>
      </aside>
    </>
  );
}
