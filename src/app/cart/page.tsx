"use client";

import { useCart, itemUnitPrice, type CartItem } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { DEFAULT_ADDONS, INSOLE_CHOICES, ADDON_PRICES, addonsSurcharge, takesAddons, type BootAddons } from "@/lib/bootAddons";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { products } from "@/data/products";
import ProductCard from "@/components/ProductCard";
import SalesPausedBanner, { useSiteSettings } from "@/components/SalesPausedBanner";
import { isBootCategory, SMALL_ITEM_SHIPPING } from "@/lib/shipping";

const POPULAR = products.filter((p) => p.image).slice(0, 4);

const COUPONS: Record<string, number> = {
  LIBERTY10: 10,
  LIBERTY15: 15,
  WELCOME20: 20,
};

/** In-cart prompt (boots only) to change insoles or add paid upgrades. */
function CartItemAddons({ item, onChange }: { item: CartItem; onChange: (a: BootAddons) => void }) {
  const [open, setOpen] = useState(false);
  const a = item.addons ?? DEFAULT_ADDONS;
  const surcharge = addonsSurcharge(a);
  const summary = `${a.insole} insole${a.speedhooks ? " · Speedhooks" : ""}${a.toeBumpers ? " · Toe bumpers" : ""}`;

  return (
    <div className="mt-3 border-t border-cream-dark pt-3">
      <button onClick={() => setOpen((v) => !v)} className="flex items-center justify-between w-full text-left">
        <span className="text-xs text-gray-500">
          <span className="font-semibold text-navy">Insoles & upgrades:</span> {summary}
          {surcharge > 0 && <span className="text-gray-400"> (+${surcharge})</span>}
        </span>
        <span className="text-xs font-bold text-navy hover:text-red transition whitespace-nowrap ml-3">{open ? "Done" : "Change"}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Insole</p>
            <div className="flex gap-2 flex-wrap">
              {INSOLE_CHOICES.map((c) => (
                <button
                  key={c}
                  onClick={() => onChange({ ...a, insole: c })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${a.insole === c ? "border-navy bg-navy text-white" : "border-gray-200 text-gray-700 hover:border-navy"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Upgrades</p>
            <div className="flex gap-2 flex-wrap">
              {([
                { key: "speedhooks", label: "Speedhooks", price: ADDON_PRICES.speedhooks },
                { key: "toeBumpers", label: "Toe bumpers", price: ADDON_PRICES.toeBumpers },
              ] as const).map((u) => {
                const on = a[u.key];
                return (
                  <button
                    key={u.key}
                    onClick={() => onChange({ ...a, [u.key]: !a[u.key] })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition ${on ? "border-navy bg-navy text-white" : "border-gray-200 text-gray-700 hover:border-navy"}`}
                  >
                    {on ? "✓ " : "+ "}{u.label} (+${u.price})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const { items, subtotal, removeItem, increment, decrement, setAddons } = useCart();
  const { user } = useAuth();
  const siteSettings = useSiteSettings();
  const salesPaused = siteSettings ? !siteSettings.salesEnabled : false;
  const [shippingMethod, setShippingMethod] = useState<"ship" | "pickup">("ship");

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState("");

  const discount = appliedCoupon ? COUPONS[appliedCoupon] : 0;

  // Free shipping requires a boot; apparel / insoles / leather-care only pay a flat fee.
  const hasBoot = items.some((i) => isBootCategory(i.product.category));
  const shippingFee = shippingMethod !== "pickup" && items.length > 0 && !hasBoot ? SMALL_ITEM_SHIPPING : 0;

  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.06 * 100) / 100;
  const total = Math.round((taxableAmount + tax + shippingFee) * 100) / 100;

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
            <span>✓ Free shipping on boot orders</span>
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

  const cartStockNos = new Set(items.map((i) => i.product.stockNo));
  const crossSell = products.filter((p) => p.image && !cartStockNos.has(p.stockNo)).slice(0, 4);

  return (
    <div className="bg-white min-h-screen">
      {/* Step indicator */}
      <div className="bg-cream border-b border-cream-dark py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-0">
            {[
              { label: "Cart", step: 1, href: "/cart", active: true },
              { label: "Details", step: 2, href: null, active: false },
              { label: "Payment", step: 3, href: null, active: false },
            ].map((s, i) => (
              <div key={s.step} className="flex items-center">
                {i > 0 && <div className="w-12 sm:w-20 h-px bg-gray-300 mx-1" />}
                {s.href ? (
                  <Link href={s.href} className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${s.active ? "bg-navy text-white" : "bg-gray-200 text-gray-500"}`}>{s.step}</span>
                    <span className={`text-sm font-semibold hidden sm:block ${s.active ? "text-navy" : "text-gray-400"}`}>{s.label}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 cursor-default">
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black bg-gray-200 text-gray-400">{s.step}</span>
                    <span className="text-sm font-semibold hidden sm:block text-gray-400">{s.label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
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
              <div key={item.lineId} className="bg-cream rounded-xl p-4">
                <div className="flex gap-4">
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
                    <Link href={`/shop/${item.product.slug}`} className="font-bold text-navy hover:text-red transition">{item.product.name}</Link>
                    <p className="text-sm text-gray-500">{item.product.colorLeather} · Size {item.size}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <button onClick={() => decrement(item.lineId)} className="w-8 h-8 rounded-full border border-gray-300 font-bold hover:border-navy transition">−</button>
                      <span className="font-bold w-6 text-center">{item.qty}</span>
                      <button onClick={() => increment(item.lineId)} className="w-8 h-8 rounded-full border border-gray-300 font-bold hover:border-navy transition">+</button>
                      <button onClick={() => removeItem(item.lineId)} className="ml-4 text-xs text-red hover:underline">Remove</button>
                    </div>
                  </div>
                  <p className="font-black text-lg text-gray-900 flex-shrink-0 tabular-nums">${itemUnitPrice(item) * item.qty}</p>
                </div>
                {takesAddons(item.product.category) && (
                  <CartItemAddons item={item} onChange={(a) => setAddons(item.lineId, a)} />
                )}
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
                    <Link href="/account/register" className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/80 transition">Create account — it&apos;s free</Link>
                    <Link href="/account/login" className="px-4 py-2 border border-navy text-navy text-xs font-bold rounded-lg hover:bg-navy/5 transition">Sign in</Link>
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
            {/* Shipping method */}
            <div className="border border-gray-200 rounded-xl p-5">
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
                    <p className="text-xs text-gray-500 mt-0.5">{shippingFee > 0 ? `$${SMALL_ITEM_SHIPPING}` : "Free"} · 3–7 business days</p>
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
                    <p className="text-xs text-gray-500 mt-0.5">Free · Grand Rapids, MI · You&apos;ll be notified when ready</p>
                  </div>
                  {shippingMethod === "pickup" && (
                    <span className="ml-auto mt-0.5 w-4 h-4 rounded-full bg-navy flex items-center justify-center flex-shrink-0">
                      <span className="w-2 h-2 rounded-full bg-white" />
                    </span>
                  )}
                </button>
              </div>
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
                  <span className="text-gray-600">Shipping</span>
                  {shippingFee > 0
                    ? <span className="font-semibold">${shippingFee.toFixed(2)}</span>
                    : <span className="font-semibold text-green-600">Free</span>}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-cream-dark pt-3 flex justify-between font-black text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              {shippingFee > 0 && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-tan/15 border border-tan/40 px-4 py-3">
                  <span className="text-lg leading-none">👢</span>
                  <p className="text-xs text-navy leading-relaxed">
                    <span className="font-bold">Add a pair of boots</span> to your order and shipping is <span className="font-bold text-green-700">free</span>.{" "}
                    <Link href="/shop" className="font-bold text-red hover:underline">Shop boots →</Link>
                  </p>
                </div>
              )}
              {salesPaused ? (
                <div className="space-y-3">
                  <span className="w-full py-4 text-base font-bold rounded-lg uppercase tracking-wide bg-gray-200 text-gray-400 text-center block cursor-not-allowed">
                    Ordering Paused
                  </span>
                  <SalesPausedBanner settings={siteSettings} />
                </div>
              ) : (
                <Link
                  href={`/checkout?shipping=${shippingMethod}${appliedCoupon ? `&coupon=${appliedCoupon}` : ""}`}
                  className="w-full py-4 text-base font-bold rounded-lg uppercase tracking-wide transition bg-amber-500 hover:bg-amber-400 text-white shadow-lg text-center block"
                >
                  Proceed to Checkout →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Cross-sell */}
        {crossSell.length > 0 && (
          <div className="mt-16 border-t border-gray-100 pt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-navy">You Might Also Like</h2>
              <Link href="/shop" className="text-sm font-bold text-navy hover:text-red transition">View all →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {crossSell.map((p) => (
                <ProductCard key={p.stockNo} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
