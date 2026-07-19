"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/LanguageContext";

const HOURS = [
  { day: "Mon – Fri", time: "10 am – 6 pm" },
  { day: "Saturday", time: "9 am – 4 pm" },
  { day: "Sunday", time: "Closed" },
];

export default function ContactPage() {
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setStatus(res.ok ? "ok" : "error");
  }

  return (
    <div className="bg-white">
      <section className="bg-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-black mb-3">{t.contact.h1}</h1>
          <p className="text-white/70">Questions about sizing, orders, or custom options? We&apos;d love to hear from you.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Left – form */}
          <div>
            <h2 className="text-2xl font-black text-navy mb-6">Send Us a Message</h2>
            {status === "ok" ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-navy mb-2">Message Sent!</h2>
                <p className="text-gray-500">We typically respond within 1–2 business days.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.contact.name}</label>
                    <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-navy transition" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.contact.email}</label>
                    <input type="email" required value={form.email} onChange={(e) => set("email", e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-navy transition" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.contact.subject}</label>
                  <input value={form.subject} onChange={(e) => set("subject", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-navy transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{t.contact.message}</label>
                  <textarea required rows={6} value={form.message} onChange={(e) => set("message", e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-navy transition resize-none" />
                </div>
                {status === "error" && (
                  <p className="text-red text-sm">Something went wrong – please try again.</p>
                )}
                <button type="submit" disabled={status === "loading"} className="w-full py-4 text-lg font-black bg-red hover:bg-red/90 active:scale-[0.98] text-white rounded-xl transition shadow-lg shadow-red/30 disabled:opacity-60 tracking-wide uppercase">
                  {status === "loading" ? t.contact.sending : t.contact.send}
                </button>
              </form>
            )}
          </div>

          {/* Right – info + map */}
          <div className="space-y-8">

            {/* Address & phone */}
            <div>
              <h2 className="text-2xl font-black text-navy mb-5">Visit Our Factory Outlet Store</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="mt-1 text-red flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">1750 Alpine Ave NW</p>
                    <p className="text-gray-500">Grand Rapids, MI 49504</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="mt-1 text-red flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 9a16 16 0 0 0 6 6l1.27-.95a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <a href="tel:6169303060" className="font-semibold text-gray-900 hover:text-red transition">
                    616.930.3060
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Factory Outlet Store Hours</h3>
              <div className="bg-cream rounded-xl overflow-hidden">
                {HOURS.map(({ day, time }) => (
                  <div key={day} className="flex justify-between items-center px-5 py-3 border-b border-cream-dark last:border-0">
                    <span className="font-medium text-gray-700">{day}</span>
                    <span className={time === "Closed" ? "text-red font-semibold" : "text-gray-900 font-semibold"}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase text-gray-400 mb-3">Location</h3>
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <iframe
                  title="Liberty Footwear Factory Outlet Store"
                  src="https://maps.google.com/maps?q=1750+Alpine+Ave+NW,+Grand+Rapids,+MI+49504&output=embed"
                  width="100%"
                  height="260"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <a
                href="https://maps.google.com/?q=1750+Alpine+Ave+NW,+Grand+Rapids,+MI+49504"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-navy font-medium hover:text-red transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3"/>
                </svg>
                Get directions in Google Maps
              </a>
            </div>

          </div>
        </div>
      </section>
      {/* Custom Fitting + Bulk Orders */}
      <section className="py-16 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-red text-xs font-bold tracking-widest uppercase mb-3">Specialized Services</p>
            <h2 className="text-3xl font-black text-navy">Custom Fitting & Bulk Orders</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Custom Fitting */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-3xl mb-4">👞</div>
              <h3 className="text-xl font-black text-navy mb-2">Custom Fitting</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-5">
                Visit our Grand Rapids factory outlet store for a personalized fitting — no appointment needed. We measure both feet individually and help you choose the right last, width, leather, and sole for your work.
              </p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                {["Individual foot measurement", "Last & width selection", "Made-to-order options", "Safety toe & EH rating available"].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="tel:6169303060" className="inline-flex items-center gap-2 text-navy font-bold text-sm hover:text-red transition">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.69 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.6 1.27h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L7.91 9a16 16 0 006 6l1.27-.95a2 2 0 012.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>
                Call 616.930.3060
              </a>
            </div>

            {/* Bulk Orders */}
            <div className="bg-navy text-white rounded-2xl p-8">
              <div className="mb-4">
                <svg className="w-9 h-9 text-tan" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                </svg>
              </div>
              <h3 className="text-xl font-black mb-2">Bulk & Corporate Orders</h3>
              <p className="text-white/75 text-sm leading-relaxed mb-5">
                Outfitting a crew or company? We offer volume discounts starting at 10 pairs, custom sizing runs, and on-site fitting sessions for larger orders in West Michigan and beyond.
              </p>
              <ul className="space-y-2 text-sm text-white/75 mb-6">
                {["Volume pricing from 10+ pairs", "Custom sizing runs for your team", "On-site fitting for 20+ pair orders", "Corporate invoicing available"].map(item => (
                  <li key={item} className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-tan mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector<HTMLInputElement>('input[placeholder]');
                  if (el) { el.scrollIntoView({ behavior: "smooth" }); }
                  const subjectInput = document.querySelector<HTMLInputElement>('input:nth-of-type(3)');
                  if (subjectInput) subjectInput.value = "Bulk Order Inquiry";
                }}
                className="inline-flex items-center gap-2 bg-red hover:bg-red/90 text-white font-bold px-5 py-2.5 rounded-lg transition text-sm"
              >
                Send Us a Message Above
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
