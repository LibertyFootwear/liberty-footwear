"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, Suspense } from "react";

function CheckoutForm() {
  const { items, subtotal } = useCart();
  const { user } = useAuth();
  const params = useSearchParams();
  const shippingMethod = (params.get("shipping") ?? "ship") as "ship" | "pickup";
  const coupon = params.get("coupon");

  const COUPONS: Record<string, number> = { LIBERTY10: 10, LIBERTY15: 15, WELCOME20: 20 };
  const discount = coupon ? (COUPONS[coupon] ?? 0) : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.06 * 100) / 100;
  const total = Math.round((taxableAmount + tax) * 100) / 100;

  const [form, setForm] = useState({
    firstName: user?.name?.split(" ")[0] ?? "",
    lastName: user?.name?.split(" ").slice(1).join(" ") ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = "Valid email required";
    if (!form.phone.trim()) e.phone = "Required";
    if (shippingMethod === "ship") {
      if (!form.address.trim()) e.address = "Required";
      if (!form.city.trim()) e.city = "Required";
      if (!form.state.trim()) e.state = "Required";
      if (!form.zip.trim()) e.zip = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
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
        coupon,
        discount,
        shippingMethod,
        billing: form,
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else { alert("Checkout error. Please try again."); setLoading(false); }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-6">Your cart is empty.</p>
        <Link href="/shop" className="bg-red text-white font-bold px-8 py-3 rounded-xl">Shop All Boots</Link>
      </div>
    );
  }

  const Field = ({ label, name, type = "text", half = false, placeholder = "" }: {
    label: string; name: string; type?: string; half?: boolean; placeholder?: string;
  }) => (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={(form as Record<string, string>)[name]}
        onChange={(e) => set(name, e.target.value)}
        placeholder={placeholder}
        className={`w-full border-2 rounded-lg px-4 py-3 text-sm focus:outline-none transition ${
          errors[name] ? "border-red" : "border-gray-200 focus:border-navy"
        }`}
      />
      {errors[name] && <p className="text-xs text-red mt-1">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="bg-cream border-b border-cream-dark py-6">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-sm text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-navy">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-navy">Cart</Link>
          <span>/</span>
          <span className="text-navy font-medium">Checkout</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-black text-navy mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Form */}
            <div className="lg:col-span-2 space-y-8">

              {/* Contact */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="font-black text-navy text-lg mb-5">Contact Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="First Name" name="firstName" half />
                  <Field label="Last Name" name="lastName" half />
                  <Field label="Email Address" name="email" type="email" />
                  <Field label="Phone Number" name="phone" type="tel" placeholder="(555) 000-0000" />
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-navy text-lg">Delivery</h2>
                  <Link href="/cart" className="text-xs text-navy hover:text-red font-semibold">Change</Link>
                </div>
                {shippingMethod === "pickup" ? (
                  <div className="flex items-center gap-3 bg-cream rounded-xl p-4">
                    <span className="text-2xl">🏪</span>
                    <div>
                      <p className="font-bold text-navy text-sm">Pick up in store</p>
                      <p className="text-xs text-gray-500">Free · Grand Rapids, MI · You&apos;ll be notified when ready</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 bg-cream rounded-xl p-4 mb-5">
                      <span className="text-2xl">📦</span>
                      <div>
                        <p className="font-bold text-navy text-sm">Ship to me</p>
                        <p className="text-xs text-gray-500">Free · 3–7 business days</p>
                      </div>
                    </div>
                    <h3 className="font-bold text-navy text-sm mb-4">Shipping Address</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Street Address" name="address" />
                      <Field label="City" name="city" half />
                      <Field label="State" name="state" half placeholder="MI" />
                      <Field label="ZIP Code" name="zip" half placeholder="49501" />
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Country</label>
                        <select
                          value={form.country}
                          onChange={(e) => set("country", e.target.value)}
                          className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-navy transition"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-cream rounded-2xl p-6 sticky top-24">
                <h2 className="font-black text-navy text-lg mb-5">Order Summary</h2>

                <div className="space-y-3 mb-5">
                  {items.map((item) => (
                    <div key={`${item.product.stockNo}-${item.size}`} className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-100">
                        {item.product.image && (
                          <Image src={item.product.image} alt={item.product.name} fill className="object-contain p-1 mix-blend-multiply" sizes="48px" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-navy truncate">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.product.colorLeather} · {item.size} · ×{item.qty}</p>
                      </div>
                      <p className="text-xs font-black text-gray-900 flex-shrink-0">${item.product.price * item.qty}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-cream-dark pt-4 space-y-2 text-sm mb-5">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-semibold">${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon ({coupon})</span>
                      <span className="font-semibold">−${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-green-600">Free</span>
                  </div>
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
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-base font-bold rounded-xl uppercase tracking-wide transition bg-amber-500 hover:bg-amber-400 text-white shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Redirecting…" : "Continue to Payment →"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">You&apos;ll be redirected to Stripe for secure payment.</p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutForm />
    </Suspense>
  );
}
