"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function FavoriteButton({ slug, className = "" }: { slug: string; className?: string }) {
  const { user, toggleFavorite } = useAuth();
  const router = useRouter();
  const isFav = user?.favorites.includes(slug) ?? false;

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { router.push("/account/login"); return; }
    await toggleFavorite(slug);
  };

  return (
    <button
      onClick={handle}
      aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
      className={`w-8 h-8 flex items-center justify-center rounded-full transition ${
        isFav ? "bg-red text-white" : "bg-white/80 text-gray-400 hover:text-red"
      } shadow ${className}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
