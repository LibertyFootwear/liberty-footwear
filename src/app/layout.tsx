import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import NewsletterPopup from "@/components/NewsletterPopup";
import PublicChrome from "@/components/PublicChrome";
import AnnouncementBar from "@/components/AnnouncementBar";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ForceEnglishValidation from "@/components/ForceEnglishValidation";
import { SITE_URL, jsonLd } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"] });

const DESCRIPTION =
  "Handcrafted work boots built in Grand Rapids, Michigan. Gary, Terry, Larry & Kenny styles – safety toe, waterproof, made to fit.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Liberty Footwear – Built in America",
  description: DESCRIPTION,
  applicationName: "Liberty Footwear",
  keywords: [
    "work boots", "American made work boots", "handcrafted work boots",
    "Grand Rapids Michigan boots", "safety toe boots", "waterproof work boots",
    "leather work boots", "Goodyear welt boots", "Liberty Footwear",
  ],
  authors: [{ name: "Liberty Footwear" }],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  verification: { google: "IwUKKXNzYl_5qFElWpdxT2sPAEBN0KWlsROW4XQncbg" },
  openGraph: {
    type: "website",
    siteName: "Liberty Footwear",
    locale: "en_US",
    url: SITE_URL,
    title: "Liberty Footwear – Built in America",
    description: "Handcrafted work boots built in America.",
    // A product photo converts on social shares far better than a bare logo.
    images: [{ url: "/images/hero-boots.jpg", width: 940, height: 788, alt: "Liberty Footwear handcrafted work boots" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liberty Footwear – Built in America",
    description: "Handcrafted work boots built in America.",
    images: ["/images/hero-boots.jpg"],
  },
};

const ORG_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ShoeStore",
  name: "Liberty Footwear",
  description: DESCRIPTION,
  url: SITE_URL,
  logo: `${SITE_URL}/logo/logo-800.png`,
  image: `${SITE_URL}/logo/logo-800.png`,
  telephone: "+1-616-930-3060",
  slogan: "Built in America",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Grand Rapids",
    addressRegion: "MI",
    addressCountry: "US",
  },
  areaServed: "US",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <GoogleAnalytics />
        <ForceEnglishValidation />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(ORG_JSONLD) }} />
        <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <PublicChrome banner={<AnnouncementBar />} header={<Header />} footer={<Footer />} popup={<NewsletterPopup />}>
              {children}
            </PublicChrome>
          </CartProvider>
        </AuthProvider>
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
