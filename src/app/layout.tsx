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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Liberty Footwear – Built in America",
  description:
    "Handcrafted work boots built in Grand Rapids, Michigan. Gary, Terry, Larry & Kenny styles – safety toe, waterproof, made to fit.",
  openGraph: {
    title: "Liberty Footwear – Built in America",
    description: "Handcrafted work boots built in America.",
    images: ["/logo/logo-800.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-full flex flex-col`}>
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
