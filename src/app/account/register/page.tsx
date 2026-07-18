"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

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
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-navy mb-2">Create an Account</h1>
        <p className="text-gray-500 mb-6 text-sm">Save your favorite boots and track your orders.</p>

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
    </main>
  );
}
