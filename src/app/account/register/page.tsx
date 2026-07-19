"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

const BENEFITS = [
  { title: "Track your orders", body: "Follow every pair from our Grand Rapids factory to your door." },
  { title: "Save your favorites", body: "Build a wishlist of the boots you love and come back anytime." },
  { title: "Faster checkout", body: "Your details are saved, so ordering takes just a few clicks." },
  { title: "Order history", body: "Reorder your go-to boots without hunting for them again." },
];

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, password: form.password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Registration failed. Please try again.");
    await refresh();
    router.push("/account");
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl overflow-hidden grid md:grid-cols-2">
        {/* Benefits panel */}
        <div className="bg-navy text-white p-8 lg:p-10 flex flex-col justify-center">
          <p className="text-tan text-xs font-black tracking-widest uppercase mb-3">Why create an account?</p>
          <h2 className="text-2xl font-black leading-tight mb-8">Get more from<br />every pair.</h2>
          <ul className="space-y-5">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-3">
                <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-red flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <div>
                  <p className="font-bold text-sm">{b.title}</p>
                  <p className="text-white/60 text-xs leading-relaxed">{b.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <div className="p-8">
        <h1 className="text-2xl font-bold text-navy mb-2">Create an Account</h1>
        <p className="text-gray-500 mb-6 text-sm">It only takes a minute — and it's free.</p>

        {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text" required value={form.name} onChange={set("name")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="John Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email" required value={form.email} onChange={set("email")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel" value={form.phone} onChange={set("phone")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="+1 (616) 000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password" required value={form.password} onChange={set("password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="min. 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
            <input
              type="password" required value={form.confirm} onChange={set("confirm")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-red text-white py-3 rounded-lg font-semibold hover:bg-red-dark transition disabled:opacity-60 mt-2"
          >
            {loading ? "Creating account…" : "Create Account"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/account/login" className="text-navy font-medium hover:underline">
            Sign in
          </Link>
        </p>
        </div>
      </div>
    </main>
  );
}
