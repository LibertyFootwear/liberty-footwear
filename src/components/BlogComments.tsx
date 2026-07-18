"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import type { BlogComment } from "@/lib/commentsDb";

export default function BlogComments({ slug }: { slug: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  const load = useCallback(async () => {
    const res = await fetch(`/api/blog-comments?slug=${encodeURIComponent(slug)}`);
    if (res.ok) setComments(await res.json());
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("sending");
    const res = await fetch("/api/blog-comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, text }),
    });
    if (res.ok) {
      setText("");
      setStatus("ok");
      await load();
      setTimeout(() => setStatus("idle"), 3000);
    } else {
      setStatus("err");
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      <h2 className="text-2xl font-black text-navy mb-8">
        Comments {comments.length > 0 && <span className="text-gray-400 font-normal text-lg">({comments.length})</span>}
      </h2>

      {/* Comment list */}
      {comments.length === 0 ? (
        <p className="text-gray-400 text-sm mb-10">No comments yet — be the first!</p>
      ) : (
        <div className="space-y-6 mb-12">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-4">
              <div className="w-9 h-9 rounded-full bg-navy flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                {c.author.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-bold text-navy text-sm">{c.author}</span>
                  <span className="text-gray-400 text-xs">{formatDate(c.createdAt)}</span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      {user ? (
        <form onSubmit={submit} className="bg-cream rounded-2xl p-6">
          <p className="text-xs text-gray-500 mb-3">
            Commenting as <span className="font-bold text-navy">{user.name || user.email}</span>
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share your thoughts…"
            rows={4}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-navy transition resize-none mb-3"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "sending" || !text.trim()}
              className="bg-navy hover:bg-navy/80 disabled:opacity-50 text-white font-black text-sm px-6 py-2.5 rounded-xl transition"
            >
              {status === "sending" ? "Posting…" : "Post Comment"}
            </button>
            {status === "ok" && <span className="text-green-600 text-sm font-semibold">Comment posted!</span>}
            {status === "err" && <span className="text-red text-sm">Something went wrong. Try again.</span>}
          </div>
        </form>
      ) : (
        <div className="bg-cream rounded-2xl p-6 text-center">
          <p className="text-gray-600 text-sm mb-4">Sign in to leave a comment.</p>
          <Link href="/account/login" className="bg-navy text-white font-black text-sm px-6 py-2.5 rounded-xl hover:bg-navy/80 transition">
            Sign In
          </Link>
          <span className="mx-3 text-gray-400 text-sm">or</span>
          <Link href="/account/register" className="border-2 border-navy text-navy font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-navy hover:text-white transition">
            Create Account
          </Link>
        </div>
      )}
    </section>
  );
}
