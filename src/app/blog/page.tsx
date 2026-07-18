import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog – Liberty Footwear",
  description: "Boot care tips, industry news and stories from Liberty Footwear.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-tan text-xs font-bold tracking-widest uppercase mb-3">From the Workshop</p>
          <h1 className="text-4xl font-black mb-3">The Liberty Blog</h1>
          <p className="text-white/70">Boot care tips, industry news, and stories from the field.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <p className="text-center text-gray-400 py-20">Blog posts coming soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition"
                >
                  <div className="relative h-48 bg-cream overflow-hidden">
                    {post.image ? (
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" /></svg>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="text-xs text-red font-bold uppercase tracking-wide mb-2">{post.date}</p>
                    <h2 className="text-xl font-black text-navy mb-2 group-hover:text-red transition">{post.title}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
