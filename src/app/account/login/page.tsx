"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error ?? "Sign in failed. Please try again.");
    await refresh();
    router.push("/account");
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-navy mb-2">Sign In</h1>
        <p className="text-gray-500 mb-6 text-sm">Access your saved boots and order history.</p>

        {error && <p className="bg-red-50 text-red-700 rounded-lg px-4 py-2 mb-4 text-sm">{error}</p>}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" required value={form.email} onChange={set("email")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password" required value={form.password} onChange={set("password")}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-red text-white py-3 rounded-lg font-semibold hover:bg-red-dark transition disabled:opacity-60 mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link href="/account/register" className="text-navy font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
