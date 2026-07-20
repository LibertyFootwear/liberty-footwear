"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { useState } from "react";

export default function Header() {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const { lang, setLang, t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-navy text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo/logo-white.png"
              alt="Liberty Footwear – Built in America"
              width={220}
              height={111}
              className="h-16 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide uppercase">
            <Link href="/shop" className="hover:text-tan transition">{t.nav.shop}</Link>
            <Link href="/blog" className="hover:text-tan transition">{t.nav.blog}</Link>
            <Link href="/about" className="hover:text-tan transition">{t.nav.about}</Link>
            <Link href="/contact" className="hover:text-tan transition">{t.nav.contact}</Link>
          </nav>

          {/* Icons */}
          <div className="flex items-center gap-4">
            {/* Language switcher */}
            <button
              type="button"
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="hidden md:block text-xs font-bold border border-white/40 hover:border-white hover:bg-white/10 px-3 py-1.5 rounded-md transition cursor-pointer select-none"
              aria-label="Switch language"
            >
              {lang === "en" ? "ES" : "EN"}
            </button>
            {/* Account */}
            <Link href={user ? "/account" : "/account/login"} className="hover:text-tan transition relative" aria-label="My account">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {user && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-tan rounded-full border border-navy" />
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative hover:text-tan transition" aria-label="Shopping cart">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-3 text-sm font-semibold tracking-wide uppercase border-t border-white/20 pt-4">
            <Link href="/shop" onClick={() => setMenuOpen(false)} className="hover:text-tan">{t.nav.shop}</Link>
            <Link href="/blog" onClick={() => setMenuOpen(false)} className="hover:text-tan">{t.nav.blog}</Link>
            <Link href="/about" onClick={() => setMenuOpen(false)} className="hover:text-tan">{t.nav.about}</Link>
            <Link href="/contact" onClick={() => setMenuOpen(false)} className="hover:text-tan">{t.nav.contact}</Link>
            <Link href={user ? "/account" : "/account/login"} onClick={() => setMenuOpen(false)} className="hover:text-tan">
              {user ? `${t.nav.myAccount} (${user.name.split(" ")[0]})` : t.nav.signIn}
            </Link>
            <button
              onClick={() => setLang(lang === "en" ? "es" : "en")}
              className="text-left text-sm font-bold tracking-widest uppercase text-white/70 hover:text-white transition"
            >
              {lang === "en" ? "Español" : "English"}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
