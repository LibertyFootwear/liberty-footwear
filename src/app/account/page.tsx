"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

type Tab = "orders" | "favorites" | "settings" | "password" | "recent";

export default function AccountPage() {
  const { user, loading, logout, refresh } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("orders");
  const [orders, setOrders] = useState<import("@/lib/ordersDb").Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);

  // Settings form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [settingsError, setSettingsError] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "ok" | "err">("idle");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/account/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone ?? "");
      setNewsletter(user.newsletter ?? false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !ordersLoaded) {
      fetch("/api/orders").then((r) => r.json()).then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setOrdersLoaded(true);
      });
    }
  }, [user, ordersLoaded]);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-navy text-lg">Loading…</div>
      </main>
    );
  }

  const favoriteProducts = products.filter((p) => user.favorites.includes(p.slug));
  const recentSlugs = useRecentlyViewed();
  const recentProducts = recentSlugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean) as typeof products;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    setSettingsStatus("saving");
    setSettingsError("");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, newsletter }),
    });
    if (res.ok) {
      await refresh();
      setSettingsStatus("ok");
      setTimeout(() => setSettingsStatus("idle"), 3000);
    } else {
      const data = await res.json();
      setSettingsError(data.error ?? "Something went wrong.");
      setSettingsStatus("err");
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    setPasswordStatus("saving");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordStatus("ok");
      setTimeout(() => setPasswordStatus("idle"), 3000);
    } else {
      const data = await res.json();
      setPasswordError(data.error ?? "Something went wrong.");
      setPasswordStatus("err");
    }
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: "orders",
      label: "My Orders",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" /></svg>,
    },
    {
      id: "favorites",
      label: "Saved Boots",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>,
    },
    {
      id: "settings",
      label: "Account Settings",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
    },
    {
      id: "password",
      label: "Change Password",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
    },
    {
      id: "recent",
      label: "Recently Viewed",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
    },
  ];

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-navy flex items-center justify-center text-white font-black text-lg">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black text-navy">{user.name}</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red transition border border-gray-200 rounded-lg px-4 py-2"
          >
            Sign Out
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                tab === t.id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-gray-500 hover:text-navy hover:border-navy border border-gray-200"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Orders */}
        {tab === "orders" && (
          <div>
            <p className="text-sm text-gray-500 mb-6">{orders.length} {orders.length === 1 ? "order" : "orders"}</p>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" /></svg>
                <p className="text-gray-500 mb-4">No orders yet.</p>
                <Link href="/shop" className="btn-primary">Browse the Shop</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const statusColors: Record<string, string> = {
                    paid: "bg-yellow-100 text-yellow-700",
                    processing: "bg-blue-100 text-blue-700",
                    shipped: "bg-purple-100 text-purple-700",
                    delivered: "bg-green-100 text-green-700",
                  };
                  const statusLabels: Record<string, string> = {
                    paid: "Order Received",
                    processing: "Processing",
                    shipped: "Shipped",
                    delivered: "Delivered",
                  };
                  return (
                    <div key={order.id} className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                        <div>
                          <p className="text-xs text-gray-400 font-medium">
                            {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-300 font-mono mt-0.5">{order.stripeSessionId.slice(0, 24)}…</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[order.status] ?? "bg-gray-100 text-gray-500"}`}>
                            {statusLabels[order.status] ?? order.status}
                          </span>
                          <span className="text-sm font-black text-navy">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {order.items.map((item, i) => {
                          const product = products.find((p) => p.stockNo === item.stockNo);
                          return (
                            <div key={i} className="flex items-center gap-4 py-3">
                              {product?.image && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                                  <img src={product.image} alt={item.name} className="w-full h-full object-contain p-1" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                {item.slug ? (
                                  <Link href={`/shop/${item.slug}`} className="text-sm font-semibold text-navy hover:text-red transition truncate block">{item.name}</Link>
                                ) : (
                                  <p className="text-sm font-semibold text-navy truncate">{item.name}</p>
                                )}
                                <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                              </div>
                              <p className="text-sm font-bold text-gray-700">${(item.price * item.qty).toFixed(2)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Favorites */}
        {tab === "favorites" && (
          <div>
            <p className="text-sm text-gray-500 mb-6">{favoriteProducts.length} saved {favoriteProducts.length === 1 ? "boot" : "boots"}</p>
            {favoriteProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
                <p className="text-gray-500 mb-4">You haven't saved any boots yet.</p>
                <Link href="/shop" className="btn-primary">Browse the Shop</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {favoriteProducts.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {tab === "settings" && (
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg">
            <h2 className="text-lg font-black text-navy mb-6">Account Settings</h2>
            <form onSubmit={saveSettings} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition"
                />
              </div>
              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newsletter}
                    onChange={(e) => setNewsletter(e.target.checked)}
                    className="w-4 h-4 accent-navy"
                  />
                  <div>
                    <span className="text-sm font-semibold text-navy">Email newsletter</span>
                    <p className="text-xs text-gray-400 mt-0.5">New styles, boot care tips, and limited runs</p>
                  </div>
                </label>
              </div>
              {settingsError && <p className="text-red text-sm">{settingsError}</p>}
              <button
                type="submit"
                disabled={settingsStatus === "saving"}
                className="w-full bg-navy hover:bg-navy/80 disabled:opacity-50 text-white font-black py-3 rounded-xl transition text-sm"
              >
                {settingsStatus === "saving" ? "Saving…" : "Save Changes"}
              </button>
              {settingsStatus === "ok" && <p className="text-green-600 text-sm text-center font-semibold">Changes saved!</p>}
            </form>
          </div>
        )}

        {/* Recently Viewed */}
        {tab === "recent" && (
          <div>
            <p className="text-sm text-gray-500 mb-6">{recentProducts.length} recently viewed {recentProducts.length === 1 ? "boot" : "boots"}</p>
            {recentProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <svg className="w-12 h-12 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                <p className="text-gray-500 mb-4">You haven't viewed any boots yet.</p>
                <Link href="/shop" className="btn-primary">Browse the Shop</Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {recentProducts.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Password */}
        {tab === "password" && (
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg">
            <h2 className="text-lg font-black text-navy mb-6">Change Password</h2>
            <form onSubmit={savePassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition"
                />
                <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition"
                />
              </div>
              {passwordError && <p className="text-red text-sm">{passwordError}</p>}
              <button
                type="submit"
                disabled={passwordStatus === "saving"}
                className="w-full bg-navy hover:bg-navy/80 disabled:opacity-50 text-white font-black py-3 rounded-xl transition text-sm"
              >
                {passwordStatus === "saving" ? "Updating…" : "Update Password"}
              </button>
              {passwordStatus === "ok" && <p className="text-green-600 text-sm text-center font-semibold">Password updated!</p>}
            </form>
          </div>
        )}

      </div>
    </main>
  );
}
