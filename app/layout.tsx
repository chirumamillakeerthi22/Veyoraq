import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { SignInPrompt } from "@/components/auth/sign-in-prompt";
import { BottomNav } from "@/components/bottom-nav";
import { SiteHeader } from "@/components/site-header";
import { brand } from "@/lib/brand";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

const title = `${brand.name} · ${brand.tagline}`;

export const metadata: Metadata = {
  title: {
    default: title,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
  openGraph: {
    type: "website",
    siteName: brand.name,
    title,
    description: brand.description,
  },
  twitter: {
    card: "summary",
    title,
    description: brand.description,
  },
};

// "cover" lets the page extend under the notch and home indicator; the header and
// bottom bar add safe-area padding so nothing important is hidden there.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f6f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} antialiased`}
    >
      <body className="flex min-h-dvh flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] font-sans md:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-soft-white focus:px-4 focus:py-3 focus:text-sm"
        >
          Skip to content
        </a>
        <SiteHeader />
        {/*
          Footers are chosen per route (see each route's layout.tsx and the homepage),
          so focused tools stay short and discovery pages keep the full footer. main
          is a column so a footer follows the content and sits at the bottom of short
          pages.
        */}
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
        <BottomNav />
        <SignInPrompt />
      </body>
    </html>
  );
}
