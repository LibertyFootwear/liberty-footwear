"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import type { Order } from "@/lib/ordersDb";
import type { Review } from "@/lib/reviewsDb";
import type { Notifications } from "@/lib/userDb";
import { defaultNotifications } from "@/lib/userDb";

type Tab = "overview" | "orders" | "favorites" | "settings" | "password";

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

export default function AccountPage() {
  const { user, loading, logout, refresh } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [myReviews, setMyReviews] = useState<Review[]>([]);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  // Settings form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notifications, setNotifications] = useState<Notifications>(defaultNotifications);
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
      setNotifications(user.notifications ?? defaultNotifications);
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

  useEffect(() => {
    if (user && !reviewsLoaded) {
      fetch("/api/reviews?mine=1").then((r) => r.json()).then((data) => {
        setMyReviews(Array.isArray(data) ? data : []);
        setReviewsLoaded(true);
      });
    }
  }, [user, reviewsLoaded]);

  const recentSlugs = useRecentlyViewed();
  const recentProducts = recentSlugs
    .map((s) => products.find((p) => p.slug === s))
    .filter(Boolean) as typeof products;

  const recommendedProducts = products
    .filter((p) => !recentSlugs.includes(p.slug))
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-navy text-lg">Loading…</div>
      </main>
    );
  }

  const favoriteProducts = products.filter((p) => user.favorites.includes(p.slug));

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
      body: JSON.stringify({ name, email, phone, notifications }),
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
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    setPasswordStatus("saving");
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
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
      id: "overview",
      label: "Overview",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
    },
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
      label: "Settings",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
    },
    {
      id: "password",
      label: "Password",
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
    },
  ];

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
    <main className="min-h-screen bg-cream">
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-navy flex items-center justify-center text-white font-black text-xl">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-black text-navy">{user.name}</h1>
              <p className="text-gray-500 text-sm">{user.email}</p>
              <p className="text-gray-400 text-xs mt-0.5">Member since {new Date(user.createdAt ?? Date.now()).getFullYear()}</p>
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
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition ${
                tab === t.id
                  ? "bg-navy text-white shadow-sm"
                  : "bg-white text-gray-500 hover:text-navy border border-gray-200"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="space-y-8">

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Orders", value: orders.length, icon: "📦" },
                { label: "Saved", value: favoriteProducts.length, icon: "🤍" },
                { label: "Reviews", value: myReviews.length, icon: "⭐" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl shadow-sm p-5 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-black text-navy">{s.value}</div>
                  <div className="text-xs text-gray-400 font-medium">{s.label}</div>
                </div>
              ))}
            </div>

            {/* My Reviews */}
            <div>
              <h2 className="text-base font-black text-navy mb-4">My Reviews</h2>
              {myReviews.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                  <p className="text-gray-400 text-sm">You haven't written any reviews yet.</p>
                  <Link href="/shop" className="text-navy text-sm font-semibold mt-2 inline-block hover:text-red transition">Browse boots →</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myReviews.map((review) => {
                    const product = products.find((p) => p.stockNo === review.stockNo);
                    return (
                      <div key={review.id} className="bg-white rounded-2xl shadow-sm p-5 flex gap-4">
                        {product?.image && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                            <Image src={product.image} alt={product.name} width={56} height={56} className="w-full h-full object-contain p-1" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <div>
                              {product ? (
                                <Link href={`/shop/${product.slug}`} className="text-sm font-bold text-navy hover:text-red transition">
                                  {product.name}
                                </Link>
                              ) : (
                                <p className="text-sm font-bold text-navy">{review.stockNo}</p>
                              )}
                              <StarRating rating={review.rating} />
                            </div>
                            <p className="text-xs text-gray-400">
                              {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{review.text}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recently Viewed */}
            {recentProducts.length > 0 && (
              <div>
                <h2 className="text-base font-black text-navy mb-4">Recently Viewed</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {recentProducts.slice(0, 4).map((p) => (
                    <ProductCard key={p.slug} product={p} />
                  ))}
                </div>
              </div>
            )}

            {/* Recommended */}
            <div>
              <h2 className="text-base font-black text-navy mb-4">Recommended for You</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {recommendedProducts.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ── ORDERS ── */}
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
                {orders.map((order) => (
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
                                <Image src={product.image} alt={item.name} width={48} height={48} className="w-full h-full object-contain p-1" />
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
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FAVORITES ── */}
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

        {/* ── SETTINGS ── */}
        {tab === "settings" && (
          <div className="space-y-6 max-w-lg">
            <form onSubmit={saveSettings} className="bg-white rounded-2xl shadow-sm p-8 space-y-5">
              <h2 className="text-lg font-black text-navy">Account Details</h2>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Full Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Phone (optional)</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition" />
              </div>

              <div className="border-t border-gray-100 pt-5">
                <h3 className="text-sm font-black text-navy mb-4">Email Preferences</h3>
                <div className="space-y-3">
                  {([
                    { key: "specialOffers", label: "Special Offers & Deals", desc: "Discounts, seasonal sales, and limited-time promotions" },
                    { key: "newsletter", label: "Newsletter", desc: "Boot care tips, craftsmanship stories, and company news" },
                    { key: "blog", label: "Blog & Articles", desc: "New posts about boots, leather care, and working life" },
                    { key: "newProducts", label: "New Products", desc: "Be first to know when new styles drop" },
                  ] as { key: keyof Notifications; label: string; desc: string }[]).map(({ key, label, desc }) => (
                    <label key={key} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={notifications[key]}
                        onChange={(e) => setNotifications((n) => ({ ...n, [key]: e.target.checked }))}
                        className="w-4 h-4 mt-0.5 accent-navy flex-shrink-0"
                      />
                      <div>
                        <span className="text-sm font-semibold text-navy group-hover:text-red transition">{label}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {settingsError && <p className="text-red text-sm">{settingsError}</p>}
              <button type="submit" disabled={settingsStatus === "saving"}
                className="w-full bg-navy hover:bg-navy/80 disabled:opacity-50 text-white font-black py-3 rounded-xl transition text-sm">
                {settingsStatus === "saving" ? "Saving…" : "Save Changes"}
              </button>
              {settingsStatus === "ok" && <p className="text-green-600 text-sm text-center font-semibold">Changes saved!</p>}
            </form>
          </div>
        )}

        {/* ── PASSWORD ── */}
        {tab === "password" && (
          <div className="bg-white rounded-2xl shadow-sm p-8 max-w-lg">
            <h2 className="text-lg font-black text-navy mb-6">Change Password</h2>
            <form onSubmit={savePassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition" />
                <p className="text-xs text-gray-400 mt-1">Minimum 8 characters</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition" />
              </div>
              {passwordError && <p className="text-red text-sm">{passwordError}</p>}
              <button type="submit" disabled={passwordStatus === "saving"}
                className="w-full bg-navy hover:bg-navy/80 disabled:opacity-50 text-white font-black py-3 rounded-xl transition text-sm">
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
