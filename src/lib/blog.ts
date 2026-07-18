import fs from "fs";
import path from "path";

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  image?: string;
  emoji?: string;
}

export interface Post extends PostMeta {
  contentHtml: string;
}

const postsDir = path.join(process.cwd(), "src/content/blog");

function ensureDir() {
  if (!fs.existsSync(postsDir)) fs.mkdirSync(postsDir, { recursive: true });
}

function parsePost(raw: string): { meta: Record<string, string>; body: string } {
  const fm = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fm) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of fm[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
  }
  return { meta, body: fm[2] };
}

function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}

export function getAllPosts(): PostMeta[] {
  ensureDir();
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), "utf-8");
      const { meta } = parsePost(raw);
      return {
        slug: file.replace(/\.md$/, ""),
        title: meta.title ?? file,
        date: meta.date ?? "",
        excerpt: meta.excerpt ?? "",
        image: meta.image,
        emoji: meta.emoji,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): Post | null {
  ensureDir();
  const filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { meta, body } = parsePost(raw);
  return {
    slug,
    title: meta.title ?? slug,
    date: meta.date ?? "",
    excerpt: meta.excerpt ?? "",
    image: meta.image,
    emoji: meta.emoji,
    contentHtml: mdToHtml(body),
  };
}
