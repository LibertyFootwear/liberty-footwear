import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { getAllPosts } from "@/lib/blog";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPaths: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/shop", priority: 0.9, freq: "weekly" },
    { path: "/about", priority: 0.7, freq: "monthly" },
    { path: "/about/story", priority: 0.6, freq: "monthly" },
    { path: "/blog", priority: 0.7, freq: "weekly" },
    { path: "/gallery", priority: 0.6, freq: "monthly" },
    { path: "/contact", priority: 0.6, freq: "monthly" },
    { path: "/faq", priority: 0.5, freq: "monthly" },
    { path: "/shipping", priority: 0.4, freq: "yearly" },
    { path: "/terms", priority: 0.3, freq: "yearly" },
    { path: "/privacy", priority: 0.3, freq: "yearly" },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((s) => ({
    url: `${SITE_URL}${s.path}`,
    lastModified: now,
    changeFrequency: s.freq,
    priority: s.priority,
  }));

  const productEntries: MetadataRoute.Sitemap = products
    .filter((p) => !p.hidden)
    .map((p) => ({ url: `${SITE_URL}/shop/${p.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.8 }));

  const blogEntries: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...productEntries, ...blogEntries];
}
