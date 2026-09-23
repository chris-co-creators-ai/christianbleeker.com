import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header, Footer } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/site-shell";
import { RevealObserver } from "@/components/sites/www-arturospatino-com-b978ad0e/shared/reveal-observer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chris Bleeker — Websites, marketing en AI",
  description: "Chris Bleeker maakt websites en digitale producten voor ondernemers en teams, met vijftien jaar marketingervaring en een menselijke blik op AI.",
  icons: { icon: "/chris/icon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><Header />{children}<Footer /><RevealObserver /></body>
    </html>
  );
}
