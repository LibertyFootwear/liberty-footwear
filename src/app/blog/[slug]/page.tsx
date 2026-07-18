import { getPostBySlug, getAllPosts } from "@/lib/blog";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import sanitizeHtml from "sanitize-html";
import BlogComments from "@/components/BlogComments";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return { title: `${post.title} | Liberty Footwear Blog` };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-cream border-b border-cream-dark py-4">
        <div className="max-w-3xl mx-auto px-4 text-sm text-gray-500">
          <Link href="/" className="hover:text-navy">Home</Link>
          {" / "}
          <Link href="/blog" className="hover:text-navy">Blog</Link>
          {" / "}
          <span className="text-navy font-medium">{post.title}</span>
        </div>
      </div>
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <p className="text-red text-xs font-bold uppercase tracking-widest mb-3">{post.date}</p>
        <h1 className="text-2xl sm:text-4xl font-black text-navy mb-8">{post.title}</h1>
        <div
          className="prose prose-lg prose-headings:text-navy prose-a:text-red max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.contentHtml, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img", "h1", "h2"]),
            allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ["src", "alt"] },
          }) }}
        />
        <BlogComments slug={post.slug} />
      </article>
    </div>
  );
}
