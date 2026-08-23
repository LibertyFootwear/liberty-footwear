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

/** Inline markdown: links, bold, italic. */
function inlineMd(s: string): string {
  return s
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

function mdToHtml(md: string): string {
  // Block-level parse (split on blank lines) so lists render as real lists.
  const blocks = md.trim().split(/\n{2,}/);
  const out: string[] = [];
  for (const block of blocks) {
    const b = block.trim();
    if (!b) continue;
    if (b.startsWith("<"))      { out.push(b); continue; } // raw HTML block (img, button, …) — pass through
    if (/^###\s+/.test(b))      { out.push(`<h3>${inlineMd(b.replace(/^###\s+/, ""))}</h3>`); continue; }
    if (/^##\s+/.test(b))       { out.push(`<h2>${inlineMd(b.replace(/^##\s+/, ""))}</h2>`); continue; }
    if (/^#\s+/.test(b))        { out.push(`<h1>${inlineMd(b.replace(/^#\s+/, ""))}</h1>`); continue; }
    const lines = b.split("\n");
    if (lines.every((l) => /^\s*[-*•●]\s+/.test(l))) {
      const items = lines.map((l) => `<li>${inlineMd(l.replace(/^\s*[-*•●]\s+/, ""))}</li>`).join("");
      out.push(`<ul>${items}</ul>`);
      continue;
    }
    out.push(`<p>${inlineMd(lines.join(" "))}</p>`);
  }
  return out.join("");
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
