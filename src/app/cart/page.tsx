"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";

const POPULAR = products.filter((p) => p.image).slice(0, 4);

const COUPONS: Record<string, number> = {
  LIBERTY10: 10,
  LIBERTY15: 15,
  WELCOME20: 20,
};

export default function CartPage() {
  const { items, subtotal, removeItem, increment, decrement } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<"ship" | "pickup">("ship");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");

  const discount = appliedCoupon ? COUPONS[appliedCoupon] : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.06 * 100) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (COUPONS[code]) {
      setAppliedCoupon(code);
      setCouponError("");
    } else {
      setCouponError("Invalid coupon code.");
      setAppliedCoupon(null);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  }

  async function checkout() {
    setLoading(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          stockNo: i.product.stockNo,
          name: `${i.product.name} – ${i.product.colorLeather} (${i.size})`,
          price: i.product.price,
          qty: i.qty,
        })),
        coupon: appliedCoupon,
        discount,
        shippingMethod,
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert("Checkout error. Please try again."); setLoading(false); }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white">
        {/* Empty state */}
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-black text-navy mb-3">Your cart is empty</h1>
          <p className="text-gray-500 text-lg mb-8">Every great pair of boots starts with one decision. Make yours today.</p>
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <Link href="/shop" className="bg-red hover:bg-red/90 text-white font-black px-8 py-3.5 rounded-xl transition shadow-lg shadow-red/20 text-sm tracking-wide uppercase">
              Shop All Boots
            </Link>
            <Link href="/contact" className="border-2 border-navy/20 hover:border-navy text-navy font-semibold px-8 py-3.5 rounded-xl transition text-sm">
              Get Custom Fitted
            </Link>
          </div>
          {/* Trust line */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-gray-400 mt-4">
            <span>✓ Free shipping on all orders</span>
            <span>✓ 30-day returns</span>
            <span>✓ Handcrafted in Michigan</span>
          </div>
        </div>

        {/* Popular products */}
        <div className="bg-cream py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-red text-xs font-black tracking-widest uppercase mb-2">Most Popular</p>
                <h2 className="text-2xl lg:text-3xl font-black text-navy">Customers Love These</h2>
              </div>
              <Link href="/shop" className="text-sm font-bold text-navy hover:text-red transition hidden sm:block">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {POPULAR.map((p) => (
                <ProductCard key={p.stockNo} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-cream border-b border-cream-dark py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500">
          <Link href="/" className="hover:text-navy">Home</Link> / <span className="text-navy font-medium">Cart</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-navy">Shopping Cart</h1>
          <Link href="/shop" className="text-sm font-semibold text-navy hover:text-red transition">
            ← Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.product.stockNo}-${item.size}`} className="flex gap-4 bg-cream rounded-xl p-4">
                <div className="relative w-24 h-24 flex-shrink-0 bg-white rounded-lg overflow-hidden">
                  {item.product.image ? (
                    <Image src={item.product.image} alt={item.product.name} fill className="object-contain p-2 mix-blend-multiply" sizes="96px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" /></svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-navy">{item.product.name}</h3>
                  <p className="text-sm text-gray-500">{item.product.colorLeather} · Size {item.size}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button onClick={() => decrement(item.product.stockNo, item.size)} className="w-8 h-8 rounded-full border border-gray-300 font-bold hover:border-navy transition">−</button>
                    <span className="font-bold w-6 text-center">{item.qty}</span>
                    <button onClick={() => increment(item.product.stockNo, item.size)} className="w-8 h-8 rounded-full border border-gray-300 font-bold hover:border-navy transition">+</button>
                    <button onClick={() => removeItem(item.product.stockNo, item.size)} className="ml-4 text-xs text-red hover:underline">Remove</button>
                  </div>
                </div>
                <p className="font-black text-lg text-gray-900 flex-shrink-0">${item.product.price * item.qty}</p>
              </div>
            ))}

            {/* Account creation prompt for guests */}
            {!user && (
              <div className="flex items-start gap-4 bg-navy/5 border border-navy/20 rounded-xl p-5 mt-2">
                <div className="text-2xl flex-shrink-0">👟</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy text-sm mb-1">Checkout faster with a free account</p>
                  <p className="text-xs text-gray-600 mb-3">Save your order history, reorder your favorite boots in one click, and skip re-entering your details next time.</p>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/register" className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/80 transition">Create account — it&apos;s free</Link>
                    <Link href="/login" className="px-4 py-2 border border-navy text-navy text-xs font-bold rounded-lg hover:bg-navy/5 transition">Sign in</Link>
                  </div>
                </div>
              </div>
            )}

            {/* Coupon */}
            <div className="border border-gray-200 rounded-xl p-5 mt-2">
              <p className="text-sm font-bold text-navy mb-3">Have a coupon code?</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <span className="text-sm font-semibold text-green-700">
                    ✓ <span className="font-mono">{appliedCoupon}</span> — ${discount} off applied
                  </span>
                  <button onClick={removeCoupon} className="text-xs text-gray-400 hover:text-red transition">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => { setCouponInput(e.target.value); setCouponError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    placeholder="Enter coupon code"
                    className="flex-1 border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-navy transition"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-5 py-2 bg-navy text-white text-sm font-semibold rounded-lg hover:bg-navy/80 transition"
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && <p className="text-xs text-red mt-2">{couponError}</p>}
            </div>
          </div>

          {/* Shipping method */}
          <div className="border border-gray-200 rounded-xl p-5 mt-2">
            <p className="text-sm font-bold text-navy mb-3">Delivery method</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setShippingMethod("ship")}
                className={`flex-1 flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                  shippingMethod === "ship" ? "border-navy bg-navy/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="mt-0.5 text-xl">📦</span>
                <div>
                  <p className="font-bold text-navy text-sm">Ship to me</p>
                  <p className="text-xs text-gray-500 mt-0.5">Free · 3–7 business days</p>
                </div>
                {shippingMethod === "ship" && (
                  <span className="ml-auto mt-0.5 w-4 h-4 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShippingMethod("pickup")}
                className={`flex-1 flex items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
                  shippingMethod === "pickup" ? "border-navy bg-navy/5" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="mt-0.5 text-xl">🏪</span>
                <div>
                  <p className="font-bold text-navy text-sm">Pick up in store</p>
                  <p className="text-xs text-gray-500 mt-0.5">Free · Grand Rapids, MI · You'll be notified when ready</p>
                </div>
                {shippingMethod === "pickup" && (
                  <span className="ml-auto mt-0.5 w-4 h-4 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                    <span className="w-2 h-2 rounded-full bg-white" />
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-cream rounded-xl p-6 sticky top-24">
              <h2 className="font-black text-navy text-xl mb-6">Order Summary</h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon ({appliedCoupon})</span>
                    <span className="font-semibold">−${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (6% MI)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-cream-dark pt-3 flex justify-between font-black text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              <button
                onClick={checkout}
                disabled={loading}
                className="w-full py-4 text-base font-bold rounded-lg uppercase tracking-wide transition bg-amber-500 hover:bg-amber-400 text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Redirecting…" : "Proceed to Checkout →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
