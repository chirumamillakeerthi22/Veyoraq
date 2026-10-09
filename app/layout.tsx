import type { Metadata } from "next";
import { Cormorant_Garamond, Geist } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
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

export const metadata: Metadata = {
  title: {
    default: "VEYORAQ · Style, decoded.",
    template: "%s · VEYORAQ",
  },
  description:
    "VEYORAQ is a personal styling and fashion discovery platform. Get to know your style, make more of your wardrobe, and discover pieces that feel like you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-soft-white focus:px-4 focus:py-3 focus:text-sm"
        >
          Skip to content
        </a>
        <p className="bg-espresso px-4 py-2 text-center text-xs tracking-[0.12em] text-ivory">
          Your wardrobe. Your style. A little more clarity.
        </p>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
