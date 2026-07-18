"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  newsletter: boolean;
  notifications: {
    specialOffers: boolean;
    newsletter: boolean;
    blog: boolean;
    newProducts: boolean;
  };
  favorites: string[];
  createdAt?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  toggleFavorite: (slug: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  refresh: async () => {},
  logout: async () => {},
  toggleFavorite: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/auth/me");
    setUser(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const toggleFavorite = async (slug: string) => {
    if (!user) return;
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    const data = await res.json();
    if (data.favorites) setUser({ ...user, favorites: data.favorites });
  };

  return (
    <Ctx.Provider value={{ user, loading, refresh, logout, toggleFavorite }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
