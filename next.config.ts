import type { NextConfig } from "next";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://maps.googleapis.com",
      "frame-src https://js.stripe.com https://maps.google.com https://www.google.com https://www.youtube-nocookie.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Keep Vercel Image Optimization usage low: fewer breakpoints = fewer
  // transformations per image, and a long cache TTL means each optimized
  // variant is generated once and reused for a month (image files are
  // content-addressed, so a changed photo gets a new URL anyway).
  images: {
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    minimumCacheTTL: 2678400, // 31 days
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  // 301s for leftover URLs from the old WordPress/WooCommerce site (Google still
  // has them; they were returning 404). Send them to the closest live page so no
  // link 404s and the SEO value carries over. Old media (.mp4 streams) are gone
  // for good and left to 404.
  async redirects() {
    return [
      // Corrected stock number (was a typo): old product URL → current one
      { source: "/shop/ks2121b-gary-ct-black-black", destination: "/shop/ks0221b-gary-ct-black-black", permanent: true },
      // Old WooCommerce product + category pages → the shop
      { source: "/the-store/:slug*", destination: "/shop", permanent: true },
      { source: "/product-category/:slug*", destination: "/shop", permanent: true },
      { source: "/category/:slug*", destination: "/shop", permanent: true },
      { source: "/shop-products", destination: "/shop", permanent: true },
      { source: "/safety", destination: "/shop", permanent: true },
      { source: "/hiking", destination: "/shop", permanent: true },
      // Old portfolio galleries → gallery
      { source: "/portfolio/:slug*", destination: "/gallery", permanent: true },
      // Old blog/story articles → blog
      { source: "/the-right-boot-for-your-job", destination: "/blog", permanent: true },
      { source: "/why-american-built-still-rules", destination: "/blog", permanent: true },
      { source: "/former-wolverine-employee-carves-out-niche", destination: "/blog", permanent: true },
      // Old info pages → nearest equivalent
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
      { source: "/contact-alternative", destination: "/contact", permanent: true },
      { source: "/returns-refunds-exchanges", destination: "/faq", permanent: true },
    ];
  },
};

export default nextConfig;
