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
import GoogleAnalytics from "@/components/GoogleAnalytics";
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
  openGraph: {
    type: "website",
    siteName: "Liberty Footwear",
    locale: "en_US",
    url: SITE_URL,
    title: "Liberty Footwear – Built in America",
    description: "Handcrafted work boots built in America.",
    images: [{ url: "/logo/logo-800.png", alt: "Liberty Footwear" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Liberty Footwear – Built in America",
    description: "Handcrafted work boots built in America.",
    images: ["/logo/logo-800.png"],
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
            <PublicChrome header={<Header />} footer={<Footer />} popup={<NewsletterPopup />}>
              {children}
            </PublicChrome>
          </CartProvider>
        </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
